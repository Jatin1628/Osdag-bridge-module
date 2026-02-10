from django.core.management import BaseCommand, call_command


class Command(BaseCommand):
    """
    Backwards-compatible seed command that now delegates to the structured loader.
    Keeping this command ensures existing CI / bootstrap scripts continue to work.
    """

    help = "Seed location and engineering data via load_location_engineering_data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            dest="data_file",
            default=None,
            help="Optional override for the dataset path passed to load_location_engineering_data.",
        )

    def handle(self, *args, **options):
        loader_kwargs = {}
        if options.get("data_file"):
            loader_kwargs["file"] = options["data_file"]

        call_command("load_location_engineering_data", **loader_kwargs)
        self.stdout.write(self.style.SUCCESS("Seeded engineering data from structured file."))
