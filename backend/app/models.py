from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from .database import Base
from pydantic import BaseModel, validator
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict
import math

class WaterType(str, Enum):
    FRESH = "Fresh"
    SALT = "Salt"

class GasType(str, Enum):
    AIR = "Air"
    NITROX = "Nitrox"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    name = Column(String(100))
    age = Column(Integer)
    phone_number = Column(String(20))
    is_admin = Column(Boolean, default=False)

class DiveBase(BaseModel):
    location: str
    date: datetime
    max_depth: float
    duration: int
    water_temp: Optional[float] = None
    water_type: Optional[WaterType] = None
    notes: Optional[str] = None
    start_pressure: Optional[int] = None  # Starting air pressure in bar
    end_pressure: Optional[int] = None    # Ending air pressure in bar
    tank_volume: Optional[float] = None   # Tank volume in liters
    oxygen_percentage: Optional[float] = 21.0  # Default to air
    nitrogen_percentage: Optional[float] = 79.0  # Default to air
    helium_percentage: Optional[float] = 0.0  # Default to 0
    gas_type: Optional[GasType] = GasType.AIR

    @validator('start_pressure')
    def validate_start_pressure(cls, v):
        if v is not None and (v < 0 or v > 300):  # Most tanks max pressure is 300 bar
            raise ValueError('Start pressure must be between 0 and 300 bar')
        return v

    @validator('end_pressure')
    def validate_end_pressure(cls, v, values):
        if v is not None:
            if v < 0 or v > 300:
                raise ValueError('End pressure must be between 0 and 300 bar')
            if 'start_pressure' in values and values['start_pressure'] is not None:
                if v > values['start_pressure']:
                    raise ValueError('End pressure cannot be greater than start pressure')
        return v

    @validator('tank_volume')
    def validate_tank_volume(cls, v):
        if v is not None and (v < 0 or v > 20):  # Most common tanks are between 3L and 18L
            raise ValueError('Tank volume must be between 0 and 20 liters')
        return v

    @validator('oxygen_percentage', 'nitrogen_percentage', 'helium_percentage')
    def validate_gas_percentages(cls, v, values, field):
        if v is not None:
            if v < 0 or v > 100:
                raise ValueError(f'{field.name} must be between 0 and 100')
            
            # Validate total percentage equals 100%
            if 'oxygen_percentage' in values and 'nitrogen_percentage' in values and 'helium_percentage' in values:
                total = values['oxygen_percentage'] + values['nitrogen_percentage'] + values['helium_percentage']
                if abs(total - 100) > 0.1:  # Allow small rounding errors
                    raise ValueError('Gas percentages must sum to 100%')
        return v

    @validator('gas_type')
    def validate_gas_type(cls, v, values):
        if v is not None:
            o2 = values.get('oxygen_percentage', 21)
            n2 = values.get('nitrogen_percentage', 79)

            if v == GasType.AIR:
                if abs(o2 - 21) > 0.1 or abs(n2 - 79) > 0.1:
                    raise ValueError('Air must be 21% O2, 79% N2')
            elif v == GasType.NITROX:
                if o2 < 21 or o2 > 40:  # Standard recreational Nitrox limits
                    raise ValueError('Nitrox must contain between 21% and 40% oxygen')
                if abs(o2 + n2 - 100) > 0.1:  # Ensure percentages sum to 100%
                    raise ValueError('Gas percentages must sum to 100%')
        return v

class DiveCreate(DiveBase):
    pass

class DiveSession(Base):
    __tablename__ = "dive_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime)
    location = Column(String(100))
    max_depth = Column(Float)
    duration = Column(Integer)
    water_temp = Column(Float)
    water_type = Column(String(50))
    notes = Column(Text)
    start_pressure = Column(Integer)
    end_pressure = Column(Integer)
    tank_volume = Column(Float)
    air_consumption = Column(Float)  # Average air consumption in L/min
    depth_data = Column(JSON)  # Store depth points
    time_data = Column(JSON)   # Store time points
    decompression_info = Column(JSON)  # Store decompression profile
    oxygen_percentage = Column(Float, default=21.0)
    nitrogen_percentage = Column(Float, default=79.0)
    helium_percentage = Column(Float, default=0.0)
    gas_type = Column(String(50), default='Air')

    def calculate_air_consumption(self):
        if None in (self.start_pressure, self.end_pressure, self.tank_volume, 
                   self.max_depth, self.duration, self.water_temp):
            return None

        # Convert bar to absolute pressure (add 1 atm)
        avg_depth = self.max_depth / 2  # Approximate average depth
        pressure_at_depth = (avg_depth / 10) + 1  # Each 10m adds 1 atm

        # Calculate actual volume of gas used
        gas_used = (self.start_pressure - self.end_pressure) * self.tank_volume

        # Apply temperature correction (assuming standard temp is 20°C)
        temp_kelvin = self.water_temp + 273.15
        standard_temp_kelvin = 293.15  # 20°C in Kelvin
        temp_correction = temp_kelvin / standard_temp_kelvin

        # Calculate actual volume at depth
        actual_volume = gas_used * pressure_at_depth * temp_correction

        # Calculate consumption rate in L/min
        return actual_volume / self.duration

class DiveResponse(DiveBase):
    id: int
    depth_data: List[float]
    time_data: List[str]
    decompression_info: Dict
    air_consumption: Optional[float]

    class Config:
        orm_mode = True

class DepthRecord(Base):
    __tablename__ = "depth_records"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("dive_sessions.id"))
    timestamp = Column(DateTime)
    depth = Column(Float)
    temperature = Column(Float)