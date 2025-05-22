import json
from django.core.management.base import BaseCommand
from apps.iframe.models import Type # No change here, but app name context is important


class Command(BaseCommand):
    help = 'Imports business types from a JSON file' # Updated help text for consistency

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the JSON payload file')

    def handle(self, *args, **options):
        file_path = options['file_path']

        with open(file_path) as file:
            types_data_list = json.load(file) # Renamed variable for clarity

        for type_data in types_data_list: # Renamed variable
            # It's good practice to use get_or_create or update_or_create
            # if you might re-run this script and want to avoid duplicates
            # or update existing types. For simplicity, sticking to create:
            type_instance = Type(**type_data) # Renamed variable game_type to type_instance
            type_instance.save()

        self.stdout.write(self.style.SUCCESS('Types imported successfully!'))