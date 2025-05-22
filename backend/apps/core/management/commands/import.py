# salon_app/management/commands/import_salons_csv.py

import csv
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify
from django.utils import timezone # Import timezone if your save method uses it

# Make sure this import path is correct for your app
from salons.models import Salon, Template

# --- Helper Functions ---

def clean_csv_value(value):
    """
    Cleans a string value from the CSV, returning None if it's empty
    or contains typical "Not Available" markers (case-insensitive),
    after ensuring it's a string.
    """
    # Explicitly handle non-string inputs
    if value is None:
        return None
    if not isinstance(value, str):
         # Attempt to convert to string, but still check for None-like values after
        try:
            value = str(value)
        except Exception:
            # If conversion fails, treat as None
            return None

    cleaned = value.strip()
    if cleaned == "" or cleaned.lower() in ["not available", "na", "n/a", "none"]:
        return None
    return cleaned

def parse_gallery_images(image_string):
    """
    Parses a comma-separated string of image URLs into a list of strings.
    Handles empty or "Not Available" inputs by returning an empty list.
    Also handles potential trailing commas.
    """
    cleaned_string = clean_csv_value(image_string)
    if cleaned_string is None:
        return [] # JSONField expects a list

    # Split by comma, strip whitespace from each part, and filter out empty strings
    urls = [url.strip() for url in cleaned_string.split(',') if url.strip()]
    # Optional: Add a basic URL validation or length check here if needed

    return urls

# --- End Helper Functions ---


