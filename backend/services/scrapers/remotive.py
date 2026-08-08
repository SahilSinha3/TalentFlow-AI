import httpx
from datetime import datetime, timezone

async def scrape_remotive_jobs(category: str = "software-dev", max_age_days: int = 5):
    job_leads = []
    headers = {"User-Agent": "OutreachAI/1.0"}
    
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        try:
            url = f"https://remotive.com/api/remote-jobs?category={category}&limit=25"
            res = await client.get(url)
            if res.status_code != 200:
                return []
                
            data = res.json()
            jobs = data.get("jobs", [])
            
            for job in jobs:
                title = job.get("title", "")
                company = job.get("company_name", "")
                job_url = job.get("url", "")
                publication_date = job.get("publication_date", "")
                description = job.get("description", "")
                
                try:
                    posted_dt = datetime.fromisoformat(publication_date.replace("Z", "+00:00"))
                except Exception:
                    posted_dt = datetime.now(timezone.utc)
                    
                age_days = (datetime.now(timezone.utc) - posted_dt).days
                if age_days > max_age_days:
                    continue
                    
                job_leads.append({
                    "title": f"{title} at {company}",
                    "company": company,
                    "source": "Remotive",
                    "sourceUrl": job_url,
                    "description": description[:2000],
                    "postedAt": posted_dt,
                    "recruiterEmail": None  # Will be extracted by Gemini AI from description / webpage
                })
        except Exception as e:
            print(f"Error scraping Remotive: {e}")
            
    return job_leads
