"""add gas mixture columns

Revision ID: 002
Revises: 001
Create Date: 2024-04-30 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Add gas mixture columns to dive_sessions table
    op.add_column('dive_sessions', sa.Column('oxygen_percentage', sa.Float(), nullable=True, default=21.0))
    op.add_column('dive_sessions', sa.Column('nitrogen_percentage', sa.Float(), nullable=True, default=79.0))
    op.add_column('dive_sessions', sa.Column('helium_percentage', sa.Float(), nullable=True, default=0.0))
    op.add_column('dive_sessions', sa.Column('gas_type', sa.String(50), nullable=True, default='Air'))

def downgrade():
    # Remove columns if needed to rollback
    op.drop_column('dive_sessions', 'gas_type')
    op.drop_column('dive_sessions', 'helium_percentage')
    op.drop_column('dive_sessions', 'nitrogen_percentage')
    op.drop_column('dive_sessions', 'oxygen_percentage') 