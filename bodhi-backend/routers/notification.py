from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, desc

from database import get_db
from models.core import User
from models.notification import Notification, NotificationType
from schemas.notification import NotificationRead
from services.auth_service import get_current_user

router = APIRouter()

async def seed_mock_notifications(db: AsyncSession, user_id: str):
    mocks = [
        {
            "type": NotificationType.INFO,
            "title": "Welcome to BODHI!",
            "message": "Start exploring your vault and AI insights to grow your wealth."
        },
        {
            "type": NotificationType.TRADE,
            "title": "Market Alert",
            "message": "NIFTY 50 is up 1.2% today. Check your holdings for updates."
        },
        {
            "type": NotificationType.ALERT,
            "title": "Security Update",
            "message": "Two-factor authentication is now available for your account."
        },
        {
            "type": NotificationType.SUCCESS,
            "title": "Balance Added",
            "message": "₹1,00,000 has been credited to your paper trading wallet."
        }
    ]
    
    for mock in mocks:
        notif = Notification(
            user_id=user_id,
            type=mock["type"],
            title=mock["title"],
            message=mock["message"]
        )
        db.add(notif)
    
    await db.commit()

@router.get("/", response_model=list[NotificationRead])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user has any notifications
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id)
    )
    notifs = result.scalars().all()
    
    if not notifs:
        # Seed some data for the user if they have none
        await seed_mock_notifications(db, current_user.id)
        result = await db.execute(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(desc(Notification.created_at))
        )
        notifs = result.scalars().all()
    
    return notifs

@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notif = result.scalar_one_or_none()
    
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    await db.commit()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
