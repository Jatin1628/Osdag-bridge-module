from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from locations.models import District, SeismicData, State, TemperatureData, WindData


@dataclass
class ImportStats:
    """Tracks granular counts for visibility and review."""

    rows_processed: int = 0
    rows_skipped: int = 0
    states_created: int = 0
    districts_created: int = 0
    wind_created: int = 0
    wind_updated: int = 0
    seismic_created: int = 0
    seismic_updated: int = 0
    temp_created: int = 0
    temp_updated: int = 0


class Command(BaseCommand):
    """
    Load normalized State → District → engineering data from a JSON file.

    Idempotency is achieved with get_or_create / update_or_create so rerunning the
    command only updates changed rows without duplicating hierarchical records.
    Future data additions are handled by the normalized payload builder, which
    centralizes required field validation and type casting before persistence.
    """

    help = "Load State, District, and engineering design data from structured JSON."

    REQUIRED_FIELDS = {
        "state",
        "district",
        "wind_speed",
        "seismic_zone",
        "min_temp",
        "max_temp",
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="data_file",
            default="data/location_engineering_data.json",
            help=(
                "Relative path (from BASE_DIR) to the JSON dataset. "
                "Defaults to data/location_engineering_data.json"
            ),
        )

    def handle(self, *args, **options):
        data_path = self._resolve_data_path(options["data_file"])
        records = self._load_records(data_path)

        stats = ImportStats()
        for idx, record in enumerate(records, start=1):
            stats.rows_processed += 1
            try:
                payload = self._normalize_record(record)
            except ValueError as exc:
                stats.rows_skipped += 1
                self.stderr.write(
                    self.style.WARNING(f"Skipping row {idx}/{data_path.name}: {exc}")
                )
                continue

            self._upsert_payload(payload, stats)

        self._print_summary(stats, data_path)

    # --------------------------------------------------------------------- helpers
    def _resolve_data_path(self, raw_path: str) -> Path:
        candidate = Path(raw_path)
        if not candidate.is_absolute():
            candidate = Path(settings.BASE_DIR) / candidate

        if not candidate.exists():
            raise CommandError(f"Data file not found: {candidate}")
        if candidate.suffix.lower() != ".json":
            raise CommandError("Only JSON datasets are supported at the moment.")
        return candidate

    def _load_records(self, path: Path) -> Iterable[Dict[str, Any]]:
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CommandError(f"Unable to parse JSON: {exc}") from exc

        if not isinstance(payload, list):
            raise CommandError("JSON root must be a list of records.")
        return payload

    def _normalize_record(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        missing = [
            field
            for field in self.REQUIRED_FIELDS
            if field not in raw or raw[field] in (None, "")
        ]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(sorted(missing))}")

        try:
            normalized = {
                "state": self._normalize_name(raw["state"]),
                "district": self._normalize_name(raw["district"]),
                "wind_speed": self._to_float(raw["wind_speed"], "wind_speed"),
                "seismic_zone": self._normalize_zone(raw["seismic_zone"]),
                "seismic_factor": (
                    self._to_float(raw["seismic_factor"], "seismic_factor")
                    if raw.get("seismic_factor") not in (None, "")
                    else None
                ),
                "min_temp": self._to_float(raw["min_temp"], "min_temp"),
                "max_temp": self._to_float(raw["max_temp"], "max_temp"),
                "notes": self._normalize_optional_text(raw.get("notes")),
                "source_code": self._normalize_optional_text(raw.get("source_code"))
                or "ingestion",
                "source_station": self._normalize_optional_text(raw.get("source_station"))
                or "ingestion",
            }
        except ValueError as exc:
            raise ValueError(str(exc)) from exc

        if normalized["min_temp"] > normalized["max_temp"]:
            raise ValueError("min_temp cannot be greater than max_temp.")
        return normalized

    def _upsert_payload(self, payload: Dict[str, Any], stats: ImportStats) -> None:
        with transaction.atomic():
            state, state_created = State.objects.get_or_create(name=payload["state"])
            if state_created:
                stats.states_created += 1
                self.stdout.write(self.style.SUCCESS(f"Created state '{state.name}'"))

            district, district_created = District.objects.get_or_create(
                name=payload["district"],
                state=state,
            )
            if district_created:
                stats.districts_created += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created district '{district.name}' under '{state.name}'"
                    )
                )

            wind, created = WindData.objects.update_or_create(
                district=district,
                defaults={"wind_speed": payload["wind_speed"]},
            )
            if created:
                stats.wind_created += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created wind data for '{district.name}' ({wind.wind_speed} m/s)"
                    )
                )
            else:
                stats.wind_updated += 1
                self.stdout.write(
                    f"Updated wind data for '{district.name}' ({wind.wind_speed} m/s)"
                )

            seismic, created = SeismicData.objects.update_or_create(
                district=district,
                defaults={
                    "seismic_zone": payload["seismic_zone"],
                    "seismic_factor": payload["seismic_factor"],
                },
            )
            if created:
                stats.seismic_created += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created seismic data for '{district.name}' "
                        f"(zone {seismic.seismic_zone})"
                    )
                )
            else:
                stats.seismic_updated += 1
                self.stdout.write(
                    f"Updated seismic data for '{district.name}' "
                    f"(zone {seismic.seismic_zone})"
                )

            temperature, created = TemperatureData.objects.update_or_create(
                district=district,
                defaults={
                    "min_temp": payload["min_temp"],
                    "max_temp": payload["max_temp"],
                    "notes": payload["notes"],
                    "source_code": payload["source_code"],
                    "source_station": payload["source_station"],
                },
            )
            if created:
                stats.temp_created += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created temperature profile for '{district.name}' "
                        f"({temperature.min_temp}°C - {temperature.max_temp}°C)"
                    )
                )
            else:
                stats.temp_updated += 1
                self.stdout.write(
                    f"Updated temperature profile for '{district.name}' "
                    f"({temperature.min_temp}°C - {temperature.max_temp}°C)"
                )

    def _print_summary(self, stats: ImportStats, path: Path) -> None:
        processed = stats.rows_processed - stats.rows_skipped
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("=== Location data ingestion summary ==="))
        self.stdout.write(f"Dataset: {path}")
        self.stdout.write(f"Rows processed: {stats.rows_processed}")
        self.stdout.write(f"Rows ingested: {processed}")
        self.stdout.write(self.style.WARNING(f"Rows skipped : {stats.rows_skipped}"))
        self.stdout.write(
            f"States created   : {stats.states_created} | Districts created: {stats.districts_created}"
        )
        self.stdout.write(
            f"Wind created/updated     : {stats.wind_created}/{stats.wind_updated}"
        )
        self.stdout.write(
            f"Seismic created/updated  : {stats.seismic_created}/{stats.seismic_updated}"
        )
        self.stdout.write(
            f"Temp created/updated     : {stats.temp_created}/{stats.temp_updated}"
        )
        self.stdout.write(self.style.SUCCESS("Ingestion complete."))

    @staticmethod
    def _normalize_name(value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("State and district names must be strings.")
        normalized = " ".join(value.strip().split())
        if not normalized:
            raise ValueError("State and district names cannot be blank.")
        return normalized.title()

    @staticmethod
    def _normalize_zone(value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("Seismic zone must be a string.")
        normalized = " ".join(value.strip().split()).upper()
        if not normalized:
            raise ValueError("Seismic zone cannot be blank.")
        return normalized

    @staticmethod
    def _normalize_optional_text(value: Any) -> str | None:
        if value in (None, ""):
            return None
        if not isinstance(value, str):
            raise ValueError("Optional text values must be strings.")
        normalized = " ".join(value.strip().split())
        return normalized or None

    @staticmethod
    def _to_float(value: Any, field_name: str) -> float:
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"{field_name} must be numeric.") from exc
