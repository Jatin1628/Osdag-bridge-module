# backend/locations/services/location_matcher.py

def seismic_penalty(zone_a: str, zone_b: str) -> float:
    """
    Penalize difference between seismic zones.
    Zones are categorical, not numeric.
    """
    zones = ["I", "II", "III", "IV", "V"]

    if zone_a not in zones or zone_b not in zones:
        return 10  # fallback penalty

    return abs(zones.index(zone_a) - zones.index(zone_b)) * 5


def find_closest_location(manual: dict, locations: list[dict]) -> dict:
    """
    Compare manual parameters against all locations
    and return the closest match.
    """

    best_match = None
    best_score = float("inf")

    for loc in locations:
        score = (
            abs(manual["wind_speed"] - loc["wind_speed"])
            + abs(manual["min_temp"] - loc["min_temp"])
            + abs(manual["max_temp"] - loc["max_temp"])
            + seismic_penalty(manual["seismic_zone"], loc["seismic_zone"])
        )

        if score < best_score:
            best_score = score
            best_match = loc

    # Confidence: inverse of distance (bounded)
    confidence = max(0.0, round(100 - best_score, 1))

    return {
        "state": best_match["state"],
        "district": best_match["district"],
        "confidence": confidence,
    }