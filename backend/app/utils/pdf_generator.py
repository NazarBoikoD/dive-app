from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

def generate_dive_report(dive_data: dict, depth_records: list):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph(f"Dive Report - {dive_data['location']}", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Dive Details
    details = [
        f"Date: {dive_data['date']}",
        f"Max Depth: {dive_data['max_depth']} meters",
        f"Duration: {dive_data['duration']} minutes",
        f"Water Temperature: {dive_data['water_temp']}°C",
        f"Water Type: {dive_data['water_type']}"
    ]
    
    for detail in details:
        story.append(Paragraph(detail, styles['BodyText']))
        story.append(Spacer(1, 6))
    
    # Generate chart (would be implemented separately)
    # chart = generate_depth_chart(depth_records)
    # story.append(chart)
    
    doc.build(story)
    buffer.seek(0)
    return buffer