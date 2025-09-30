"""add air consumption columns

Revision ID: 001
Revises: 
Create Date: 2024-04-30 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns to dive_sessions table
    op.add_column('dive_sessions', sa.Column('start_pressure', sa.Integer(), nullable=True))
    op.add_column('dive_sessions', sa.Column('end_pressure', sa.Integer(), nullable=True))
    op.add_column('dive_sessions', sa.Column('tank_volume', sa.Float(), nullable=True))
    op.add_column('dive_sessions', sa.Column('air_consumption', sa.Float(), nullable=True))

def downgrade():
    # Remove columns if needed to rollback
    op.drop_column('dive_sessions', 'air_consumption')
    op.drop_column('dive_sessions', 'tank_volume')
    op.drop_column('dive_sessions', 'end_pressure')
 