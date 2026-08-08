from fastapi import APIRouter, Depends, HTTPException, Body
from database import get_database
from routes.auth import get_current_user
from services.worker_service import run_agent_worker_for_user
from services.mailer_service import send_gmail_smtp
from services.gemini_service import generate_followup_email
from models.outreach import ScheduleFollowUpRequest
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/agent", tags=["Agent Operations"])

@router.post("/run")
async def trigger_agent_run(current_user: dict = Depends(get_current_user)):
    """Triggers an immediate background sourcing & outreach cycle for the current user."""
    res = await run_agent_worker_for_user(current_user["id"])
    return res

@router.post("/control")
async def control_agent(
    status: str = Body(..., embed=True),  # RUNNING, PAUSED, STOPPED
    mode: str = Body(None, embed=True),    # LOW, MEDIUM, HIGH
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    update_data = {"agentStatus": status, "updatedAt": datetime.now(timezone.utc)}
    if mode:
        update_data["agentMode"] = mode

    await db.user_settings.update_one(
        {"userId": current_user["id"]},
        {"$set": update_data}
    )
    return {"status": "success", "agentStatus": status, "agentMode": mode}

@router.post("/send-email/{outreach_id}")
async def approve_and_send_email(outreach_id: str, current_user: dict = Depends(get_current_user)):
    """Manual 1-click approval & send for a queued cold email draft."""
    db = get_database()
    outreach = await db.outreach_logs.find_one({
        "_id": ObjectId(outreach_id),
        "userId": current_user["id"]
    })
    
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach draft not found")

    settings = await db.user_settings.find_one({"userId": current_user["id"]})
    gmail_email = settings.get("gmailEmail")
    gmail_pass = settings.get("gmailAppPassword")

    if not gmail_email or not gmail_pass:
        raise HTTPException(status_code=400, detail="Gmail App Password is not configured in Settings.")

    try:
        await send_gmail_smtp(
            sender_email=gmail_email,
            app_password=gmail_pass,
            recipient_email=outreach["recipientEmail"],
            subject=outreach["subject"],
            body=outreach["emailBody"]
        )
        
        await db.outreach_logs.update_one(
            {"_id": ObjectId(outreach_id)},
            {"$set": {
                "status": "SENT",
                "sentAt": datetime.now(timezone.utc),
                "errorMessage": None
            }}
        )
        
        if outreach.get("jobLeadId"):
            await db.job_leads.update_one(
                {"_id": ObjectId(outreach["jobLeadId"])},
                {"$set": {"status": "SENT"}}
            )
            
        return {"status": "success", "message": f"Email successfully sent to {outreach['recipientEmail']}"}
    except Exception as e:
        await db.outreach_logs.update_one(
            {"_id": ObjectId(outreach_id)},
            {"$set": {
                "status": "FAILED",
                "errorMessage": str(e)
            }}
        )
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/schedule-followup/{outreach_id}")
async def schedule_follow_up(
    outreach_id: str,
    req: ScheduleFollowUpRequest,
    current_user: dict = Depends(get_current_user)
):
    """Schedules a Gemini-generated cold email follow-up for a recruiter outreach lead."""
    db = get_database()
    outreach = await db.outreach_logs.find_one({
        "_id": ObjectId(outreach_id),
        "userId": current_user["id"]
    })

    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach log not found")

    settings = await db.user_settings.find_one({"userId": current_user["id"]})
    gemini_key = settings.get("geminiApiKey", "")

    # Draft follow-up email via Gemini
    followup_draft = await generate_followup_email(outreach, settings, gemini_key)

    scheduled_date = datetime.now(timezone.utc) + timedelta(days=req.daysDelay)

    subject = req.customSubject or followup_draft.get("subject", f"Re: {outreach['subject']}")
    body = req.customBody or followup_draft.get("emailBody", "")

    await db.outreach_logs.update_one(
        {"_id": ObjectId(outreach_id)},
        {"$set": {
            "followUpStatus": "FOLLOWUP_QUEUED",
            "followUpScheduledAt": scheduled_date,
            "followUpSubject": subject,
            "followUpBody": body
        }}
    )

    return {
        "status": "success",
        "message": f"Follow-up scheduled for {scheduled_date.strftime('%Y-%m-%d')} ({req.daysDelay} days delay).",
        "followUpSubject": subject,
        "followUpBody": body,
        "followUpScheduledAt": scheduled_date
    }

@router.post("/send-followup/{outreach_id}")
async def send_scheduled_followup(outreach_id: str, current_user: dict = Depends(get_current_user)):
    """Dispatches a scheduled follow-up email immediately via Gmail SMTP."""
    db = get_database()
    outreach = await db.outreach_logs.find_one({
        "_id": ObjectId(outreach_id),
        "userId": current_user["id"]
    })

    if not outreach or not outreach.get("followUpSubject"):
        raise HTTPException(status_code=400, detail="No scheduled follow-up email found.")

    settings = await db.user_settings.find_one({"userId": current_user["id"]})
    gmail_email = settings.get("gmailEmail")
    gmail_pass = settings.get("gmailAppPassword")

    if not gmail_email or not gmail_pass:
        raise HTTPException(status_code=400, detail="Gmail credentials missing in Settings.")

    try:
        await send_gmail_smtp(
            sender_email=gmail_email,
            app_password=gmail_pass,
            recipient_email=outreach["recipientEmail"],
            subject=outreach["followUpSubject"],
            body=outreach["followUpBody"]
        )

        await db.outreach_logs.update_one(
            {"_id": ObjectId(outreach_id)},
            {"$set": {
                "followUpStatus": "FOLLOWUP_SENT",
                "followUpSentAt": datetime.now(timezone.utc)
            }}
        )

        return {"status": "success", "message": f"Follow-up email successfully sent to {outreach['recipientEmail']}"}
    except Exception as e:
        await db.outreach_logs.update_one(
            {"_id": ObjectId(outreach_id)},
            {"$set": {"followUpStatus": "FOLLOWUP_FAILED"}}
        )
        raise HTTPException(status_code=500, detail=f"Failed to send follow-up: {str(e)}")
