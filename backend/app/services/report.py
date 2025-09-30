from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import DiveSession, User
from ..services.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/reports/summary")
async def get_dive_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    
    total_dives = len(dives)
    total_duration = sum(dive.duration for dive in dives if dive.duration)
    max_depth_ever = max((dive.max_depth for dive in dives if dive.max_depth), default=0)
    
    # Calculate statistics for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_dives = [dive for dive in dives if dive.date >= thirty_days_ago]
    recent_dive_count = len(recent_dives)
    
    return {
        "total_dives": total_dives,
        "total_duration_minutes": total_duration,
        "max_depth_meters": max_depth_ever,
        "dives_last_30_days": recent_dive_count,
        "average_depth": sum(dive.max_depth for dive in dives if dive.max_depth) / total_dives if total_dives > 0 else 0,
        "average_duration": total_duration / total_dives if total_dives > 0 else 0
    }

@router.get("/reports/locations")
async def get_location_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    
    location_stats = {}
    for dive in dives:
        if dive.location:
            if dive.location not in location_stats:
                location_stats[dive.location] = {
                    "dive_count": 0,
                    "total_duration": 0,
                    "max_depth": 0
                }
            stats = location_stats[dive.location]
            stats["dive_count"] += 1
            stats["total_duration"] += dive.duration if dive.duration else 0
            stats["max_depth"] = max(stats["max_depth"], dive.max_depth if dive.max_depth else 0)
    
    return location_stats

@router.get("/reports/progress")
async def get_progress_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(
        DiveSession.user_id == current_user.id
    ).order_by(DiveSession.date.asc()).all()
    
    if not dives:
        return []
    
    progress_data = []
    for dive in dives:
        progress_data.append({
            "date": dive.date,
            "max_depth": dive.max_depth,
            "duration": dive.duration,
            "location": dive.location
        })
    
    return progress_data 