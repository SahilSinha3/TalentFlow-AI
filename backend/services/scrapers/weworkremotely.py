import feedparser
import re
from datetime import datetime, timezone
import time

async def scrape_wwr_jobs(max_age_days: int = 5):
    job_leads = []
    rss_urls = [
        "https://weworkremotely.com/categories/remote-programming-jobs.rss",
        "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss"
    ]
    
    for url in rss_urls:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                title = entry.get("title", "")
                link = entry.get("link", "")
                summary = entry.get("summary", "")
                published_parsed = entry.get("published_parsed")
                
                if published_parsed:
                    posted_dt = datetime.fromtimestamp(time.mktime(published_parsed), tz=timezone.utc)
                else:
                    posted_dt = datetime.now(timezone.utc)
                    
                age_days = (datetime.now(timezone.utc) - posted_dt).days
                if age_days > max_age_days:
                    continue
                    
                # Clean HTML
                clean_text = re.sub('<[^<]+?>', '', summary)
                
                parts = title.split(":")
                company = parts[0].strip() if len(parts) > 1 else "WWR Hiring Company"
                role = parts[1].strip() if len(parts) > 1 else title
                
                job_leads.append({
                    "title": role,
                    "company": company,
                    "source": "WeWorkRemotely",
                    "sourceUrl": link,
                    "description": clean_text[:2000],
                    "postedAt": posted_dt,
                    "recruiterEmail": None
                })
        except Exception as e:
            print(f"Error parsing WeWorkRemotely RSS {url}: {e}")
            
    return job_leads
