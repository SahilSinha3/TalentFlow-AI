from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    createdAt: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserSettingsUpdate(BaseModel):
    gmailEmail: Optional[str] = None
    gmailAppPassword: Optional[str] = None
    geminiApiKey: Optional[str] = None
    portfolioUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    resumeDriveUrl: Optional[str] = None
    resumeText: Optional[str] = None
    sampleEmailText: Optional[str] = None
    writingStyleRules: Optional[str] = None
    targetRoles: Optional[List[str]] = Field(default_factory=lambda: ["Full Stack Developer", "AI Engineer"])
    targetLocations: Optional[List[str]] = Field(default_factory=lambda: ["Remote", "United States", "India"])
    remotePreference: Optional[str] = "Remote"
    maxEmailsPerDay: Optional[int] = 15
    maxPostingAgeDays: Optional[int] = 3
    selectedTone: Optional[str] = "SHORT_DIRECT"
    customTonePrompt: Optional[str] = "Keep cold email under 100 words, direct, highlighting key project achievements."
    agentMode: Optional[str] = "LOW"
    agentStatus: Optional[str] = "RUNNING"

class UserSettingsResponse(UserSettingsUpdate):
    userId: str
    updatedAt: datetime
