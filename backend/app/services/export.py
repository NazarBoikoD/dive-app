from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import DiveSession, User
from ..services.auth import get_current_user
from ..utils.pdf_generator import generate_dive_report
import csv
from io import StringIO, BytesIO
from fastapi.responses import StreamingResponse
import json

router = APIRouter()

@router.get("/pdf")
async def export_dives_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    
    if not dives:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dives found"
        )
    
    # Create a PDF with all dives
    buffer = BytesIO()
    dive_data = {
        "dives": [
            {
                "date": dive.date.isoformat(),
                "location": dive.location,
                "max_depth": dive.max_depth,
                "duration": dive.duration,
                "water_temp": dive.water_temp,
                "water_type": dive.water_type,
                "notes": dive.notes
            }
            for dive in dives
        ]
    }
    
    pdf_buffer = generate_dive_report(dive_data, [])
    
    return StreamingResponse(
        iter([pdf_buffer.getvalue()]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=dive_log.pdf"}
    )

@router.get("/csv")
async def export_dives_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Date", "Location", "Max Depth (m)", "Duration (min)",
        "Water Temperature (°C)", "Water Type", "Notes"
    ])
    
    # Write data
    for dive in dives:
        writer.writerow([
            dive.date.isoformat(),
            dive.location,
            dive.max_depth,
            dive.duration,
            dive.water_temp,
            dive.water_type,
            dive.notes
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dive_log.csv"}
    )

@router.get("/xml")
async def export_dives_xml(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    
    # Create XML string
    xml_data = '<?xml version="1.0" encoding="UTF-8"?>\n<dives>\n'
    for dive in dives:
        xml_data += f"""  <dive>
    <date>{dive.date.isoformat()}</date>
    <location>{dive.location}</location>
    <max_depth>{dive.max_depth}</max_depth>
    <duration>{dive.duration}</duration>
    <water_temp>{dive.water_temp if dive.water_temp else ''}</water_temp>
    <water_type>{dive.water_type if dive.water_type else ''}</water_type>
    <notes>{dive.notes if dive.notes else ''}</notes>
  </dive>\n"""
    xml_data += '</dives>'
    
    return StreamingResponse(
        iter([xml_data]),
        media_type="application/xml",
        headers={"Content-Disposition": "attachment; filename=dive_log.xml"}
    )

@router.get("/export/json")
async def export_dives_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dives = db.query(DiveSession).filter(DiveSession.user_id == current_user.id).all()
    
    dive_data = []
    for dive in dives:
        dive_data.append({
            "date": dive.date.isoformat(),
            "location": dive.location,
            "max_depth": dive.max_depth,
            "duration": dive.duration,
            "water_temp": dive.water_temp,
            "water_type": dive.water_type,
            "notes": dive.notes
        })
    
    return StreamingResponse(
        iter([json.dumps(dive_data, indent=2)]),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=dive_log.json"}
    ) 