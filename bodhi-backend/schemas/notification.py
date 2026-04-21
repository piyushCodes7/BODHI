from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from models.notification import NotificationType

_ORM = ConfigDict(from_attributes=True)

class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str

class NotificationRead(NotificationBase):
    model_config = _ORM
    id: str
    user_id: str
    is_read: bool
    created_at: datetime
