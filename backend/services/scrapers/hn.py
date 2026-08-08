import httpx
import re
from datetime import datetime, timezone

async def scrape_hn_jobs(max_age_days: int = 7):
    job_leads = []
    headers = {"User-Agent": "OutreachAI/1.0"}
    
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        try:
            # Algolia API for HackerNews 'Who is hiring?' comments
            url = "https://hn.algolia.com/api/v1/search?query=Ask%20HN:%20Who%20is%20hiring&tags=story&hitsPerPage=1"
            res = await client.get(url)
            if res.status_code != 200:
                return []
            
            data = res.json()
            hits = data.get("hits", [])
            if not hits:
                return []
                
            story_id = hits[0].get("objectID")
            
            # Fetch comments for this 'Who is hiring?' story
            comments_url = f"https://hn.algolia.com/api/v1/search?tags=comment,story_{story_id}&hitsPerPage=50"
            c_res = await client.get(comments_url)
            if c_res.status_code != 200:
                return []
                
            c_data = c_res.json()
            for comment in c_data.get("hits", []):
                comment_text = comment.get("comment_text", "")
                created_at = comment.get("created_at")
                object_id = comment.get("objectID")
                item_url = f"https://news.ycombinator.com/item?id={object_id}"
                
                if not comment_text:
                    continue
                    
                posted_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                age_days = (datetime.now(timezone.utc) - posted_dt).days
                if age_days > max_age_days:
                    continue
                    
                # Clean HTML tags
                clean_text = re.sub('<[^<]+?>', '', comment_text)
                
                # Extract first line for title/company
                lines = [l.strip() for l in clean_text.split('\n') if l.strip()]
                headline = lines[0] if lines else "HN Who is Hiring Post"
                
                # Extract email
                emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', clean_text)
                recruiter_email = emails[0] if emails else None
                
                job_leads.append({
                    "title": headline[:150],
                    "company": headline.split('|')[0].strip() if '|' in headline else "HN Hiring Startup",
                    "source": "HackerNews",
                    "sourceUrl": item_url,
                    "description": clean_text[:2000],
                    "postedAt": posted_dt,
                    "recruiterEmail": recruiter_email
                })
        except Exception as e:
            print(f"Error scraping HackerNews: {e}")
            
    return job_leads
