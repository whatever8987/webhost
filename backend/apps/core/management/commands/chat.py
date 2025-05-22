# core/management/commands/seed_chat_data.py

import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from faker import Faker

# Import your models
from apps.chatbot.models import ChatConversation, ChatMessage, BusinessKnowledge  # Replace 'your_app' with your actual app name

fake = Faker()

class Command(BaseCommand):
    help = 'Seeds the database with realistic dummy data for chat-related models.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--conversations',
            type=int,
            default=20,
            help='Number of conversations to create (default: 20)',
        )
        parser.add_argument(
            '--knowledge',
            type=int,
            default=50,
            help='Number of business knowledge entries to create (default: 50)',
        )

    def safe_create(self, model, defaults, **kwargs):
        """Wrapper to safely create models with error handling"""
        try:
            obj, created = model.objects.get_or_create(defaults=defaults, **kwargs)
            if created:
                return obj, True
            return obj, False
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating {model.__name__}: {e}'))
            return None, False

    @transaction.atomic
    def handle(self, *args, **options):
        num_conversations = options['conversations']
        num_knowledge = options['knowledge']

        self.stdout.write(self.style.SUCCESS('Starting database seeding for chat data...'))

        # --- 1. Create Business Knowledge ---
        self.stdout.write(f'Creating {num_knowledge} Business Knowledge entries...')
        categories = ['General', 'Products', 'Services', 'Pricing', 'Support', 'Shipping', 'Returns', 'Account']
        
        for i in range(num_knowledge):
            category = random.choice(categories)
            question = fake.sentence().rstrip('.') + '?'
            
            knowledge, created = self.safe_create(
                BusinessKnowledge,
                defaults={
                    'category': category,
                    'question': question,
                    'answer': '\n'.join(fake.paragraphs(random.randint(1, 3))),
                    'metadata': {
                        'created_by': fake.name(),
                        'last_updated': fake.date_time_this_year().isoformat(),
                        'tags': [fake.word() for _ in range(random.randint(1, 3))]
                    },
                    'is_active': random.choice([True, False]) if random.random() > 0.8 else True
                },
                question=question  # Use question as the lookup criteria
            )

            status = "Created" if created else "Exists"
            self.stdout.write(f'  {status} Business Knowledge: {question[:50]}...')

        # --- 2. Create Conversations ---
        self.stdout.write(f'\nCreating {num_conversations} Chat Conversations...')
        
        for i in range(num_conversations):
            # 30% chance of null user
            user = None
            if random.random() > 0.3:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if User.objects.exists():
                    user = random.choice(User.objects.all())

            session_id = fake.uuid4()
            started_at = timezone.now() - timedelta(days=random.randint(0, 30))
            
            conversation, created = self.safe_create(
                ChatConversation,
                defaults={
                    'user': user,
                    'session_id': session_id,
                    'started_at': started_at,
                    'ip_address': fake.ipv4() if random.random() > 0.2 else None,
                    'user_agent': fake.user_agent() if random.random() > 0.2 else None
                },
                session_id=session_id  # Use session_id as the lookup criteria
            )

            if not conversation:
                continue

            status = "Created" if created else "Exists"
            self.stdout.write(f'  {status} Conversation: {session_id}')

            # --- 3. Create Messages for this Conversation ---
            num_messages = random.randint(1, 15)
            self.stdout.write(f'    Adding {num_messages} messages to conversation...')
            
            for j in range(num_messages):
                is_from_user = random.choice([True, False])
                if is_from_user:
                    content = fake.sentence()
                else:
                    content = '\n'.join(fake.paragraphs(random.randint(1, 3)))
                
                message, created = self.safe_create(
                    ChatMessage,
                    defaults={
                        'conversation': conversation,
                        'content': content,
                        'is_from_user': is_from_user,
                        'timestamp': started_at + timedelta(minutes=random.randint(1, 60 * 24 * 7)),
                        'metadata': {
                            'message_id': fake.uuid4(),
                            'length': len(content),
                            'source': 'user' if is_from_user else 'bot'
                        }
                    },
                    # No unique field to use for lookup, so we'll always create new messages
                    content=content,
                    conversation=conversation,
                    is_from_user=is_from_user
                )

        # --- Final Report ---
        self.stdout.write(self.style.SUCCESS('\nDatabase seeding completed!'))
        self.stdout.write(self.style.SUCCESS(f'Total Business Knowledge: {BusinessKnowledge.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Total Conversations: {ChatConversation.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Total Messages: {ChatMessage.objects.count()}'))