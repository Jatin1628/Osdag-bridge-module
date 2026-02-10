from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import State, District
from .serializers import (
    StateSerializer,
    DistrictSerializer,
    WindDataSerializer,
    SeismicDataSerializer,
    TemperatureDataSerializer
)
import json
from django.conf import settings
from .services.location_matcher import find_closest_location
from rest_framework import status

@api_view(['GET'])
def get_states(request):
    states = State.objects.all()
    serializer = StateSerializer(states, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_districts(request):
    state_id = request.GET.get('state_id')
    districts = District.objects.filter(state_id=state_id)
    serializer = DistrictSerializer(districts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_district_details(request, district_id):
    district = District.objects.get(id=district_id)

    wind = WindDataSerializer(district.wind).data
    seismic = SeismicDataSerializer(district.seismic).data
    temperature = TemperatureDataSerializer(district.temperature).data

    return Response({
        "district": district.name,
        "wind": wind,
        "seismic": seismic,
        "temperature": temperature
    })


@api_view(["POST"])
def closest_location(request):
    """
    Find closest matching location for manually entered parameters.
    """

    manual = request.data

    required_keys = {
        "wind_speed",
        "seismic_zone",
        "min_temp",
        "max_temp",
    }

    if not required_keys.issubset(manual.keys()):
        return Response(
            {"error": "Missing required parameters"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Load engineering location data
    data_path = settings.BASE_DIR / "data" / "location_engineering_data.json"

    with open(data_path, "r") as f:
        locations = json.load(f)

    result = find_closest_location(manual, locations)

    return Response(result, status=status.HTTP_200_OK)   
