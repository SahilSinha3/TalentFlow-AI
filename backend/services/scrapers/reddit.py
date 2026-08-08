import httpx
import re
from datetime import datetime, timezone

SUBREDDITS = ["forhire", "remotework", "hiring", "jobbit", "reactjs", "python"]

async def scrape_reddit_jobs(max_age_days: int = 3):
    job_leads = []
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) OutreachAI/1.0"}
    
    async with httpx.AsyncClient(timeout=10.0, headers=headers, follow_redirects=True) as client:
        for sub in SUBREDDITS:
            try:
                url = f"https://www.reddit.com/r/{sub}/new.json?limit=25"
                res = await client.get(url)
                if res.status_code != 200:
                    continue
                data = res.json()
                children = data.get("data", {}).get("children", [])
                
                for child in children:
                    post = child.get("data", {})
                    title = post.get("title", "")
                    selftext = post.get("selftext", "")
                    created_utc = post.get("created_utc", 0)
                    permalink = f"https://reddit.com{post.get('permalink', '')}"
                    
                    # Check post title for hiring tag
                    if not any(k in title.lower() for k in ["[hiring]", "hiring", "looking for", "job"]):
                        continue
                    
                    posted_dt = datetime.fromtimestamp(created_utc, tz=timezone.utc)
                    age_days = (datetime.now(timezone.utc) - posted_dt).days
                    if age_days > max_age_days:
                        continue
                        
                    # Basic regex check for email in text
                    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', selftext + " " + title)
                    recruiter_email = emails[0] if emails else None
                    
                    job_leads.append({
                        "title": title[:150],
                        "company": f"r/{sub} poster",
                        "source": "Reddit",
                        "sourceUrl": permalink,
                        "description": selftext[:2000] if selftext else title,
                        "postedAt": posted_dt,
                        "recruiterEmail": recruiter_email
                    })
            except Exception as e:
                print(f"Error scraping Reddit r/{sub}: {e}")
                
    return job_leads
