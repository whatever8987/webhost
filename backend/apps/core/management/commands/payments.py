import random
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker
from apps.payments.models import SubscriptionPlan  # Replace 'your_app' with your actual app name

fake = Faker()

class Command(BaseCommand):
    help = 'Seeds the database with realistic dummy data for Subscription Plans.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--plans',
            type=int,
            default=5,
            help='Number of subscription plans to create (default: 5)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing subscription plans before seeding',
        )

    def handle(self, *args, **options):
        num_plans = options['plans']
        clear_existing = options['clear']

        self.stdout.write(self.style.SUCCESS('Starting database seeding for Subscription Plans...'))

        if clear_existing:
            self.stdout.write('Clearing existing subscription plans...')
            SubscriptionPlan.objects.all().delete()

        # Common plan types with realistic data
        plan_types = [
            {
                'name': 'Basic',
                'price_range': (990, 1990),
                'features': ['Basic feature access', 'Email support', 'Limited storage'],
                'popular': False
            },
            {
                'name': 'Standard',
                'price_range': (1990, 3990),
                'features': ['Standard features', 'Priority support', 'Medium storage', 'Analytics'],
                'popular': True
            },
            {
                'name': 'Premium',
                'price_range': (3990, 7990),
                'features': ['All features', '24/7 support', 'Unlimited storage', 'Advanced analytics', 'API access'],
                'popular': False
            },
            {
                'name': 'Starter',
                'price_range': (490, 990),
                'features': ['Basic access', 'Community support'],
                'popular': False
            },
            {
                'name': 'Enterprise',
                'price_range': (9990, 19990),
                'features': ['Everything in Premium', 'Dedicated account manager', 'Custom integrations', 'SLA guarantees'],
                'popular': False
            }
        ]

        # Create subscription plans
        for i in range(min(num_plans, len(plan_types))):
            plan_data = plan_types[i]
            name = plan_data['name']
            
            plan = SubscriptionPlan.objects.create(
                name=name,
                description=fake.paragraph(nb_sentences=2),
                price_cents=random.randint(*plan_data['price_range']),
                currency='usd',
                features=plan_data['features'],
                stripe_price_id=f'price_{fake.lexify(text="????????????????")}',
                trial_period_days=random.choice([0, 7, 14, 30]),
                is_active=True,
                is_popular=plan_data['popular']
            )

            self.stdout.write(self.style.SUCCESS(f'Created Subscription Plan: {plan}'))

        # If requested more plans than we have templates for, create additional random ones
        if num_plans > len(plan_types):
            for i in range(len(plan_types), num_plans):
                name = fake.word().capitalize() + " Plan"
                price = random.randint(500, 20000)
                features = [
                    fake.sentence(nb_words=3).rstrip('.'),
                    fake.sentence(nb_words=5).rstrip('.'),
                    fake.sentence(nb_words=4).rstrip('.')
                ]
                
                plan = SubscriptionPlan.objects.create(
                    name=name,
                    description=fake.paragraph(nb_sentences=2),
                    price_cents=price,
                    currency=random.choice(['usd', 'eur', 'gbp']),
                    features=features,
                    stripe_price_id=f'price_{fake.lexify(text="????????????????")}',
                    trial_period_days=random.choice([0, 7, 14, 30]),
                    is_active=random.choice([True, False]),
                    is_popular=random.choice([True, False])
                )

                self.stdout.write(self.style.SUCCESS(f'Created Additional Plan: {plan}'))

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {SubscriptionPlan.objects.count()} subscription plans!'))