# core/management/commands/seed_templates.py

import random
import json # Keep if any JSONField generation needs it, otherwise can remove
from django.core.management.base import BaseCommand
# No need for get_user_model
# No need for timezone or datetime_timezone for just templates
from django.db import transaction
# No need for slugify if not creating users/salons with slugify
# No need for settings
from faker import Faker

# Import your models - ONLY Template is needed now
from salons.models import Template

# No need for User, Salon


# Initialize Faker
fake = Faker()

# --- Helper Functions needed for Templates ---
def truncate(value, max_length):
    """Ensure value doesn't exceed PostgreSQL field length limits"""
    if value is None:
        return None
    return value[:max_length] if len(value) > max_length else value

# Only keep helpers relevant to Template fields
# generate_fake_services, generate_fake_gallery_images, etc., are NOT needed

# --- End Helper Functions ---

class Command(BaseCommand):
    help = 'Seeds the database with realistic dummy data for Template models only.'

    def safe_create(self, model, defaults, **kwargs):
        """Wrapper to safely create models with error handling (copied from seed_db.py)"""
        # Note: DataError handling might need adjustment based on specific field lengths
        # and database backend if issues persist. Truncating to a generic 255 might not
        # be sufficient for fields with other lengths, but it's a starting point.
        try:
            obj, created = model.objects.get_or_create(defaults=defaults, **kwargs)
            if created:
                return obj, True
            return obj, False
        except Exception as e:
            # Simplified error handling for this command, assuming DataError is less likely
            # with just Template fields compared to Salons
            self.stdout.write(self.style.ERROR(f'Error creating {model.__name__}: {e}'))
            return None, False


    @transaction.atomic
    def handle(self, *args, **options):
        # Define how many templates to create (or which ones by name)
        num_templates_to_create = 10 # Or set to len(template_names) to create all below

        self.stdout.write(self.style.SUCCESS('Starting database seeding (Templates only)...'))

        # --- 1. Create Templates ---
        self.stdout.write(f'Creating {num_templates_to_create} Templates...')
        template_names = ["Elegant", "Modern", "Luxury", "Friendly", "Minimalist",
                        "Artistic", "Vibrant", "Dark Mode", "Natural", "Classic"]
        # Ensure we don't try to create more than we have names for
        template_names_to_create = template_names[:num_templates_to_create]

        templates = [] # List to store created template objects if needed later (not needed in this version)

        for name in template_names_to_create:
            # Generate data specific to the Template model
            template_data = {
                # Apply truncate based on your Template model's field max_length
                'name': truncate(name, 50), # Assuming max_length=50 for name
                'description': truncate(fake.sentence(nb_words=10), 200), # Assuming max_length=200 for description
                # Image fields might store URLs, assuming CharField max_length=200 or 255
                'preview_image': truncate(fake.image_url() if random.random() < 0.7 else None, 255),
                'primary_color': truncate(fake.hex_color(), 7), # Max length for hex color
                'secondary_color': truncate(fake.hex_color(), 7),
                'font_family': truncate(random.choice([
                    "'Poppins', sans-serif",
                    "'Georgia', serif",
                    "'Roboto', sans-serif",
                    "'Open Sans', sans-serif", # Added another common font
                ]), 50), # Assuming max_length=50
                'background_color': truncate(fake.hex_color(), 7),
                'text_color': truncate(fake.hex_color(), 7),
                # Default images for the template itself
                'default_cover_image': truncate(fake.image_url() if random.random() < 0.6 else None, 255),
                'default_about_image': truncate(fake.image_url() if random.random() < 0.6 else None, 255),

                # Features (JSONField) - Ensure keys match your model's JSON structure expectations
                'features': {
                    "show_gallery": random.random() < 0.8,
                    "show_testimonials": random.random() < 0.7,
                    "show_social_icons": random.random() < 0.9,
                    "show_map_or_form": random.random() < 0.85,
                    # Add other template features here if your model supports them
                    "custom_css": fake.text(max_nb_chars=500) if random.random() < 0.1 else None, # Example: Optional custom CSS
                },
                'is_mobile_optimized': True # Assuming all seeded templates are mobile optimized
            }

            # Use get_or_create based on a unique field, like 'name', to avoid duplicates
            template, created = self.safe_create(
                Template,
                defaults=template_data, # Use generated data as defaults if object is created
                name=name             # Use name as the lookup criteria
            )

            if template:
                # You could append to `templates` list here if you needed them after creation
                status = "Created" if created else "Exists"
                self.stdout.write(f'  {status} Template: {name}')
            else:
                self.stdout.write(self.style.WARNING(f'  Failed to create or get Template: {name}'))


        # --- Final Report ---
        templates_count = Template.objects.count()
        self.stdout.write(self.style.SUCCESS('\nDatabase seeding (Templates only) completed!'))
        self.stdout.write(self.style.SUCCESS(f'Total Templates in DB: {templates_count}'))

