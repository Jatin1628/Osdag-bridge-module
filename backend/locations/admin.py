from django.contrib import admin
from .models import State, District, WindData, SeismicData, TemperatureData

admin.site.register(State)
admin.site.register(District)
admin.site.register(WindData)
admin.site.register(SeismicData)
admin.site.register(TemperatureData)
