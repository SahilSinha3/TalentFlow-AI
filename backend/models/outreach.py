from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OutreachLogCreate(BaseModel):
    jobLeadId: str
    recipientEmail: str
    company: str
    role: str
    subject: str
    emailBody: str
    status: str = "QUEUED"  # QUEUED, SENT, FAILED, REPLIED
    sentAt: Optional[datetime] = None
    errorMessage: Optional[str] = None
    
    # Follow-Up Fields
    followUpStatus: str = "NONE"  # NONE, FOLLOWUP_QUEUED, FOLLOWUP_SENT, FOLLOWUP_FAILED
    followUpScheduledAt: Optional[datetime] = None
    followUpSentAt: Optional[datetime] = None
    followUpSubject: Optional[str] = None
    followUpBody: Optional[str] = None

class ScheduleFollowUpRequest(BaseModel):
    daysDelay: int = Field(3, ge=1, le=30)
    customSubject: Optional[str] = None
    customBody: Optional[str] = None

class OutreachLogResponse(OutreachLogCreate):
    id: str
    userId: str
    createdAt: datetime
