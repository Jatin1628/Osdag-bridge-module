from rest_framework import serializers
from .models import State, District, WindData, SeismicData, TemperatureData


class StateSerializer(serializers.ModelSerializer):
    class Meta:
        model = State
        fields = ['id', 'name']


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name', 'state']


class WindDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = WindData
        fields = ['wind_speed']


class SeismicDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeismicData
        fields = ['seismic_zone']


class TemperatureDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemperatureData
        fields = ['min_temp', 'max_temp']
