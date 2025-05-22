# core/management/commands/seed_db.py

import random
import json
from datetime import timedelta, timezone as datetime_timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.utils.text import slugify
from django.conf import settings
from faker import Faker
from django.db.utils import DataError

# Import your models from other apps
from salons.models import Template, Salon


User = get_user_model()
fake = Faker()

# --- Helper Functions with PostgreSQL-safe lengths ---
def truncate(value, max_length):
    """Ensure value doesn't exceed PostgreSQL field length limits"""
    return value[:max_length] if value and len(value) > max_length else value

def generate_fake_services(num):
    services = []
    for _ in range(num):
        services.append({
            "name": truncate(fake.bs().title(), 100),  # Increased from 20
            "price": f"${random.randint(20, 150)}{random.choice(['', '+'])}",
            "description": truncate(fake.sentence(nb_words=random.randint(5, 15)), 200),
        })
    return services

def generate_fake_gallery_images(num):
    images = []
    for _ in range(num):
        seed = truncate(fake.word(), 50)
        images.append(f'https://picsum.photos/seed/{seed}/600/400')
    return images

def generate_fake_testimonials(num):
    testimonials = []
    for _ in range(num):
        testimonials.append({
            "quote": truncate(fake.paragraph(nb_sentences=random.randint(2, 5)), 500),
            "client_name": truncate(fake.name(), 50),
            "client_title": truncate(fake.job(), 50) if random.random() < 0.5 else None
        })
    return testimonials

def generate_fake_social_links():
    platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Pinterest']
    links = []
    for platform in random.sample(platforms, random.randint(1, len(platforms))):
        links.append({
            "platform": truncate(platform, 20),
            "url": truncate(fake.url(), 200),
        })
    return links

# --- End Helper Functions ---

