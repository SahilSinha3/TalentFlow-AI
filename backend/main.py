from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import OAuthFlows as OAuthFlowsModel, SecurityScheme
from database import connect_to_mongo, close_mongo_connection
from routes import auth, settings as settings_route, jobs, agent
from config import settings

app = FastAPI(
    title="TalentFlow AI Backend API",
    description="""
# TalentFlow AI API Documentation

**TalentFlow AI** is an autonomous recruiter sourcing, cold outreach, and follow-up intelligence agent.

### Authentication
To access protected endpoints:
1. Register via `POST /api/auth/register` or Login via `POST /api/auth/login`.
2. Copy the returned `access_token`.
3. Click the **Authorize 🔓** button at the top right of this Swagger page.
4. Enter `Bearer <your_token>` in the Value input field and click **Authorize**.
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include API Routers
app.include_router(auth.router)
app.include_router(settings_route.router)
app.include_router(jobs.router)
app.include_router(agent.router)

@app.get("/")
async def root():
    return {
        "project": "TalentFlow AI",
        "status": "online",
        "message": "Autonomous Recruiter Intelligence & Follow-Up Engine Running",
        "swaggerDocs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
