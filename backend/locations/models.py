from django.db import models

class State(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class District(models.Model):
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='districts')

    def __str__(self):
        return f"{self.name}, {self.state.name}"


class WindData(models.Model):
    district = models.OneToOneField(District, on_delete=models.CASCADE, related_name='wind')
    wind_speed = models.FloatField(help_text="Basic wind speed in m/s")

    def __str__(self):
        return f"{self.district.name} - {self.wind_speed} m/s"


class SeismicData(models.Model):
    district = models.OneToOneField(District, on_delete=models.CASCADE, related_name='seismic')
    seismic_zone = models.CharField(max_length=10)
    seismic_factor = models.FloatField(null=True, blank=True, help_text="Importance factor derived from zone")

    def __str__(self):
        return f"{self.district.name} - Zone {self.seismic_zone}"


class TemperatureData(models.Model):
    district = models.OneToOneField(District, on_delete=models.CASCADE, related_name='temperature')
    min_temp = models.FloatField(db_column="min_temp_c")
    max_temp = models.FloatField(db_column="max_temp_c")
    notes = models.TextField(null=True, blank=True)
    source_code = models.CharField(max_length=50, default="ingestion")
    source_station = models.CharField(max_length=100, default="ingestion")

    def __str__(self):
        return f"{self.district.name} - {self.min_temp}°C to {self.max_temp}°C"