class Command(BaseCommand):
    help = 'Imports salon data from a specified CSV file, creating new salons.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='The path to the CSV file to import.')
        parser.add_argument(
            '--template-slug',
            type=str,
            help='Slug of the default template to assign to imported salons.',
            default=None
        )
        parser.add_argument(
             '--force-create',
             action='store_true',
             help='Force creation even if a salon with the same name and address exists.'
        )
        parser.add_argument(
            '--encoding',
            type=str,
            default='utf-8',
            help='Encoding of the CSV file (default: utf-8).'
        )


    # Keep transaction.atomic on handle() for overall import consistency.
    # Improved error handling inside the loop will prevent the atomic error.
    @transaction.atomic
    def handle(self, *args, **options):
        csv_file_path = options['csv_file']
        template_slug_to_assign = options['template_slug']
        force_create = options['force_create']
        csv_encoding = options['encoding']

        # --- Validation ---
        if not os.path.exists(csv_file_path):
            raise CommandError(f'File "{csv_file_path}" does not exist.')

        default_template = None
        if template_slug_to_assign:
            try:
                default_template = Template.objects.get(slug=template_slug_to_assign)
                self.stdout.write(self.style.SUCCESS(f'Assigning default template: "{default_template.name}" (Slug: {default_template.slug})'))
            except Template.DoesNotExist:
                raise CommandError(f'Template with slug "{template_slug_to_assign}" not found.')

        self.stdout.write(self.style.SUCCESS(f'Starting import from {csv_file_path} with encoding {csv_encoding}...'))

        imported_count = 0
        skipped_count = 0
        failed_count = 0

        # Define the column mapping based on observation of row 852 and previous rows.
        # ADJUST THESE INDICES CAREFULLY BASED ON YOUR EXACT CSV FILE STRUCTURE.
        COLUMN_MAPPING = {
            'name': 0,
            # 1: Google Maps URL (ignored - if you need this, add a field)
            'image': 2, # Main image URL string
            # 3: Rating (ignored)
            'location': 4, # e.g., "Not Available" or "Bellingham, WA"
            'description': 5, # e.g., "Massage spa", "Nail salon" - Often short category text in this data
            'address': 6, # Full street address
            'opening_hours': 7, # String format like "Day,Hours,Day,Hours,..."
            # 8, 9: Seem to be "Not Available" placeholders in the example data
            'phone_number': 10,
            'gallery_images_string': 11, # Comma-separated URLs string
            # 12 onwards: Latitude, Longitude, other "Not Available" fields (ignored)
        }

        # Determine the minimum number of columns expected
        MIN_COLUMNS = max(COLUMN_MAPPING.values()) + 1

        # --- Read and Process CSV ---
        try:
            # Use the specified encoding
            with open(csv_file_path, mode='r', encoding=csv_encoding) as csvfile:
                reader = csv.reader(csvfile)

                # Optional: Skip header row if your CSV has one. Uncomment the line below.
                # next(reader)

                for row_num, row in enumerate(reader, start=1):
                    # Skip completely empty rows
                    if not row or all(clean_csv_value(cell) is None for cell in row):
                        self.stdout.write(self.style.WARNING(f'Skipping empty or all-null row {row_num}.'))
                        skipped_count += 1 # Count as skipped for reporting
                        continue

                    # Check if the row has enough columns
                    if len(row) < MIN_COLUMNS:
                        self.stdout.write(self.style.ERROR(f'Skipping row {row_num}: Expected at least {MIN_COLUMNS} columns based on mapping, found {len(row)}. Data: {row}'))
                        failed_count += 1
                        continue

                    # --- Extract, Clean, and Prepare Data ---
                    # Use a nested try-except block here to catch errors during
                    # data extraction or dictionary creation, which are the *first*
                    # errors that would cause the transaction issue.
                    try:
                        name = clean_csv_value(row[COLUMN_MAPPING['name']])
                        # Name is a required field in the model, skip row if missing
                        if not name:
                             self.stdout.write(self.style.WARNING(f'Skipping row {row_num}: Salon name is missing or "Not Available". Raw value: "{row[COLUMN_MAPPING["name"]]}"'))
                             skipped_count += 1
                             continue

                        address = clean_csv_value(row[COLUMN_MAPPING['address']])
                        location = clean_csv_value(row[COLUMN_MAPPING['location']])
                        phone_number = clean_csv_value(row[COLUMN_MAPPING['phone_number']])
                        main_image_url = clean_csv_value(row[COLUMN_MAPPING['image']])
                        raw_opening_hours = clean_csv_value(row[COLUMN_MAPPING['opening_hours']])
                        raw_gallery_images_string = clean_csv_value(row[COLUMN_MAPPING['gallery_images_string']])
                        short_description = clean_csv_value(row[COLUMN_MAPPING['description']])


                        # --- Check for Duplicates (Optional but Recommended) ---
                        # This check needs to happen *before* creating the object
                        # to avoid unnecessary saves/slug generation for duplicates.
                        # Only check if we have enough data for a meaningful check and not forcing create.
                        if not force_create and name and (address or location): # Require name AND address or location for check
                             # Use filter().exists() outside the object's save method
                             if Salon.objects.filter(name=name, address=address).exists() or Salon.objects.filter(name=name, location=location).exists():
                                 self.stdout.write(self.style.WARNING(f'Skipping row {row_num}: Salon "{name}" at address "{address}" or location "{location}" likely already exists. Use --force-create to import anyway.'))
                                 skipped_count += 1
                                 continue
                             # Note: This duplicate check is simple. More complex checks
                             # might involve fuzzy matching or checking combinations of fields.


                        # --- Prepare Salon Data Dictionary ---
                        salon_data = {
                            'name': name, # Name is guaranteed not to be None here
                            'location': location,
                            'address': address,
                            'phone_number': phone_number,
                            'image': main_image_url, # Main image URL string

                            # Assuming CSV description column 5 is meant for the main description field
                            'description': short_description,

                            # Opening hours as a single text block
                            'opening_hours': raw_opening_hours, # Assign the cleaned string directly

                            # JSON Fields - parse specifically or set to defaults if not in CSV
                            'gallery_images': parse_gallery_images(raw_gallery_images_string),

                            # Fields assumed not to be in the mapped columns of the CSV,
                            # set to None or their model defaults (which are often blank/null)
                            'email': None,
                            'services': [],
                            'testimonials': [],
                            'social_links': [],

                            'logo_image': None,
                            'cover_image': None,
                            'about_image': None,
                            'footer_logo_image': None,

                            'hero_subtitle': None,
                            'services_tagline': None,
                            'gallery_tagline': None,
                            'footer_about': None,

                            'booking_url': None,
                            'gallery_url': None,
                            'services_url': None,
                            'map_embed_url': None, # CSV Col 1 is Place URL, not embed URL

                            # Claiming/Ownership Status - default to unclaimed on import
                            'claimed': False,
                            'claimed_at': None,
                            'contact_status': 'notContacted',
                            'owner': None,

                            # Assign the default template if provided via argument
                            'template': default_template,

                            # sample_url will be automatically generated by the model's save method
                        }

                        # --- Create Salon Instance ---
                        # This call will trigger the model's save method, including slug generation.
                        # Because we are now *inside* a try-except block dedicated to this row,
                        # if the save method (or anything before it) fails, the exception
                        # will be caught here, logged, and the loop will continue to the next row.
                        # The atomic transaction *will* be marked for rollback for this specific row's work,
                        # but subsequent rows can still be processed in the same transaction
                        # because the exception is handled *within* the loop.
                        salon = Salon.objects.create(**salon_data)

                        imported_count += 1
                        self.stdout.write(self.style.SUCCESS(f'Successfully imported row {row_num}: "{salon.name}"'))

                    except (IndexError, ValueError, TypeError) as e:
                         # Catch specific data-related errors during extraction/parsing
                         self.stdout.write(self.style.ERROR(f'Failed to process data for row {row_num}: {type(e).__name__}: {e} - Raw row data (first 12 columns): {row[:12]}...'))
                         failed_count += 1
                         continue # Move to the next row

                    except Exception as e:
                        # Catch any other unexpected errors during the creation process (e.g., database error)
                        # The 'An error occurred in the current transaction' might still appear
                        # if the *original* error isn't caught by the more specific exceptions above,
                        # but logging the general exception here will still provide the cause.
                        self.stdout.write(self.style.ERROR(f'Failed to import row {row_num} for salon "{name or "Unnamed"}": {type(e).__name__}: {e} - Raw row data (first 12 columns): {row[:12]}...'))
                        failed_count += 1
                        continue # Move to the next row


        except FileNotFoundError:
             raise CommandError(f'Error opening file "{csv_file_path}".')
        except Exception as e:
            # Catch errors during file reading itself or critical errors outside the row loop
             self.stdout.write(self.style.ERROR(f'A critical error occurred during CSV processing: {type(e).__name__}: {e}'))
             # This exception will propagate and cause the @transaction.atomic to rollback everything.


        # --- Final Report ---
        self.stdout.write(self.style.SUCCESS('\n--- CSV Import Summary ---'))
        self.stdout.write(self.style.SUCCESS(f'Import process completed.'))
        self.stdout.write(self.style.SUCCESS(f'Successfully imported: {imported_count}'))
        self.stdout.write(self.style.WARNING(f'Skipped (missing name or duplicate check): {skipped_count}'))
        self.stdout.write(self.style.ERROR(f'Failed to import (processing error): {failed_count}'))
        self.stdout.write(self.style.SUCCESS(f'Total rows processed: {imported_count + skipped_count + failed_count}'))