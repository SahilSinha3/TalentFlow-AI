from fastapi import APIRouter, Depends, Query
from database import get_database
from routes.auth import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/api/jobs", tags=["Jobs & Outreach Logs"])

@router.get("")
async def get_user_job_leads(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    db = get_database()
    query = {"userId": current_user["id"]}
    if status:
        query["status"] = status
        
    cursor = db.job_leads.find(query).sort("createdAt", -1).limit(limit)
    jobs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        jobs.append(doc)
    return jobs

@router.get("/outreach")
async def get_user_outreach_logs(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100)
):
    db = get_database()
    query = {"userId": current_user["id"]}
    if status:
        query["status"] = status
        
    cursor = db.outreach_logs.find(query).sort("createdAt", -1).limit(limit)
    logs = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        logs.append(doc)
    return logs
