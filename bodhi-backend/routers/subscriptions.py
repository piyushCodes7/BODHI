from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.core import UserSubscription, SubscriptionStatus
from services.auth_service import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

# --- JSON Data structure for the unified marketplace ---
SUBSCRIPTION_CATEGORIES = [
  {
    "categoryId": "1",
    "categoryName": "Entertainment",
    "icon": "Tv",
    "subscriptions": [
      {
        "id": "netflix",
        "name": "Netflix",
        "plansSummary": "Mobile • Basic • Premium",
        "borderColor": "#E50914",
        "logoUrl": "https://www.google.com/s2/favicons?domain=netflix.com&sz=128",
        "availablePlans": [
          { "name": "Mobile", "price": "149", "features": "480p • 1 Screen", "url": "https://www.netflix.com/signup/planconf" },
          { "name": "Basic", "price": "199", "features": "720p • 1 Screen", "url": "https://www.netflix.com/signup/planconf" },
          { "name": "Standard", "price": "499", "features": "1080p • 2 Screens", "url": "https://www.netflix.com/signup/planconf" },
          { "name": "Premium", "price": "649", "features": "4K+HDR • 4 Screens", "url": "https://www.netflix.com/signup/planconf" }
        ]
      },
      {
        "id": "prime",
        "name": "Amazon Prime",
        "plansSummary": "Lite • Monthly • Annual",
        "borderColor": "#00A8E1",
        "logoUrl": "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
        "availablePlans": [
          { "name": "Monthly", "price": "299", "features": "Prime Video + Music", "url": "https://www.amazon.in/amazonprime" },
          { "name": "Annual", "price": "1499", "features": "Best Value • 1 Year", "url": "https://www.amazon.in/amazonprime" },
          { "name": "Lite", "price": "799", "features": "Annual • Ads on Video", "url": "https://www.amazon.in/amazonprime" }
        ]
      },
      {
        "id": "hotstar",
        "name": "Jio + Hotstar",
        "plansSummary": "Super • Premium",
        "borderColor": "#0061FF",
        "logoUrl": "https://www.google.com/s2/favicons?domain=hotstar.com&sz=128",
        "availablePlans": [
          { "name": "Super", "price": "899", "features": "Full HD • 2 Screens", "url": "https://www.hotstar.com/subscribe/get-started" },
          { "name": "Premium", "price": "1499", "features": "4K • 4 Screens • No Ads", "url": "https://www.hotstar.com/subscribe/get-started" }
        ]
      },
      { "id": "youtube", "name": "YouTube Premium", "plansSummary": "Indiv • Family • Student", "borderColor": "#FF0000", "logoUrl": "https://www.google.com/s2/favicons?domain=youtube.com&sz=128", "availablePlans": [{ "name": "Individual", "price": "129", "url": "https://www.youtube.com/premium" }] },
      { "id": "sonyliv", "name": "SonyLIV", "plansSummary": "Mobile • Premium", "borderColor": "#E2A014", "logoUrl": "https://www.google.com/s2/favicons?domain=sonyliv.com&sz=128", "availablePlans": [{ "name": "Premium", "price": "299", "url": "https://www.sonyliv.com/subscription" }] },
      { "id": "zee5", "name": "ZEE5", "plansSummary": "Premium 4K", "borderColor": "#8230C6", "logoUrl": "https://www.google.com/s2/favicons?domain=zee5.com&sz=128", "availablePlans": [{ "name": "Premium", "price": "499", "url": "https://www.zee5.com/myaccount/subscription" }] },
      { "id": "appletv", "name": "Apple TV+", "plansSummary": "Individual", "borderColor": "#FFFFFF", "logoUrl": "https://www.google.com/s2/favicons?domain=apple.com&sz=128", "availablePlans": [{ "name": "Monthly", "price": "99", "url": "https://www.apple.com/in/apple-tv-plus/" }] }
    ]
  },
  {
    "categoryId": "2",
    "categoryName": "Productivity",
    "icon": "Briefcase",
    "subscriptions": [
      {
        "id": "m365",
        "name": "Microsoft 365",
        "plansSummary": "Personal • Family",
        "borderColor": "#D83B01",
        "logoUrl": "https://www.google.com/s2/favicons?domain=microsoft.com&sz=128",
        "availablePlans": [
          { "name": "Personal", "price": "489", "features": "1 User • 1TB Cloud", "url": "https://www.microsoft.com/en-in/microsoft-365/buy/microsoft-365" },
          { "name": "Family", "price": "619", "features": "6 Users • 6TB Cloud", "url": "https://www.microsoft.com/en-in/microsoft-365/buy/microsoft-365" }
        ]
      },
      { "id": "googleone", "name": "Google One", "plansSummary": "100GB • 200GB • 2TB", "borderColor": "#4285F4", "logoUrl": "https://www.google.com/s2/favicons?domain=google.com&sz=128", "availablePlans": [{ "name": "Basic", "price": "130", "url": "https://one.google.com/about/plans" }] },
      { "id": "notion", "name": "Notion", "plansSummary": "Plus • Business", "borderColor": "#AAAAAA", "logoUrl": "https://www.google.com/s2/favicons?domain=notion.so&sz=128", "availablePlans": [{ "name": "Plus", "price": "820", "url": "https://www.notion.so/pricing" }] },
      { "id": "canva", "name": "Canva Pro", "plansSummary": "Indiv • Team", "borderColor": "#00C4CC", "logoUrl": "https://www.google.com/s2/favicons?domain=canva.com&sz=128", "availablePlans": [{ "name": "Pro", "price": "499", "url": "https://www.canva.com/pro/" }] },
      { "id": "chatgpt", "name": "ChatGPT Plus", "plansSummary": "GPT-4 Access", "borderColor": "#10A37F", "logoUrl": "https://www.google.com/s2/favicons?domain=openai.com&sz=128", "availablePlans": [{ "name": "Plus", "price": "1650", "url": "https://chat.openai.com/invite/accepted" }] },
      { "id": "linkedin", "name": "LinkedIn Premium", "plansSummary": "Career • Business", "borderColor": "#0A66C2", "logoUrl": "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128", "availablePlans": [{ "name": "Career", "price": "1499", "url": "https://www.linkedin.com/premium/" }] }
    ]
  },
  {
    "categoryId": "3",
    "categoryName": "Lifestyle & Music",
    "icon": "Music",
    "subscriptions": [
      { "id": "spotify", "name": "Spotify Premium", "plansSummary": "Mini • Individual • Duo", "borderColor": "#1DB954", "logoUrl": "https://www.google.com/s2/favicons?domain=spotify.com&sz=128", "availablePlans": [{ "name": "Individual", "price": "119", "url": "https://www.spotify.com/in-en/premium/" }] },
      { "id": "apple-music", "name": "Apple Music", "plansSummary": "Student • Indiv • Family", "borderColor": "#FA243C", "logoUrl": "https://www.google.com/s2/favicons?domain=music.apple.com&sz=128", "availablePlans": [{ "name": "Individual", "price": "99", "url": "https://www.apple.com/in/apple-music/" }] },
      { "id": "zomato", "name": "Zomato Gold", "plansSummary": "3 Months", "borderColor": "#E23744", "logoUrl": "https://www.google.com/s2/favicons?domain=zomato.com&sz=128", "availablePlans": [{ "name": "Gold", "price": "299", "url": "https://www.zomato.com/gold" }] },
      { "id": "swiggy", "name": "Swiggy One", "plansSummary": "Lite • One", "borderColor": "#FC8019", "logoUrl": "https://www.google.com/s2/favicons?domain=swiggy.com&sz=128", "availablePlans": [{ "name": "One", "price": "249", "url": "https://www.swiggy.com/swiggy-one" }] },
      { "id": "cultfit", "name": "Cult.fit", "plansSummary": "Elite • Pro", "borderColor": "#000000", "logoUrl": "https://www.google.com/s2/favicons?domain=cult.fit&sz=128", "availablePlans": [{ "name": "Elite", "price": "1249", "url": "https://www.cult.fit/me/memberships" }] }
    ]
  },
  {
    "categoryId": "4",
    "categoryName": "Finance & Education",
    "icon": "BookOpen",
    "subscriptions": [
      { "id": "groww", "name": "Groww", "plansSummary": "Mutual Funds • Stocks", "borderColor": "#00D09C", "logoUrl": "https://www.google.com/s2/favicons?domain=groww.in&sz=128", "availablePlans": [{ "name": "Free", "price": "0", "features": "Invest in MFs & Stocks", "url": "https://groww.in/" }] },
      { "id": "unacademy", "name": "Unacademy", "plansSummary": "Plus • Iconic", "borderColor": "#08BD80", "logoUrl": "https://www.google.com/s2/favicons?domain=unacademy.com&sz=128", "availablePlans": [{ "name": "Plus", "price": "1250", "features": "All courses • Live classes", "url": "https://unacademy.com/subscription" }] },
      { "id": "audible", "name": "Audible", "plansSummary": "Monthly", "borderColor": "#F8991D", "logoUrl": "https://www.google.com/s2/favicons?domain=audible.in&sz=128", "availablePlans": [{ "name": "Monthly", "price": "199", "features": "1 Audiobook/month", "url": "https://www.audible.in/ep/freetrial" }] }
    ]
  }
]

