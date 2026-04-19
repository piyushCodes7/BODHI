"""
routers/social.py
Social Hub API — Shared Investments & Shared Trip Wallets
FastAPI + SQLAlchemy Async (BODHI stack)

Endpoints:
  GET /social/investments  → User's active investment groups with per-user share
  GET /social/trips        → User's active trip wallets with spent/owed amounts
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from services.auth_service import get_current_user
from models.social import (
    InvestmentGroup,
    InvestmentMember,
    InvestmentStatus,
    TripWallet,
    TripMember,
    TripExpense,
    TripSplit,
    TripStatus,
    SplitType,
)

router = APIRouter(prefix="/social", tags=["social"])

# ── POST Schemas ──
class CreateGroupReq(BaseModel):
    name: str

class CreateExpenseReq(BaseModel):
    description: str
    amount: float

class ContributeReq(BaseModel):
    amount: float

# ── Response Schemas ───────────────────────────────────────────────────────────

class InvestmentGroupOut(BaseModel):
    """
    Mirrors exactly what SocialScreen.tsx needs for each venture card.
    All monetary values are pre-formatted strings (₹X,XX,XXX.XX).
    """
    id:             int
    name:           str
    emoji:          str
    member_count:   int
    pending_votes:  int = Field(description="Total open votes for the current user")
    total_value:    str = Field(description="Formatted total portfolio value e.g. ₹2,45,680.50")
    total_returns:  str = Field(description="Formatted return amount e.g. +₹18,750.30")
    returns_pct:    str = Field(description="Formatted return percentage e.g. +8.25%")
    your_share:     str = Field(description="Formatted rupee value of user's ownership slice")
    status:         str
    invite_code:    str
    created_at:     datetime

    class Config:
        from_attributes = True


class TripWalletOut(BaseModel):
    """
    Mirrors exactly what SocialScreen.tsx needs for each trip card.
    `you_owe` is positive when user owes money; negative when others owe them.
    """
    id:             int
    name:           str
    emoji:          str
    member_count:   int
    status_label:   str = Field(description="Human-readable status e.g. 'Just started'")
    total_balance:  str = Field(description="Formatted total wallet balance e.g. ₹62,340.00")
    you_spent:      str = Field(description="Formatted total paid by current user e.g. ₹8,120.00")
    you_owe:        str = Field(description="Formatted net amount owed by user e.g. ₹2,430.00")
    you_owe_raw:    float = Field(description="Raw net owed (positive = you owe, negative = owed to you)")
    invite_code:    str
    created_at:     datetime

    class Config:
        from_attributes = True


class SocialDashboardOut(BaseModel):
    investments:    List[InvestmentGroupOut]
    trips:          List[TripWalletOut]
    # Aggregates for a future summary widget
    total_invested: str
    total_trips:    int


# ── Formatting Helpers ─────────────────────────────────────────────────────────

def _fmt_inr(amount: float, sign: bool = False) -> str:
    """
    Format a float as an Indian-locale rupee string.
    e.g. 245680.50 → '₹2,45,680.50'
    sign=True prepends '+' for positive values (for returns display).
    """
    prefix = ""
    if sign and amount > 0:
        prefix = "+"
    elif amount < 0:
        prefix = "-"
        amount = abs(amount)

    # Indian number system: last 3 digits, then pairs
    int_part = int(amount)
    dec_part = round((amount - int_part) * 100)
    s = str(int_part)
    if len(s) > 3:
        last3 = s[-3:]
        rest = s[:-3]
        # Group rest in pairs from the right
        groups = []
        while len(rest) > 2:
            groups.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.insert(0, rest)
        s = ",".join(groups) + "," + last3
    return f"{prefix}₹{s}.{dec_part:02d}"


def _fmt_pct(value: float, sign: bool = True) -> str:
    prefix = "+" if (sign and value > 0) else ("-" if value < 0 else "")
    return f"{prefix}{abs(value):.2f}%"


def _status_label(trip: TripWallet) -> str:
    if trip.status == TripStatus.SETTLED:
        return "Settled"
    if trip.start_date and trip.start_date > datetime.utcnow():
        return "Upcoming"
    if not trip.expenses:
        return "Just started"
    return "In progress"


# ── Shared Query Helpers ───────────────────────────────────────────────────────

async def _investment_groups_for_user(
    uid: str, db: AsyncSession
) -> List[InvestmentGroup]:
    """Load all ACTIVE investment groups the user belongs to, with members eager-loaded."""
    member_ids_q = await db.execute(
        select(InvestmentMember.group_id).where(InvestmentMember.user_id == uid)
    )
    group_ids = [r[0] for r in member_ids_q.fetchall()]
    if not group_ids:
        return []

    result = await db.execute(
        select(InvestmentGroup)
        .options(selectinload(InvestmentGroup.members))
        .where(
            and_(
                InvestmentGroup.id.in_(group_ids),
                InvestmentGroup.status == InvestmentStatus.ACTIVE,
            )
        )
        .order_by(InvestmentGroup.updated_at.desc())
    )
    return result.scalars().all()


async def _trip_wallets_for_user(uid: str, db: AsyncSession) -> List[TripWallet]:
    """Load all ACTIVE trip wallets the user belongs to, with expenses + splits eager-loaded."""
    member_ids_q = await db.execute(
        select(TripMember.trip_id).where(TripMember.user_id == uid)
    )
    trip_ids = [r[0] for r in member_ids_q.fetchall()]
    if not trip_ids:
        return []

    result = await db.execute(
        select(TripWallet)
        .options(
            selectinload(TripWallet.members),
            selectinload(TripWallet.expenses).selectinload(TripExpense.splits),
        )
        .where(
            and_(
                TripWallet.id.in_(trip_ids),
                TripWallet.status == TripStatus.ACTIVE,
            )
        )
        .order_by(TripWallet.updated_at.desc())
    )
    return result.scalars().all()


# ── Per-User Trip Calculations ─────────────────────────────────────────────────

def _calculate_trip_figures(trip: TripWallet, uid: str) -> tuple[float, float]:
    """
    Returns (you_spent, you_owe_net) for `uid` across all expenses in `trip`.

    you_spent   = total amount uid paid (as the payer) across all expenses
    you_owe_net = (sum of uid's splits that are unsettled) minus
                  (unsettled amounts others owe uid as payer)
                  Positive → uid owes the group
                  Negative → group owes uid
    """
    you_spent: float = 0.0
    your_liability: float = 0.0   # what you owe to others as a splitee
    others_owe_you: float = 0.0   # what others owe you because you paid

    for expense in trip.expenses:
        # Amount this user paid out-of-pocket
        if expense.paid_by_user_id == uid:
            you_spent += expense.amount

        for split in expense.splits:
            split_amount = _resolve_split_amount(split, expense)

            if split.is_settled:
                continue

            if split.user_id == uid and expense.paid_by_user_id != uid:
                # Unsettled share the current user owes to the payer
                your_liability += split_amount
            elif split.user_id != uid and expense.paid_by_user_id == uid:
                # Unsettled share another member owes to the current user
                others_owe_you += split_amount

    you_owe_net = round(your_liability - others_owe_you, 2)
    return round(you_spent, 2), you_owe_net


def _resolve_split_amount(split: TripSplit, expense: TripExpense) -> float:
    """Convert a split record to its actual rupee value."""
    if expense.split_type == SplitType.PERCENTAGE:
        return expense.amount * split.amount   # split.amount is 0–1
    return split.amount                        # EQUAL or EXACT: already in rupees


# ── Endpoint: GET /social/investments ─────────────────────────────────────────

@router.get("/investments", response_model=List[InvestmentGroupOut])
async def get_investments(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns all ACTIVE investment groups the current user is a member of.
    Each item includes the user's personal share value and pending vote count.
    """
    uid: str = current_user.id
    groups = await _investment_groups_for_user(uid, db)

    out: List[InvestmentGroupOut] = []
    for group in groups:
        membership = next((m for m in group.members if m.user_id == uid), None)
        if not membership:
            continue  # safety guard — shouldn't happen

        share_val = group.member_share(uid)

        out.append(
            InvestmentGroupOut(
                id=group.id,
                name=group.name,
                emoji=group.emoji,
                member_count=group.member_count,
                pending_votes=membership.pending_votes,
                total_value=_fmt_inr(group.total_value),
                total_returns=_fmt_inr(group.total_returns, sign=True),
                returns_pct=_fmt_pct(group.returns_pct),
                your_share=_fmt_inr(share_val),
                status=group.status.value,
                invite_code=group.invite_code,
                created_at=group.created_at,
            )
        )

    return out


# ── Endpoint: GET /social/trips ────────────────────────────────────────────────

@router.get("/trips", response_model=List[TripWalletOut])
async def get_trips(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Returns all ACTIVE trip wallets the current user is a member of.
    Each item includes how much the user has spent and their current net balance
    (positive = they owe the group; negative = the group owes them).
    """
    uid: str = current_user.id
    trips = await _trip_wallets_for_user(uid, db)

    out: List[TripWalletOut] = []
    for trip in trips:
        you_spent, you_owe_net = _calculate_trip_figures(trip, uid)

        out.append(
            TripWalletOut(
                id=trip.id,
                name=trip.name,
                emoji=trip.emoji,
                member_count=trip.member_count,
                status_label=_status_label(trip),
                total_balance=_fmt_inr(trip.total_balance),
                you_spent=_fmt_inr(you_spent),
                you_owe=_fmt_inr(abs(you_owe_net)),
                you_owe_raw=you_owe_net,
                invite_code=trip.invite_code,
                created_at=trip.created_at,
            )
        )

    return out


# ── Endpoint: GET /social/dashboard ───────────────────────────────────────────

@router.get("/dashboard", response_model=SocialDashboardOut)
async def social_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Composite endpoint — returns both investments and trips in one call.
    Ideal for the initial Social Hub screen load.
    """
    uid: str = current_user.id

    groups = await _investment_groups_for_user(uid, db)
    trips  = await _trip_wallets_for_user(uid, db)

    # ── Investment items ──────────────────────────────────────
    investment_items: List[InvestmentGroupOut] = []
    total_invested_raw: float = 0.0

    for group in groups:
        membership = next((m for m in group.members if m.user_id == uid), None)
        if not membership:
            continue
        share_val = group.member_share(uid)
        total_invested_raw += share_val

        investment_items.append(
            InvestmentGroupOut(
                id=group.id,
                name=group.name,
                emoji=group.emoji,
                member_count=group.member_count,
                pending_votes=membership.pending_votes,
                total_value=_fmt_inr(group.total_value),
                total_returns=_fmt_inr(group.total_returns, sign=True),
                returns_pct=_fmt_pct(group.returns_pct),
                your_share=_fmt_inr(share_val),
                status=group.status.value,
                invite_code=group.invite_code,
                created_at=group.created_at,
            )
        )

    # ── Trip items ────────────────────────────────────────────
    trip_items: List[TripWalletOut] = []

    for trip in trips:
        you_spent, you_owe_net = _calculate_trip_figures(trip, uid)
        trip_items.append(
            TripWalletOut(
                id=trip.id,
                name=trip.name,
                emoji=trip.emoji,
                member_count=trip.member_count,
                status_label=_status_label(trip),
                total_balance=_fmt_inr(trip.total_balance),
                you_spent=_fmt_inr(you_spent),
                you_owe=_fmt_inr(abs(you_owe_net)),
                you_owe_raw=you_owe_net,
                invite_code=trip.invite_code,
                created_at=trip.created_at,
            )
        )

    return SocialDashboardOut(
        investments=investment_items,
        trips=trip_items,
        total_invested=_fmt_inr(total_invested_raw),
        total_trips=len(trip_items),
    )

# ── Endpoint: POST /social/investments ──
@router.post("/investments")
async def create_investment_group(
    req: CreateGroupReq,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    import string
    import random
    # Generate a random 6-character invite code
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # 1. Create the Group
    new_group = InvestmentGroup(
        name=req.name,
        created_by=current_user.id,
        invite_code=code,
        status=InvestmentStatus.ACTIVE
    )
    db.add(new_group)
    await db.flush() # Get the new ID

    # 2. Add the creator as the first Admin member (100% share initially)
    new_member = InvestmentMember(
        group_id=new_group.id,
        user_id=current_user.id,
        share_percentage=100.0,
        is_admin=True
    )
    db.add(new_member)
    await db.commit()
    
    return {"message": "Investment group created", "id": new_group.id}

# ── Endpoint: POST /social/trips ──
@router.post("/trips")
async def create_trip_wallet(
    req: CreateGroupReq,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    import string
    import random
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # 1. Create the Wallet
    new_trip = TripWallet(
        name=req.name,
        created_by=current_user.id,
        invite_code=code,
        status=TripStatus.ACTIVE
    )
    db.add(new_trip)
    await db.flush()

    # 2. Add the creator as the first Admin member
    new_member = TripMember(
        trip_id=new_trip.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(new_member)
    await db.commit()
    
    return {"message": "Trip wallet created", "id": new_trip.id}

# ── Endpoint: GET /social/trips/{trip_id} ──
@router.get("/trips/{trip_id}")
async def get_trip_details(
    trip_id: int,
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Fetch the trip along with its members and expenses
    query = select(TripWallet).options(
        selectinload(TripWallet.members),
        selectinload(TripWallet.expenses)
    ).where(TripWallet.id == trip_id)
    
    result = await db.execute(query)
    trip = result.scalar_one_or_none()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    # Calculate balances (simplified Splitwise logic)
    # Everyone gets an equal share of the total expenses
    total_expenses = sum(exp.amount for exp in trip.expenses)
    member_count = len(trip.members) if len(trip.members) > 0 else 1
    split_amount = total_expenses / member_count
    
    member_balances = []
    for member in trip.members:
        # How much this specific user paid
        paid_by_user = sum(exp.amount for exp in trip.expenses if exp.recorded_by == member.user_id)
        # Balance = What they paid - What they owe
        balance = paid_by_user - split_amount
        member_balances.append({
            "user_id": member.user_id,
            "contributed": paid_by_user,
            "balance": balance
        })

    return {
        "id": trip.id,
        "name": trip.name,
        "total_expenses": total_expenses,
        "expenses": [{"id": e.id, "desc": e.description, "amount": e.amount, "paid_by": e.recorded_by} for e in trip.expenses],
        "members": member_balances
    }

# ── Endpoint: POST /social/trips/{trip_id}/expenses ──
@router.post("/trips/{trip_id}/expenses")
async def add_trip_expense(
    trip_id: int, 
    req: CreateExpenseReq,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    new_expense = TripExpense(
        trip_id=trip_id,
        recorded_by=current_user.id,
        amount=req.amount,
        description=req.description,
        currency="INR"
    )
    db.add(new_expense)
    
    # Update the total expenses in the wallet
    trip = await db.get(TripWallet, trip_id)
    if trip:
        trip.total_expenses += req.amount
        
    await db.commit()
    return {"message": "Expense added successfully"}

# ── Endpoint: GET /social/trips/{trip_id}/settle ──
@router.get("/trips/{trip_id}/settle")
async def get_trip_settlement_plan(
    trip_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # 1. Fetch the trip and expenses
    query = select(TripWallet).options(
        selectinload(TripWallet.members),
        selectinload(TripWallet.expenses)
    ).where(TripWallet.id == trip_id)
    
    result = await db.execute(query)
    trip = result.scalar_one_or_none()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    total_expenses = sum(exp.amount for exp in trip.expenses)
    if total_expenses == 0:
        return {"transactions": []} # Nothing to settle!
        
    member_count = len(trip.members) if len(trip.members) > 0 else 1
    split_amount = total_expenses / member_count
    
    # 2. Separate into Debtors (owe money) and Creditors (are owed money)
    debtors = []
    creditors = []
    
    for member in trip.members:
        paid_by_user = sum(exp.amount for exp in trip.expenses if exp.recorded_by == member.user_id)
        balance = paid_by_user - split_amount
        
        # We use a tiny threshold (0.01) to ignore floating point math rounding errors
        if balance < -0.01:
            debtors.append({"user_id": member.user_id, "amount": abs(balance)})
        elif balance > 0.01:
            creditors.append({"user_id": member.user_id, "amount": balance})

    # 3. Greedy Algorithm to match Debtors and Creditors
    # Sort them so largest debts are paid to largest creditors first
    debtors.sort(key=lambda x: x["amount"], reverse=True)
    creditors.sort(key=lambda x: x["amount"], reverse=True)
    
    transactions = []
    i, j = 0, 0
    
    while i < len(debtors) and j < len(creditors):
        debt_amt = debtors[i]["amount"]
        cred_amt = creditors[j]["amount"]
        
        # Find the minimum amount that can be transferred between the two
        settle_amt = min(debt_amt, cred_amt)
        
        transactions.append({
            "from_user": debtors[i]["user_id"],
            "to_user": creditors[j]["user_id"],
            "amount": round(settle_amt, 2)
        })
        
        # Adjust remaining balances
        debtors[i]["amount"] -= settle_amt
        creditors[j]["amount"] -= settle_amt
        
        # Move to the next person if they are fully settled
        if debtors[i]["amount"] < 0.01:
            i += 1
        if creditors[j]["amount"] < 0.01:
            j += 1

    return {"transactions": transactions}

    # ── Endpoint: GET /social/investments/{club_id} ──
@router.get("/investments/{club_id}")
async def get_club_details(
    club_id: int, # <--- CHANGE THIS FROM str TO int
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Fetch the group to get its total buying power
    query = select(InvestmentGroup).where(InvestmentGroup.id == club_id)
    result = await db.execute(query)
    club = result.scalar_one_or_none()
    
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
        
    return {
        "id": club.id,
        "name": club.name,
        "buying_power": getattr(club, 'total_balance', 0.0) # Assuming you have a total_balance column
    }

# ── Endpoint: POST /social/investments/{club_id}/contribute ──
@router.post("/investments/{club_id}/contribute")
async def add_club_funds(
    club_id: int, # <--- CHANGE THIS FROM str TO int
    req: ContributeReq,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # 1. Update the Group's total pool
    group = await db.get(InvestmentGroup, club_id)
    if not group:
        raise HTTPException(status_code=404, detail="Club not found")
    
    # Initialize total_balance if it's currently None
    if not hasattr(group, 'total_balance') or group.total_balance is None:
        group.total_balance = 0.0
        
    group.total_balance += req.amount

    # 2. Update or Create the Member's individual contribution
    mem_query = select(InvestmentMember).where(
        InvestmentMember.group_id == club_id, 
        InvestmentMember.user_id == current_user.id
    )
    mem_result = await db.execute(mem_query)
    member = mem_result.scalar_one_or_none()

    if member:
        # Initialize contributed amount if None
        if not hasattr(member, 'contributed_amount') or member.contributed_amount is None:
            member.contributed_amount = 0.0
        member.contributed_amount += req.amount
    else:
        # If they aren't a member yet, add them!
        new_member = InvestmentMember(
            group_id=club_id,
            user_id=current_user.id,
            contributed_amount=req.amount,
            is_admin=False
        )
        db.add(new_member)

    await db.commit()
    return {"message": "Funds added successfully", "new_balance": group.total_balance}

# ── DELETE INVESTMENT CLUB ──
@router.delete("/investments/{club_id}")
async def delete_investment_club(
    club_id: int, # <--- MUST BE int
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    group = await db.get(InvestmentGroup, club_id)
    if not group:
        raise HTTPException(status_code=404, detail="Club not found")
    
    await db.delete(group)
    await db.commit() # <--- Crucial to actually save the deletion
    return {"message": "Club deleted successfully"}

# ── DELETE TRIP WALLET ──
@router.delete("/trips/{trip_id}")
async def delete_trip_wallet(
    trip_id: int, # <--- MUST BE int
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    trip = await db.get(TripWallet, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    await db.delete(trip)
    await db.commit()
    return {"message": "Trip deleted successfully"}