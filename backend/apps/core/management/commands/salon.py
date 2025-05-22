# salons/management/commands/seed_salons.py

import random
import json
from datetime import timedelta, timezone as datetime_timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from django.conf import settings
from faker import Faker
from django.utils import timezone
from django.db.utils import DataError
from salons.models import Template, Salon

User = get_user_model()
fake = Faker()

# Constants
SAMPLE_OPENING_HOURS = "Monday - Friday: 9:00 AM - 7:00 PM\nSaturday: 9:00 AM - 6:00 PM\nSunday: Closed"
SAMPLE_MAP_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.264387659134!2d-74.01283148459468!3d40.7484402793281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0x2c159c7f79a37921!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1645745845828!5m2!1sen!2sus"

def truncate(value, max_length):
    """Ensure value doesn't exceed PostgreSQL field length limits"""
    if value is None:
        return None
    try:
        value_str = str(value)
        return value_str[:max_length] if len(value_str) > max_length else value_str
    except:
        return value

def generate_fake_services(num):
    services = []
    for _ in range(num):
        services.append({
            "name": truncate(fake.bs().title(), 100),
            "price": f"${random.randint(20, 150)}{random.choice(['', '+'])}",
            "description": truncate(fake.sentence(nb_words=random.randint(5, 15)), 200),
        })
    return services

def generate_fake_gallery_images(num):
    images = []
    for _ in range(num):
        seed = truncate(fake.word() + str(random.randint(1,10000)), 50)
        images.append(f'https://picsum.photos/seed/{seed}/600/400')
    return images

def generate_fake_testimonials(num):
    testimonials = []
    for _ in range(num):
        testimonials.append({
            "quote": truncate(fake.paragraph(nb_sentences=random.randint(2, 5)), 500),
            "client_name": truncate(fake.name(), 50),
            "client_title": truncate(fake.job(), 50) if random.random() < 0.5 else None,
        })
    return testimonials

def generate_fake_social_links():
    platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Pinterest']
    links = []
    chosen_platforms = random.sample(platforms, random.randint(1, len(platforms)))
    for platform in chosen_platforms:
        links.append({
            "platform": truncate(platform, 20),
            "url": truncate(fake.url(), 200),
        })
    return links

class Command(BaseCommand):
    help = 'Seeds the database with realistic dummy data for Salon models only, setting all to unclaimed.'

    def handle(self, *args, **options):
        num_salons = 50
        self.stdout.write(self.style.SUCCESS('Starting database seeding (Salons only - All unclaimed)...'))

        templates = list(Template.objects.all())
        if not templates:
            self.stdout.write(self.style.WARNING('No Templates found. Create some templates first (e.g., by running seed_templates).'))
            return

        self.stdout.write(f'Creating {num_salons} Unclaimed Salons...')
        created_count = 0
        failed_count = 0

        for i in range(num_salons):
            salon_name_base = fake.company()
            salon_name = truncate(
                f"{salon_name_base} {random.choice(['Nails', 'Spa', 'Studio', 'Beauty', 'Hair'])}",
                100
            )
            if Salon.objects.filter(name=salon_name).exists():
                salon_name = truncate(f"{salon_name[:90]} {random.randint(10, 99)}", 100)

            location_city = truncate(fake.city(), 50)
            location_state = truncate(fake.state_abbr(), 10)
            template_to_assign = random.choice(templates) if templates else None

            salon_data = {
                'name': salon_name,
                'location': truncate(f"{location_city}, {location_state}", 100),
                'address': truncate(fake.street_address(), 200),
                'phone_number': truncate(fake.phone_number(), 20),
                'email': truncate(fake.company_email(), 100),
                'description': truncate(fake.paragraph(nb_sentences=random.randint(3, 6)), 500),
                'image': 'media/default.png',
                'services': generate_fake_services(random.randint(5, 15)),
                'opening_hours': SAMPLE_OPENING_HOURS,
                'template': template_to_assign,
                'claimed': False,
                'contact_status': random.choice(['notContacted', 'contacted', 'interested', 'notInterested']),
                'owner': None,
            }

            try:
                with transaction.atomic():
                    salon = Salon.objects.create(**salon_data)
                    created_count += 1
                    self.stdout.write(f'  Created Salon ({created_count}/{num_salons}): {salon.name} (Claimed: False)')
            except Exception as e:
                failed_count += 1
                self.stdout.write(self.style.ERROR(f'  Failed to create salon {salon_name} ({failed_count} failures): {e}'))

        total_salons_after = Salon.objects.count()
        self.stdout.write(self.style.SUCCESS('\nDatabase seeding (Salons only) completed!'))
        self.stdout.write(self.style.SUCCESS(f'Salons created in this run: {created_count}'))
        self.stdout.write(self.style.SUCCESS(f'Salons failed to create: {failed_count}'))
        self.stdout.write(self.style.SUCCESS(f'Total Salons in DB: {total_salons_after}'))