class Command(BaseCommand):
    help = 'Seeds the database with realistic dummy data for testing and development.'

    def safe_create(self, model, defaults, **kwargs):
        """Wrapper to safely create models with error handling"""
        try:
            obj, created = model.objects.get_or_create(defaults=defaults, **kwargs)
            if created:
                return obj, True
            return obj, False
        except DataError as e:
            self.stdout.write(self.style.ERROR(f'DataError creating {model.__name__}: {e}'))
            # Try again with truncated values
            truncated_defaults = {k: truncate(v, 255) if isinstance(v, str) else v 
                               for k, v in defaults.items()}
            try:
                obj, created = model.objects.get_or_create(defaults=truncated_defaults, **kwargs)
                return obj, created
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed again: {e}'))
                return None, False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating {model.__name__}: {e}'))
            return None, False

    @transaction.atomic
    def handle(self, *args, **options):
        num_users = 15
        num_salons = 30
        num_posts = 25
        num_comments_per_post = 5
        num_templates_to_create = 10

        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # --- 1. Create Templates ---
        self.stdout.write(f'Creating {num_templates_to_create} Templates...')
        template_names = ["Elegant", "Modern", "Luxury", "Friendly", "Minimalist", 
                        "Artistic", "Vibrant", "Dark Mode", "Natural", "Classic"]
        templates = []
        
        for name in template_names[:num_templates_to_create]:
            template_data = {
                'name': truncate(name, 50),
                'description': truncate(fake.sentence(nb_words=10), 200),
                'preview_image': None,
                'primary_color': fake.hex_color(),
                'secondary_color': fake.hex_color(),
                'font_family': truncate(random.choice([
                    "'Poppins', sans-serif", 
                    "'Georgia', serif", 
                    "'Roboto', sans-serif"
                ]), 50),
                'background_color': fake.hex_color(),
                'text_color': fake.hex_color(),
                'default_cover_image': None,
                'default_about_image': None,
                'features': {
                    "show_gallery": random.random() < 0.8,
                    "show_testimonials": random.random() < 0.7,
                    "show_social_icons": random.random() < 0.9,
                    "show_map_or_form": random.random() < 0.85,
                },
                'is_mobile_optimized': True
            }
            
            template, created = self.safe_create(
                Template,
                defaults=template_data,
                name=name
            )
            
            if template:
                templates.append(template)
                status = "Created" if created else "Exists"
                self.stdout.write(f'  {status} Template: {name}')
            else:
                self.stdout.write(self.style.WARNING(f'  Failed to create Template: {name}'))

        if not templates:
            self.stdout.write(self.style.ERROR('No Templates created. Aborting.'))
            return

        # --- 2. Create Users ---
        self.stdout.write(f'Creating {num_users} Users...')
        users = []

        # Create admin user
        admin_data = {
            'email': 'admin_seed@example.com',
            'first_name': truncate('Admin', 30),
            'last_name': truncate('Seeded', 30),
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True,
        }
        admin_user, created = self.safe_create(
            User,
            defaults=admin_data,
            username='admin_seed'
        )
        
        if admin_user:
            admin_user.set_password('password')
            admin_user.save()
            users.append(admin_user)
            status = "Created" if created else "Exists"
            self.stdout.write(f'  {status} Admin: admin_seed (pw: password)')
        else:
            self.stdout.write(self.style.ERROR('  Failed to create admin user'))

        # Create regular users
        for i in range(num_users - 1):  # -1 because we already created admin
            first_name = truncate(fake.first_name(), 30)
            last_name = truncate(fake.last_name(), 30)
            base_username = f'{slugify(first_name)[:10]}{slugify(last_name)[:10]}'
            username = base_username[:30]  # Ensure fits in username field
            
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username[:25]}{counter}'
                counter += 1

            user_data = {
                'email': truncate(fake.email(), 100),
                'first_name': first_name,
                'last_name': last_name,
                'role': 'user',
                'phone_number': truncate(fake.phone_number(), 20),
                'is_staff': False,
                'is_superuser': False,
            }
            
            user, created = self.safe_create(
                User,
                defaults=user_data,
                username=username
            )
            
            if user:
                user.set_password('password')
                user.save()
                users.append(user)
                status = "Created" if created else "Exists"
                self.stdout.write(f'  {status} User: {username} (pw: password)')
            else:
                self.stdout.write(self.style.WARNING(f'  Failed to create user {username}'))

        # --- 3. Create Salons ---
        self.stdout.write(f'Creating {num_salons} Salons...')
        salons = []
        
        for i in range(num_salons):
            salon_name = truncate(
                f"{fake.company()} {random.choice(['Nails', 'Spa', 'Studio'])}", 
                100
            )
            location_city = truncate(fake.city(), 50)
            location_state = truncate(fake.state_abbr(), 10)
            is_claimed = random.random() < 0.4
            
            salon_data = {
                'name': salon_name,
                'location': truncate(f"{location_city}, {location_state}", 100),
                'address': truncate(fake.street_address(), 200),
                'phone_number': truncate(fake.phone_number(), 20),
                'email': truncate(fake.company_email(), 100),
                'description': truncate(fake.paragraph(nb_sentences=random.randint(3, 6)), 500),
                'hero_subtitle': truncate(fake.sentence(nb_words=random.randint(5, 10)).strip('.'), 200),
                'services_tagline': truncate(fake.sentence(nb_words=random.randint(6, 12)).strip('.'), 200),
                'gallery_tagline': truncate(fake.sentence(nb_words=random.randint(6, 12)).strip('.'), 200),
                'footer_about': truncate(fake.paragraph(nb_sentences=random.randint(1, 3)), 300),
                'booking_url': truncate(fake.url(), 200) if random.random() < 0.7 else None,
                'map_embed_url': SAMPLE_MAP_EMBED_URL,
                'services': generate_fake_services(random.randint(5, 15)),
                'gallery_images': generate_fake_gallery_images(random.randint(4, 10)),
                'testimonials': generate_fake_testimonials(random.randint(3, 6)),
                'social_links': generate_fake_social_links() if random.random() < 0.9 else [],
                'opening_hours': SAMPLE_OPENING_HOURS,
                'template': random.choice(templates),
                'claimed': is_claimed,
                'claimed_at': fake.past_datetime(start_date='-1y', tzinfo=datetime_timezone.utc) if is_claimed else None,
                'contact_status': 'subscribed' if is_claimed else random.choice(['new', 'contacted', 'not_interested']),
            }
            
            try:
                salon = Salon.objects.create(**salon_data)
                salons.append(salon)
                self.stdout.write(f'  Created Salon: {salon.name}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Failed to create salon {salon_name}: {e}'))

        # --- 4. Create Blog Posts ---
        

        # --- 6. Final Report ---
        self.stdout.write(self.style.SUCCESS('\nDatabase seeding completed!'))
        self.stdout.write(self.style.SUCCESS(f'Templates: {Template.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Users: {User.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Salons: {Salon.objects.count()}'))
        #self.stdout.write(self.style.SUCCESS(f'Blog Posts: {BlogPost.objects.count()}'))
        #self.stdout.write(self.style.SUCCESS(f'Comments: {BlogComment.objects.count()}'))

# Constants
SAMPLE_OPENING_HOURS = "Monday - Friday: 9:00 AM - 7:00 PM\nSaturday: 9:00 AM - 6:00 PM\nSunday: Closed"
SAMPLE_MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.264387659134!2d-74.01283148459468!3d40.7484402793281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0x2c159c7f79a37921!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1645745845828!5m2!1sen!2sus"