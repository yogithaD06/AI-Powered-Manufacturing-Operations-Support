from fastapi import FastAPI

from app.core.database import Base, engine
from app.models import (
    Role,
    Department,
    ProductionLine,
    Machine,
    IssueCategory,
    User,
    Incident,
    Ticket,
    DowntimeRecord,
    RCARecord,
    CAPARecord,
    ResolutionRecord,
    MLPrediction,
    Notification,
    IncidentActivityLog,
)

# Import routers
from app.routers import (
    role,
    department,
    production_line,
    machine,
    issue_category,
    user,
    incident,
    ticket,
    downtime_record,
    rca_record,
    capa_record,
    resolution_record,
    ml_prediction,
    notification,
    incident_activity_log,
)


# Create database tables if they do not already exist
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="AI-Powered Manufacturing Operations Support & Downtime Intelligence Platform",
    version="1.0.0",
)


# Register routers
app.include_router(role.router)
app.include_router(department.router)
app.include_router(production_line.router)
app.include_router(machine.router)
app.include_router(issue_category.router)
app.include_router(user.router)
app.include_router(incident.router)
app.include_router(ticket.router)
app.include_router(downtime_record.router)
app.include_router(rca_record.router)
app.include_router(capa_record.router)
app.include_router(resolution_record.router)
app.include_router(ml_prediction.router)
app.include_router(notification.router)
app.include_router(incident_activity_log.router)


@app.get("/")
def root():
    return {
        "message": "Backend connected to MES_SUPPORT successfully!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "MES_SUPPORT",
    }