# --- Schemas ---
class SubscriptionPlan(BaseModel):
    name: str
    price: str
    features: str | None = None
    url: str

class SubscriptionItem(BaseModel):
    id: str
    name: str
    plansSummary: str
    borderColor: str
    logoUrl: str
    availablePlans: List[SubscriptionPlan]

class SubscriptionCategory(BaseModel):
    categoryId: str
    categoryName: str
    icon: str
    subscriptions: List[SubscriptionItem]

class AddSubscriptionReq(BaseModel):
    platform_id: str
    platform_name: str
    expected_monthly_cost: float = 0.0

# --- Endpoints ---

@router.get("/catalog", response_model=List[SubscriptionCategory])
async def get_subscription_catalog():
    """
    Returns the dynamic catalog of subscriptions available to explore.
    """
    return SUBSCRIPTION_CATEGORIES


@router.post("/vault/add")
async def add_subscription_to_vault(
    sub: AddSubscriptionReq,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Adds a selected subscription to the user's Vault for tracking recurring expenses.
    """
    next_billing_date = date.today() + timedelta(days=30)
    
    new_sub = UserSubscription(
        user_id=current_user.id,
        platform_id=sub.platform_id,
        platform_name=sub.platform_name,
        expected_monthly_cost=sub.expected_monthly_cost,
        status=SubscriptionStatus.ACTIVE,
        next_billing_date=next_billing_date
    )
    
    db.add(new_sub)
    await db.commit()
    
    return {
        "status": "success",
        "message": f"{sub.platform_name} added to Vault",
        "next_charge": next_billing_date.isoformat()
    }
