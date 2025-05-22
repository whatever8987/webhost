import json
from django.core.management.base import BaseCommand
from apps.iframe.models import Business, Type # Changed Game to Business


class Command(BaseCommand):
    help = 'Imports businesses from a JSON file' # Updated help text

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the JSON payload file')

    def handle(self, *args, **options):
        file_path = options['file_path']

        with open(file_path) as file:
            businesses_data_list = json.load(file) # Renamed variable

        for business_data in businesses_data_list: # Renamed variable
            type_id = business_data.pop('type')
            # Consider more robust error handling if Type might not exist
            try:
                business_type_instance = Type.objects.get(pk=type_id) # Renamed variable for clarity
            except Type.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Type with id {type_id} not found. Skipping business: {business_data.get('name', 'Unknown')}"))
                continue

            # Create Business instance
            business = Business(**business_data, type=business_type_instance) # Renamed Game to Business, variable
            business.save()

        self.stdout.write(self.style.SUCCESS('Businesses imported successfully!')) # Updated success message