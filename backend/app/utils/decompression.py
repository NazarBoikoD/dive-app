from typing import List, Tuple, Dict
from dataclasses import dataclass
from math import floor, ceil

@dataclass
class DecompressionStop:
    depth: float
    duration: int  # in minutes

@dataclass
class GasMixture:
    oxygen: float  # percentage
    nitrogen: float  # percentage
    helium: float  # percentage
    gas_type: str

@dataclass
class DiveProfile:
    max_depth: float
    bottom_time: int
    gas_mixture: GasMixture
    previous_dive_group: str = 'A'  # Default to A if no previous dive
    surface_interval: int = 720  # Default to 12 hours in minutes

class DecompressionCalculator:
    # CMAS/Bühlmann 86 No-Decompression Limits table for air (21/79)
    # Format: depth_in_meters: minutes_allowed
    NDL_LIMITS = {
        10: 219,
        12: 147,
        14: 98,
        16: 72,
        18: 56,
        20: 45,
        22: 37,
        25: 29,
        30: 20,
        35: 14,
        40: 9,
        42: 8
    }

    # Standard ascent rate (meters per minute) as per CMAS/Bühlmann 86
    ASCENT_RATE = 10  # meters/minute
    MAX_DESCENT_RATE = 30  # meters/minute

    # Pressure groups for repetitive diving
    PRESSURE_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M']

    # Maximum partial pressure limits
    MAX_PPO2 = 1.4  # bar
    MAX_PPN2 = 3.96  # bar
    MAX_END = 30  # meters, Equivalent Narcotic Depth

    @staticmethod
    def calculate_partial_pressure(percentage: float, depth: float) -> float:
        """Calculate partial pressure of a gas at a given depth."""
        absolute_pressure = (depth / 10) + 1  # Each 10m adds 1 atm
        return (percentage / 100) * absolute_pressure

    @staticmethod
    def calculate_end(depth: float, gas_mixture: GasMixture) -> float:
        """Calculate Equivalent Narcotic Depth for a given gas mixture."""
        # Helium is not narcotic, only count nitrogen
        nitrogen_fraction = gas_mixture.nitrogen / 100
        return depth * nitrogen_fraction / 0.79  # 0.79 is nitrogen fraction in air

    @staticmethod
    def adjust_ndl_for_nitrox(depth: float, gas_mixture: GasMixture) -> int:
        """Adjust No-Decompression Limit for enriched air mixtures."""
        if gas_mixture.gas_type == 'Air':
            return DecompressionCalculator.get_ndl_for_depth(depth)

        # Calculate equivalent air depth (EAD)
        nitrogen_fraction = gas_mixture.nitrogen / 100
        ead = ((depth + 10) * nitrogen_fraction / 0.79) - 10

        # Get NDL for equivalent air depth
        return DecompressionCalculator.get_ndl_for_depth(ead)

    @staticmethod
    def validate_gas_mixture(depth: float, gas_mixture: GasMixture) -> List[str]:
        """Validate gas mixture for use at a given depth. Returns list of warnings."""
        warnings = []
        
        # Calculate partial pressures
        ppo2 = DecompressionCalculator.calculate_partial_pressure(gas_mixture.oxygen, depth)
        ppn2 = DecompressionCalculator.calculate_partial_pressure(gas_mixture.nitrogen, depth)
        
        # Check oxygen toxicity
        if ppo2 > DecompressionCalculator.MAX_PPO2:
            warnings.append(f"WARNING: PPO2 of {ppo2:.2f} bar exceeds maximum {DecompressionCalculator.MAX_PPO2} bar")
        
        # Check nitrogen narcosis
        if ppn2 > DecompressionCalculator.MAX_PPN2:
            warnings.append(f"WARNING: PPN2 of {ppn2:.2f} bar exceeds maximum {DecompressionCalculator.MAX_PPN2} bar")
        
        # Check END
        end = DecompressionCalculator.calculate_end(depth, gas_mixture)
        if end > DecompressionCalculator.MAX_END:
            warnings.append(f"WARNING: END of {end:.1f}m exceeds maximum {DecompressionCalculator.MAX_END}m")
        
        return warnings

    @staticmethod
    def calculate_stops(dive_profile: DiveProfile) -> Tuple[List[DecompressionStop], bool, List[str]]:
        """
        Calculate required decompression and safety stops following CMAS/Bühlmann 86 standards.
        Returns: (list of stops, requires_safety_stop, warnings)
        """
        stops = []
        requires_safety_stop = False
        warnings = DecompressionCalculator.validate_gas_mixture(dive_profile.max_depth, dive_profile.gas_mixture)

        # Round up depth to nearest 3m increment for table lookup
        adjusted_depth = ceil_to_increment(dive_profile.max_depth, 3)
        ndl = DecompressionCalculator.adjust_ndl_for_nitrox(adjusted_depth, dive_profile.gas_mixture)

        # Calculate ascent time without stops
        direct_ascent_time = dive_profile.max_depth / DecompressionCalculator.ASCENT_RATE

        # Safety stop criteria based on CMAS standards
        if any([
            dive_profile.max_depth > 20,  # Deeper than 20m
            dive_profile.bottom_time > 40,  # Longer than 40 minutes
            adjusted_depth * dive_profile.bottom_time > 400,  # Depth-time product
            direct_ascent_time > 4  # Ascent time > 4 minutes
        ]):
            requires_safety_stop = True
            stops.append(DecompressionStop(5, 3))  # 3-minute safety stop

        # Check if decompression is required
        if ndl is None or dive_profile.bottom_time > ndl:
            deco_time = dive_profile.bottom_time - (ndl or 0)
            
            # Calculate decompression stops based on CMAS/Bühlmann 86
            if adjusted_depth > 30:
                # Deep stop at half max depth (Bühlmann recommendation)
                deep_stop_depth = ceil_to_increment(adjusted_depth / 2, 3)
                stops.append(DecompressionStop(deep_stop_depth, 2))
                
                # Progressive decompression stops
                stop_depths = [18, 15, 12, 9, 6]
                for stop_depth in stop_depths:
                    if stop_depth < adjusted_depth - 9:
                        # Calculate stop duration based on depth ratio and excess time
                        duration = max(3, ceil((deco_time * stop_depth) / adjusted_depth))
                        stops.append(DecompressionStop(stop_depth, duration))
                
                # Extended final stop at 5m
                final_stop_time = max(5, ceil(deco_time * 0.3))
                stops.append(DecompressionStop(5, final_stop_time))
            
            elif adjusted_depth > 20:
                # Simpler schedule for shallower decompression dives
                if adjusted_depth > 25:
                    stops.append(DecompressionStop(9, max(3, ceil(deco_time * 0.3))))
                stops.append(DecompressionStop(6, max(3, ceil(deco_time * 0.3))))
                stops.append(DecompressionStop(5, max(3, ceil(deco_time * 0.4))))

        return stops, requires_safety_stop, warnings

    @staticmethod
    def get_ndl_for_depth(depth: float) -> int:
        """Get the no-decompression limit for a given depth using CMAS/Bühlmann 86 table."""
        for table_depth in sorted(DecompressionCalculator.NDL_LIMITS.keys()):
            if depth <= table_depth:
                return DecompressionCalculator.NDL_LIMITS[table_depth]
        return 0  # If depth exceeds table limits

    @staticmethod
    def calculate_pressure_group(depth: float, bottom_time: int) -> str:
        """Calculate the pressure group after the dive using CMAS/Bühlmann 86 method."""
        adjusted_depth = ceil_to_increment(depth, 3)
        ndl = DecompressionCalculator.get_ndl_for_depth(adjusted_depth)
        
        if ndl == 0:
            return DecompressionCalculator.PRESSURE_GROUPS[-1]
        
        # Calculate pressure group based on percentage of NDL used
        percentage_used = min(1.0, bottom_time / ndl)
        index = min(
            floor(percentage_used * (len(DecompressionCalculator.PRESSURE_GROUPS) - 1)),
            len(DecompressionCalculator.PRESSURE_GROUPS) - 1
        )
        return DecompressionCalculator.PRESSURE_GROUPS[index]

