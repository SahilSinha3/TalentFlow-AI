from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class JobLeadCreate(BaseModel):
    title: str
    company: str
    source: str  # Reddit, HackerNews, Remotive, WWR, RemoteOK, Jobspresso
    sourceUrl: str
    description: str
    postedAt: datetime
    recruiterEmail: Optional[str] = None
    recruiterName: Optional[str] = None
    matchScore: int = 0
    matchReasoning: Optional[str] = None
    status: str = "DISCOVERED"  # DISCOVERED, DRAFTED, QUEUED, SENT, IGNORED

class JobLeadResponse(JobLeadCreate):
    id: str
    userId: str
    createdAt: datetime
