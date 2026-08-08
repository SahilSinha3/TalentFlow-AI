import asyncio
from datetime import datetime, timezone
from database import get_database
from services.scrapers.orchestrator import aggregate_all_free_jobs
from services.gemini_service import extract_and_score_job_lead, generate_cold_email
from services.mailer_service import send_gmail_smtp
from bson import ObjectId

async def run_agent_worker_for_user(user_id: str):
    """
    Executes the full AI Agent cycle for a specific user:
    Scrape -> Age & Location Filter -> Score -> Draft -> Send / Queue based on Agent Mode & Daily Cap.
    """
    db = get_database()
    if db is None:
        print("Database not connected. Skipping worker cycle.")
        return {"status": "error", "message": "Database not connected"}
        
    user_settings = await db.user_settings.find_one({"userId": user_id})
    if not user_settings:
        print(f"No settings found for user {user_id}. Skipping worker.")
        return {"status": "error", "message": "User settings not found"}

    status = user_settings.get("agentStatus", "RUNNING")
    if status != "RUNNING":
        print(f"Agent for user {user_id} is {status}. Skipping cycle.")
        return {"status": "paused", "message": f"Agent is {status}"}

    mode = user_settings.get("agentMode", "LOW")
    daily_limit = user_settings.get("maxEmailsPerDay", 15)
    gemini_key = user_settings.get("geminiApiKey", "")
    gmail_email = user_settings.get("gmailEmail", "")
    gmail_pass = user_settings.get("gmailAppPassword", "")

    # Check how many emails sent today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    emails_sent_today = await db.outreach_logs.count_documents({
        "userId": user_id,
        "status": "SENT",
        "sentAt": {"$gte": today_start}
    })

    print(f"Agent cycle starting for User {user_id} [Mode: {mode}, Sent Today: {emails_sent_today}/{daily_limit}]")

    # 1. Scrape all free platforms with user location & work arrangement filters
    fresh_leads = await aggregate_all_free_jobs(user_settings=user_settings)
    
    processed_count = 0
    drafted_count = 0
    sent_count = 0

    for lead in fresh_leads[:15]:  # Process batch of top fresh leads
        # Check if already processed
        existing = await db.job_leads.find_one({"userId": user_id, "sourceUrl": lead["sourceUrl"]})
        if existing:
            continue
            
        # 2. Extract details & score fit via Gemini API
        score_res = await extract_and_score_job_lead(lead, user_settings, gemini_key)
        
        job_doc = {
            "userId": user_id,
            "title": lead["title"],
            "company": lead["company"],
            "source": lead["source"],
            "sourceUrl": lead["sourceUrl"],
            "description": lead["description"],
            "postedAt": lead["postedAt"],
            "recruiterEmail": score_res.get("recruiterEmail"),
            "recruiterName": score_res.get("recruiterName", "Hiring Manager"),
            "matchScore": score_res.get("matchScore", 70),
            "matchReasoning": score_res.get("matchReasoning", ""),
            "status": "DISCOVERED",
            "createdAt": datetime.now(timezone.utc)
        }
        
        inserted_job = await db.job_leads.insert_one(job_doc)
        job_id = str(inserted_job.inserted_id)
        processed_count += 1

        # Only draft/outreach if recruiter email exists and fit score >= 70
        recruiter_email = score_res.get("recruiterEmail")
        if not recruiter_email or score_res.get("matchScore", 0) < 70:
            continue

        # 3. Draft cold email via Gemini API
        email_draft = await generate_cold_email(lead, user_settings, gemini_key)
        drafted_count += 1

        # Determine send vs queue
        auto_send = (mode in ["MEDIUM", "HIGH"]) and (score_res.get("matchScore", 0) >= 85) and (emails_sent_today < daily_limit) and gmail_email and gmail_pass

        outreach_doc = {
            "userId": user_id,
            "jobLeadId": job_id,
            "recipientEmail": recruiter_email,
            "company": lead["company"],
            "role": lead["title"],
            "subject": email_draft.get("subject", ""),
            "emailBody": email_draft.get("emailBody", ""),
            "status": "SENT" if auto_send else "QUEUED",
            "sentAt": datetime.now(timezone.utc) if auto_send else None,
            "createdAt": datetime.now(timezone.utc),
            "errorMessage": None
        }

        if auto_send:
            try:
                await send_gmail_smtp(gmail_email, gmail_pass, recruiter_email, email_draft["subject"], email_draft["emailBody"])
                emails_sent_today += 1
                sent_count += 1
            except Exception as e:
                print(f"Failed to auto-send email to {recruiter_email}: {e}")
                outreach_doc["status"] = "FAILED"
                outreach_doc["errorMessage"] = str(e)

        await db.outreach_logs.insert_one(outreach_doc)
        await db.job_leads.update_one({"_id": ObjectId(job_id)}, {"$set": {"status": outreach_doc["status"]}})

        await asyncio.sleep(1)

    return {
        "status": "success",
        "processed": processed_count,
        "drafted": drafted_count,
        "sent": sent_count,
        "sentTodayTotal": emails_sent_today,
        "dailyLimit": daily_limit
    }