def ceil_to_increment(value: float, increment: float) -> float:
    """Round up to the nearest increment."""
    return ceil(value / increment) * increment

def calculate_dive_profile(
    max_depth: float,
    bottom_time: int,
    oxygen_percentage: float = 21.0,
    nitrogen_percentage: float = 79.0,
    helium_percentage: float = 0.0,
    gas_type: str = 'Air',
    previous_group: str = 'A',
    surface_interval: int = 720
) -> Dict:
    """
    Calculate complete dive profile including stops and warnings following CMAS/Bühlmann 86 standards.
    Returns a dictionary with all relevant dive information.
    """
    gas_mixture = GasMixture(
        oxygen=oxygen_percentage,
        nitrogen=nitrogen_percentage,
        helium=helium_percentage,
        gas_type=gas_type
    )
    
    profile = DiveProfile(
        max_depth=max_depth,
        bottom_time=bottom_time,
        gas_mixture=gas_mixture,
        previous_dive_group=previous_group,
        surface_interval=surface_interval
    )
    
    stops, requires_safety_stop, warnings = DecompressionCalculator.calculate_stops(profile)
    pressure_group = DecompressionCalculator.calculate_pressure_group(max_depth, bottom_time)
    ndl = DecompressionCalculator.adjust_ndl_for_nitrox(max_depth, gas_mixture)
    total_deco_time = sum(stop.duration for stop in stops)
    
    # Calculate total ascent time including stops
    direct_ascent_time = ceil(max_depth / DecompressionCalculator.ASCENT_RATE)
    
    # Calculate gas-related information
    ppo2_at_depth = DecompressionCalculator.calculate_partial_pressure(gas_mixture.oxygen, max_depth)
    end = DecompressionCalculator.calculate_end(max_depth, gas_mixture)
    
    return {
        "stops": [{"depth": stop.depth, "duration": stop.duration} for stop in stops],
        "requires_safety_stop": requires_safety_stop,
        "total_deco_time": total_deco_time,
        "pressure_group": pressure_group,
        "no_deco_limit": ndl,
        "is_deco_dive": total_deco_time > 3,  # More than safety stop
        "total_ascent_time": direct_ascent_time + total_deco_time,
        "ascent_rate": DecompressionCalculator.ASCENT_RATE,
        "max_descent_rate": DecompressionCalculator.MAX_DESCENT_RATE,
        "gas_info": {
            "ppo2_at_depth": round(ppo2_at_depth, 2),
            "end": round(end, 1),
            "warnings": warnings
        }
    } 