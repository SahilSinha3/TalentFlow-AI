import json
import re
from google import genai
from google.genai import types

async def extract_and_score_job_lead(job_lead: dict, user_settings: dict, api_key: str) -> dict:
    """
    Uses Gemini 2.0 Flash to extract recruiter details and compute fit score (0-100)
    against candidate profile.
    """
    if not api_key:
        return {
            "recruiterEmail": job_lead.get("recruiterEmail"),
            "recruiterName": "Hiring Manager",
            "matchScore": 75,
            "matchReasoning": "API Key missing; default match score assigned."
        }
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
You are an expert AI Recruiter Lead Analyzer.
Task: Analyze the following job posting and determine candidate match score (0-100) and recruiter contact info.

Target Candidate Resume:
{user_settings.get("resumeText", "Full Stack Software Engineer with Python and React experience.")}

Target Roles: {user_settings.get("targetRoles", ["Full Stack Developer"])}
Target Locations: {user_settings.get("targetLocations", ["Remote"])}
Remote Preference: {user_settings.get("remotePreference", "Remote")}

Job Listing:
Title: {job_lead.get("title")}
Company: {job_lead.get("company")}
Source: {job_lead.get("source")}
Description:
{job_lead.get("description")}

Return JSON with this EXACT structure:
{{
    "recruiterEmail": "string or null if not found",
    "recruiterName": "string name or Hiring Manager",
    "matchScore": integer (0 to 100 based on skill, role, location fit),
    "matchReasoning": "1-2 sentence explanation of why candidate is a good/poor fit"
}}
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        result = json.loads(response.text)
        if not result.get("recruiterEmail") and job_lead.get("recruiterEmail"):
            result["recruiterEmail"] = job_lead.get("recruiterEmail")
            
        return result
    except Exception as e:
        print(f"Gemini API lead scoring error: {e}")
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', job_lead.get("description", ""))
        return {
            "recruiterEmail": emails[0] if emails else job_lead.get("recruiterEmail"),
            "recruiterName": "Hiring Team",
            "matchScore": 70,
            "matchReasoning": "Evaluated via fallback parser."
        }


async def generate_cold_email(job_lead: dict, user_settings: dict, api_key: str) -> dict:
    """
    Generates personalized cold email tailored to user writing tone, sample cold emails, and candidate resume.
    """
    if not api_key:
        return {
            "subject": f"Application for {job_lead.get('title')} - Sahil Sinha",
            "emailBody": f"Hi {job_lead.get('recruiterName', 'Hiring Team')},\n\nI noticed {job_lead.get('company')}'s opening for {job_lead.get('title')} and wanted to reach out..."
        }
        
    client = genai.Client(api_key=api_key)
    
    selected_tone = user_settings.get("selectedTone", "SHORT_DIRECT")
    custom_tone_prompt = user_settings.get("customTonePrompt", "Keep concise, confident, under 100 words.")
    writing_style_rules = user_settings.get("writingStyleRules", "")
    sample_email = user_settings.get("sampleEmailText", "")
    
    portfolio = user_settings.get("portfolioUrl", "")
    github = user_settings.get("githubUrl", "")
    linkedin = user_settings.get("linkedinUrl", "")
    drive_resume = user_settings.get("resumeDriveUrl", "")

    links_str = ""
    if portfolio: links_str += f"Portfolio: {portfolio}\n"
    if github: links_str += f"GitHub: {github}\n"
    if linkedin: links_str += f"LinkedIn: {linkedin}\n"
    if drive_resume: links_str += f"Drive Resume: {drive_resume}\n"

    prompt = f"""
You are an expert Executive Email Writer crafting high-converting cold recruiter emails.

Candidate Resume & Context:
{user_settings.get("resumeText", "")}

Candidate Profiles & Links to Include if relevant:
{links_str}

User Sample Cold Email (MIMIC THIS EXACT WRITING STYLE, TONE, AND STRUCTURE):
{sample_email if sample_email else "No sample provided."}

Writing Style Instructions & Rules:
- Primary Tone: {selected_tone}
- Style Rules: {writing_style_rules}
- Custom Instructions: {custom_tone_prompt}
- Match the greeting style, email length, sentence structure, and sign-off of the candidate's sample email.
- NEVER sound needy, generic, or AI-generated.

Target Recruiter & Job Post:
Name: {job_lead.get("recruiterName", "Hiring Manager")}
Company: {job_lead.get("company")}
Role Title: {job_lead.get("title")}
Job Description: {job_lead.get("description")}

Return JSON with this EXACT structure:
{{
    "subject": "Compelling, short email subject line",
    "emailBody": "Complete personalized cold email body ready to send"
}}
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API cold email drafting error: {e}")
        return {
            "subject": f"Interested in {job_lead.get('title')} role at {job_lead.get('company')}",
            "emailBody": f"Hi {job_lead.get('recruiterName', 'Hiring Team')},\n\nI saw your post for the {job_lead.get('title')} position at {job_lead.get('company')}.\n\nWith my background in software engineering, I'd love to connect.\n\nBest regards,\nCandidate"
        }


async def generate_followup_email(outreach_log: dict, user_settings: dict, api_key: str) -> dict:
    """
    Generates a polite, high-converting follow-up email for an existing recruiter outreach.
    """
    if not api_key:
        return {
            "subject": f"Re: {outreach_log.get('subject', 'Following Up')}",
            "emailBody": f"Hi,\n\nFollowing up on my previous note regarding the {outreach_log.get('role', 'role')} position at {outreach_log.get('company')}. Would love to connect if you have a moment this week.\n\nBest regards,"
        }

    client = genai.Client(api_key=api_key)

    prompt = f"""
You are an expert Recruiter Outreach Copywriter writing a polite, high-converting follow-up email.

Original Email Details:
Role: {outreach_log.get('role')}
Company: {outreach_log.get('company')}
Original Subject: {outreach_log.get('subject')}
Original Body:
{outreach_log.get('emailBody')}

Candidate Context:
{user_settings.get('resumeText', '')}

Follow-Up Writing Rules:
- Keep the follow-up ultra-concise (under 60 words).
- Reiterate interest in the role without sounding persistent or annoying.
- Offer a quick win or brief recap of value.
- Subject line should start with 'Re: ' or be a direct follow-up note.

Return JSON with this EXACT structure:
{{
    "subject": "Follow-up email subject line",
    "emailBody": "Complete follow-up email text"
}}
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API follow-up drafting error: {e}")
        return {
            "subject": f"Re: {outreach_log.get('subject')}",
            "emailBody": f"Hi,\n\nFollowing up on my earlier note regarding the {outreach_log.get('role')} position at {outreach_log.get('company')}. Let me know if you'd be open to a quick 5-minute chat.\n\nBest regards,"
        }
