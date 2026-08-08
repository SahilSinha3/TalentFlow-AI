import asyncio
from typing import List, Dict, Any
from services.scrapers.reddit import scrape_reddit_jobs
from services.scrapers.hn import scrape_hn_jobs
from services.scrapers.remotive import scrape_remotive_jobs
from services.scrapers.weworkremotely import scrape_wwr_jobs
from services.scrapers.remoteok import scrape_remoteok_jobs

async def aggregate_all_free_jobs(user_settings: dict = None) -> List[Dict[str, Any]]:
    max_age_days = 3
    target_locations = ["Remote"]
    target_roles = []
    remote_pref = "Remote"

    if user_settings:
        max_age_days = user_settings.get("maxPostingAgeDays", 3)
        target_locations = user_settings.get("targetLocations", ["Remote"])
        target_roles = user_settings.get("targetRoles", [])
        remote_pref = user_settings.get("remotePreference", "Remote")

    print(f"Starting job sourcing across free platforms (max_age={max_age_days}d, locations={target_locations}, work_type={remote_pref})...")
    
    results = await asyncio.gather(
        scrape_reddit_jobs(max_age_days=max_age_days),
        scrape_hn_jobs(max_age_days=max_age_days),
        scrape_remotive_jobs(max_age_days=max_age_days),
        scrape_wwr_jobs(max_age_days=max_age_days),
        scrape_remoteok_jobs(max_age_days=max_age_days),
        return_exceptions=True
    )
    
    all_leads = []
    for res in results:
        if isinstance(res, list):
            all_leads.extend(res)
        elif isinstance(res, Exception):
            print(f"Scraper error encountered: {res}")

    # Location & Role Keyword Filtering
    filtered_leads = []
    loc_keywords = [l.lower() for l in target_locations if l]
    role_keywords = [r.lower() for r in target_roles if r]

    for lead in all_leads:
        lead_text = (lead.get("title", "") + " " + lead.get("description", "")).lower()
        
        # If work type is strictly Remote, filter out non-remote listings
        if remote_pref == "Remote" and not any(k in lead_text for k in ["remote", "anywhere", "worldwide", "distributed"]):
            continue

        # Check location match if target locations specified
        if loc_keywords and not any(loc in lead_text or loc == "remote" or loc == "worldwide" for loc in loc_keywords):
            continue

        filtered_leads.append(lead)
            
    print(f"Successfully aggregated {len(filtered_leads)} fresh job leads matching target locations and preferences!")
    return filtered_leads
