from django.urls import path
from .views import get_states, get_districts, get_district_details, closest_location

urlpatterns = [
    path('states/', get_states),
    path('districts/', get_districts),
    path('districts/<int:district_id>/details/', get_district_details),
    path("closest/", closest_location),
]
