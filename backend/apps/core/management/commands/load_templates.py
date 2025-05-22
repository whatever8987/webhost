# management/commands/load_templates.py
from django.core.management.base import BaseCommand
from salons.models import Template

DEFAULT_TEMPLATES = [
    {
        "name": "Classic Beauty",
        "description": "Elegant salon template with booking system",
    },
    {
        "name": "Modern Spa", 
        "description": "Contemporary spa template",
    }
]

class Command(BaseCommand):
    help = 'Loads basic templates into database'

    def handle(self, *args, **options):
        for template_data in DEFAULT_TEMPLATES:
            Template.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
        self.stdout.write(self.style.SUCCESS('Loaded basic templates'))