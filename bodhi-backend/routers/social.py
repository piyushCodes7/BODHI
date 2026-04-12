# routers/social.py
# Optimized for BODHI (FastAPI + SQLAlchemy Async)

import secrets
import string
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

# Project-specific imports
from database import get_db
from services.auth_service import get_current_user
from models.social import (
    Club, ClubMember, Contribution, Invitation,
    ClubComment, VentureBet, BetPosition,
    ClubType, MemberRole, InviteStatus, BetStatus,
)
from core.schemas import (
    ClubCreate, ClubUpdate, ClubOut, ClubDetail,
    ContributionCreate, ContributionOut,
    InviteCreate, InviteAccept, InvitationOut,
    CommentCreate, CommentOut,
    VentureBetCreate, BetPositionCreate, VentureBetOut,
    SocialDashboard,
)

router = APIRouter()

INVITE_EXPIRE_HOURS = 72

# ── Helpers ───────────────────────────────────────────────────

def _gen_invite_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def _gen_token(length: int = 48) -> str:
    return secrets.token_urlsafe(length)

async def _get_club_or_404(club_id: int, db: AsyncSession) -> Club:
    # EAGER LOADING: Added selectinload to prevent MissingGreenlet errors
    result = await db.execute(
        select(Club)
        .options(
            selectinload(Club.members),
            selectinload(Club.contributions),
            selectinload(Club.comments),
            selectinload(Club.venture_bets).selectinload(VentureBet.positions),
        )
        .where(Club.id == club_id)
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    return club

async def _assert_member(club: Club, user_id: int, role: Optional[MemberRole] = None):
    membership = next((m for m in club.members if m.user_id == user_id), None)
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this club")
    if role and membership.role != role:
        raise HTTPException(status_code=403, detail=f"Action requires '{role}' role")
    return membership

def _club_to_out(club: Club, latest_comment: Optional[ClubComment] = None) -> dict:
    lc = None
    if latest_comment:
        lc = {
            "id": latest_comment.id,
            "user_id": latest_comment.user_id,
            "username": f"user_{latest_comment.user_id}",
            "body": latest_comment.body,
            "created_at": latest_comment.created_at,
        }
    return {
        "id":             club.id,
        "name":           club.name,
        "description":    club.description,
        "emoji":          club.emoji,
        "club_type":      club.club_type,
        "goal_amount":    club.goal_amount,
        "currency":       club.currency,
        "is_public":      club.is_public,
        "invite_code":    club.invite_code,
        "deadline":       club.deadline,
        "created_by":     club.created_by,
        "created_at":     club.created_at,
        "total_pooled":   club.total_pooled, # Calculated in model
        "member_count":   club.member_count,
        "progress_pct":   club.progress_pct,
        "latest_comment": lc,
    }

# ── Dashboard ────────────────────────────────────────────────

@router.get("/dashboard", response_model=SocialDashboard)
async def social_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    uid = current_user.id

    # 1. Fetch user memberships
    memberships_q = await db.execute(
        select(ClubMember.club_id).where(ClubMember.user_id == uid)
    )
    my_club_ids = [row[0] for row in memberships_q.fetchall()]

    # 2. Fetch Club Data with eager loading
    my_clubs = []
    if my_club_ids:
        clubs_q = await db.execute(
            select(Club)
            .options(
                selectinload(Club.members),
                selectinload(Club.contributions),
                selectinload(Club.comments),
            )
            .where(Club.id.in_(my_club_ids))
            .order_by(Club.updated_at.desc())
        )
        my_clubs = clubs_q.scalars().all()

    # 3. Pending invitations
    invites_q = await db.execute(
        select(Invitation)
        .options(selectinload(Invitation.club))
        .where(
            and_(
                Invitation.invitee_user_id == uid,
                Invitation.status == InviteStatus.PENDING,
                Invitation.expires_at > datetime.utcnow(),
            )
        )
    )
    invitations = invites_q.scalars().all()

    # 4. Aggregates
    net_q = await db.execute(
        select(func.sum(Contribution.amount))
        .where(and_(Contribution.user_id == uid, Contribution.status == "confirmed"))
    )
    social_net = float(net_q.scalar() or 0.0)

    clubs_out = [_club_to_out(club, club.comments[0] if club.comments else None) for club in my_clubs]

    return {
        "my_clubs":           clubs_out,
        "open_invitations":   [{"id": i.id, "club_name": i.club.name, "token": i.token} for i in invitations],
        "social_net_value":   social_net,
        "total_clubs":        len(my_clubs),
        "total_contributed":  social_net,
    }

# ── Club CRUD ────────────────────────────────────────────────

@router.post("/clubs", response_model=ClubOut, status_code=201)
async def create_club(
    body: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    # Unique invite code generation
    code = _gen_invite_code()
    
    club = Club(
        name=body.name,
        description=body.description,
        emoji=body.emoji,
        club_type=body.club_type,
        goal_amount=body.goal_amount,
        currency=body.currency,
        is_public=body.is_public,
        invite_code=code,
        deadline=body.deadline,
        created_by=current_user.id,
    )
    db.add(club)
    await db.flush() 

    membership = ClubMember(
        club_id=club.id,
        user_id=current_user.id,
        role=MemberRole.ADMIN,
    )
    db.add(membership)
    await db.commit()
    
    # Reload with eager loading to prevent MissingGreenlet in response mapping
    return _club_to_out(await _get_club_or_404(club.id, db))

@router.post("/contribute", response_model=ContributionOut, status_code=201)
async def contribute(
    body: ContributionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    club = await _get_club_or_404(body.club_id, db)
    await _assert_member(club, current_user.id)

    contrib = Contribution(
        club_id=body.club_id,
        user_id=current_user.id,
        amount=body.amount,
        note=body.note,
        status="confirmed",
    )
    db.add(contrib)
    
    if body.amount >= 1000:
        db.add(ClubComment(
            club_id=body.club_id,
            user_id=current_user.id,
            body=f"Contributed ₹{body.amount:,.0f}! 🚀",
        ))

    await db.commit()
    await db.refresh(contrib)
    return contrib

# ── Invitations & Community ──────────────────────────────────

@router.post("/invite/accept", status_code=200)
async def accept_invite(
    body: InviteAccept,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(
        select(Invitation)
        .options(selectinload(Invitation.club).selectinload(Club.members))
        .where(Invitation.token == body.token)
    )
    invite = result.scalar_one_or_none()
    
    if not invite or invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Invite expired or invalid")

    already = any(m.user_id == current_user.id for m in invite.club.members)
    if not already:
        db.add(ClubMember(club_id=invite.club_id, user_id=current_user.id, role=MemberRole.MEMBER))

    invite.status = InviteStatus.ACCEPTED
    invite.invitee_user_id = current_user.id
    await db.commit()

    return {"success": True, "club_id": invite.club_id}

# ── End of Router ───────────────────────────────────────────