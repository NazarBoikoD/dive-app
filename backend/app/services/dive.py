from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import DiveSession, User, DiveCreate
from datetime import datetime
from ..services.auth import get_current_user
from ..utils.decompression import calculate_dive_profile

router = APIRouter()

@router.post("/dives/", status_code=status.HTTP_201_CREATED)
async def create_dive(
    dive_data: DiveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Calculate decompression profile
    deco_profile = calculate_dive_profile(
        max_depth=dive_data.max_depth,
        bottom_time=dive_data.duration
    )
    
    # Generate time and depth data including decompression stops
    time_points = ['0:00']  # Start at surface
    depth_points = [0]      # Start at surface
    
    # Descent (assuming 20m/min descent rate)
    descent_time = int(dive_data.max_depth / 20 * 60)  # in seconds
    time_points.append(f"{descent_time//60}:{descent_time%60:02d}")
    depth_points.append(dive_data.max_depth)
    
    # Bottom time
    bottom_time_sec = dive_data.duration * 60
    time_points.append(f"{(descent_time + bottom_time_sec)//60}:{(descent_time + bottom_time_sec)%60:02d}")
    depth_points.append(dive_data.max_depth)
    
    current_time = descent_time + bottom_time_sec
    
    # Add decompression and safety stops
    for stop in deco_profile['stops']:
        # Ascent to stop depth (assuming 10m/min ascent rate)
        ascent_time = int((depth_points[-1] - stop['depth']) / 10 * 60)
        current_time += ascent_time
        time_points.append(f"{current_time//60}:{current_time%60:02d}")
        depth_points.append(stop['depth'])
        
        # Stop duration
        current_time += stop['duration'] * 60
        time_points.append(f"{current_time//60}:{current_time%60:02d}")
        depth_points.append(stop['depth'])
    
    # Final ascent to surface
    final_ascent_time = int(depth_points[-1] / 10 * 60)
    current_time += final_ascent_time
    time_points.append(f"{current_time//60}:{current_time%60:02d}")
    depth_points.append(0)

    new_dive = DiveSession(
        user_id=current_user.id,
        date=dive_data.date,
        location=dive_data.location,
        max_depth=dive_data.max_depth,
        duration=dive_data.duration,
        water_temp=dive_data.water_temp,
        water_type=dive_data.water_type.value if dive_data.water_type else None,
        notes=dive_data.notes,
        start_pressure=dive_data.start_pressure,
        end_pressure=dive_data.end_pressure,
        tank_volume=dive_data.tank_volume,
        depth_data=depth_points,
        time_data=time_points,
        decompression_info=deco_profile
    )
    
    # Calculate air consumption if all required data is present
    if all(x is not None for x in [
        new_dive.start_pressure, 
        new_dive.end_pressure, 
        new_dive.tank_volume,
        new_dive.max_depth,
        new_dive.duration,
        new_dive.water_temp
    ]):
        new_dive.air_consumption = new_dive.calculate_air_consumption()
    
    db.add(new_dive)
    db.commit()
    db.refresh(new_dive)
    return new_dive

@router.get("/dives/", response_model=List[dict])
async def get_dives(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    return dives

@router.get("/dives/{dive_id}")
async def get_dive(
    dive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dive = db.query(DiveSession).filter(
        DiveSession.id == dive_id,
        DiveSession.user_id == current_user.id
    ).first()
    if not dive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dive not found"
        )
    return dive

@router.put("/dives/{dive_id}")
async def update_dive(
    dive_id: int,
    dive_data: DiveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dive = db.query(DiveSession).filter(
        DiveSession.id == dive_id,
        DiveSession.user_id == current_user.id
    ).first()
    if not dive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dive not found"
        )
    
    # Update dive attributes
    for key, value in dive_data.dict(exclude_unset=True).items():
        if key == "water_type" and value is not None:
            value = value.value
        setattr(dive, key, value)
    
    # Recalculate air consumption
    if all(x is not None for x in [
        dive.start_pressure, 
        dive.end_pressure, 
        dive.tank_volume,
        dive.max_depth,
        dive.duration,
        dive.water_temp
    ]):
        dive.air_consumption = dive.calculate_air_consumption()
    
    db.commit()
    db.refresh(dive)
    return dive

@router.delete("/dives/{dive_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dive(
    dive_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dive = db.query(DiveSession).filter(
        DiveSession.id == dive_id,
        DiveSession.user_id == current_user.id
    ).first()
    if not dive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dive not found"
        )
    
    db.delete(dive)
    db.commit()
    return None 