import httpx
from datetime import datetime, timezone

async def scrape_remoteok_jobs(max_age_days: int = 5):
    job_leads = []
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) OutreachAI/1.0"}
    
    async with httpx.AsyncClient(timeout=10.0, headers=headers, follow_redirects=True) as client:
        try:
            url = "https://remoteok.com/api"
            res = await client.get(url)
            if res.status_code != 200:
                return []
                
            data = res.json()
            # First item in remoteok API is legal disclaimer
            jobs = data[1:] if len(data) > 1 else []
            
            for job in jobs[:25]:
                title = job.get("position", "")
                company = job.get("company", "")
                job_url = job.get("url", "")
                epoch = job.get("date")
                description = job.get("description", "")
                
                if not title or not company:
                    continue
                    
                if epoch:
                    # RemoteOK date is ISO timestamp or epoch integer string
                    try:
                        posted_dt = datetime.fromtimestamp(int(epoch), tz=timezone.utc)
                    except Exception:
                        posted_dt = datetime.now(timezone.utc)
                else:
                    posted_dt = datetime.now(timezone.utc)
                    
                age_days = (datetime.now(timezone.utc) - posted_dt).days
                if age_days > max_age_days:
                    continue
                    
                job_leads.append({
                    "title": f"{title} at {company}",
                    "company": company,
                    "source": "RemoteOK",
                    "sourceUrl": job_url if job_url.startswith("http") else f"https://remoteok.com{job_url}",
                    "description": description[:2000] if description else f"{title} position at {company}",
                    "postedAt": posted_dt,
                    "recruiterEmail": None
                })
        except Exception as e:
            print(f"Error scraping RemoteOK: {e}")
            
    return job_leads
