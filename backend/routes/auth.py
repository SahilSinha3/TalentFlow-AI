from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from database import get_database
from models.user import UserRegister, UserLogin, TokenResponse, UserResponse
from config import settings
import hashlib
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    return hashlib.sha256((password + settings.JWT_SECRET).encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
        
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "createdAt": user.get("createdAt", datetime.now(timezone.utc))
    }

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    db = get_database()
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "passwordHash": hash_password(user_data.password),
        "createdAt": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(new_user)
    user_id = str(result.inserted_id)

    # Initialize default settings for user
    default_settings = {
        "userId": user_id,
        "gmailEmail": user_data.email.lower(),
        "gmailAppPassword": "",
        "geminiApiKey": "",
        "portfolioUrl": "",
        "resumeText": "",
        "targetRoles": ["Full Stack Developer", "AI Engineer"],
        "targetLocations": ["Remote", "United States", "India"],
        "remotePreference": "Remote",
        "maxEmailsPerDay": 15,
        "maxPostingAgeDays": 3,
        "selectedTone": "SHORT_DIRECT",
        "customTonePrompt": "Keep cold email concise, high value, under 100 words.",
        "agentMode": "LOW",
        "agentStatus": "RUNNING",
        "updatedAt": datetime.now(timezone.utc)
    }
    await db.user_settings.insert_one(default_settings)

    token = create_access_token({"sub": user_id})
    user_res = UserResponse(id=user_id, name=user_data.name, email=user_data.email.lower(), createdAt=new_user["createdAt"])
    return TokenResponse(access_token=token, user=user_res)

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": user_data.email.lower()})
    if not user or user["passwordHash"] != hash_password(user_data.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token({"sub": user_id})
    user_res = UserResponse(id=user_id, name=user["name"], email=user["email"], createdAt=user.get("createdAt", datetime.now(timezone.utc)))
    return TokenResponse(access_token=token, user=user_res)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
