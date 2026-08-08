from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database import get_database
from models.user import UserSettingsUpdate, UserSettingsResponse
from routes.auth import get_current_user
from datetime import datetime, timezone
import pypdf
import io

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("", response_model=UserSettingsResponse)
async def get_settings(current_user: dict = Depends(get_current_user)):
    db = get_database()
    settings = await db.user_settings.find_one({"userId": current_user["id"]})
    if not settings:
        default_s = {
            "userId": current_user["id"],
            "gmailEmail": current_user["email"],
            "gmailAppPassword": "",
            "geminiApiKey": "",
            "portfolioUrl": "",
            "githubUrl": "",
            "linkedinUrl": "",
            "resumeDriveUrl": "",
            "resumeText": "",
            "sampleEmailText": "",
            "writingStyleRules": "Concise, punchy, confident tone with clear project metrics.",
            "targetRoles": ["Full Stack Developer", "AI Engineer"],
            "targetLocations": ["Remote", "United States", "India"],
            "remotePreference": "Remote",
            "maxEmailsPerDay": 15,
            "maxPostingAgeDays": 3,
            "selectedTone": "SHORT_DIRECT",
            "customTonePrompt": "Keep cold email under 100 words.",
            "agentMode": "LOW",
            "agentStatus": "RUNNING",
            "updatedAt": datetime.now(timezone.utc)
        }
        await db.user_settings.insert_one(default_s)
        return UserSettingsResponse(**default_s)

    settings["userId"] = current_user["id"]
    return UserSettingsResponse(**settings)

@router.put("", response_model=UserSettingsResponse)
async def update_settings(update_data: UserSettingsUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updatedAt"] = datetime.now(timezone.utc)

    await db.user_settings.update_one(
        {"userId": current_user["id"]},
        {"$set": update_dict},
        upsert=True
    )

    updated = await db.user_settings.find_one({"userId": current_user["id"]})
    updated["userId"] = current_user["id"]
    return UserSettingsResponse(**updated)

@router.post("/upload-resume")
async def upload_pdf_resume(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Extracts plain text from uploaded PDF resume and updates user resumeText in MongoDB."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resume files are accepted.")

    try:
        contents = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
        extracted_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text + "\n"

        extracted_text = extracted_text.strip()
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF file. It might be scanned/image-based.")

        db = get_database()
        await db.user_settings.update_one(
            {"userId": current_user["id"]},
            {"$set": {
                "resumeText": extracted_text,
                "updatedAt": datetime.now(timezone.utc)
            }}
        )

        return {
            "status": "success",
            "message": f"Successfully parsed {len(extracted_text)} characters from {file.filename}!",
            "resumeText": extracted_text[:500] + "..."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing error: {str(e)}")
