from django.core.management.base import BaseCommand
from apps.chatbot.models import BusinessKnowledge

class Command(BaseCommand):
    help = 'Loads website information into the BusinessKnowledge model'

    def handle(self, *args, **options):
        # Clear existing knowledge
        BusinessKnowledge.objects.all().delete()

        # Define website information
        website_info = [
            {
                'category': 'General',
                'question': 'What is SalonSite?',
                'answer': 'SalonSite is a platform that helps salon owners create professional websites quickly and easily. We provide customizable templates, booking systems, and other features to help salons establish their online presence.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Features',
                'question': 'What features does SalonSite offer?',
                'answer': 'SalonSite offers customizable templates, online booking systems, client management, social media integration, SEO optimization, mobile responsiveness, and analytics tracking.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Pricing',
                'question': 'What are your pricing plans?',
                'answer': 'We offer various pricing plans starting from $29/month. Each plan includes different features and customization options. You can try our platform free for 14 days before committing.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Trial',
                'question': 'How long is the free trial?',
                'answer': 'We offer a 14-day free trial with full access to all features. No credit card required to start.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Customization',
                'question': 'Can I customize my website?',
                'answer': 'Yes! You can customize colors, fonts, layouts, and content to match your salon\'s brand. We offer various templates and design options to make your website unique.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Support',
                'question': 'What kind of support do you offer?',
                'answer': 'We offer 24/7 email support, live chat during business hours, and a comprehensive knowledge base. Premium plans include priority support.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Technical',
                'question': 'Do I need technical skills to use SalonSite?',
                'answer': 'No technical skills required! Our platform is designed to be user-friendly. You can create and manage your website using our intuitive drag-and-drop interface.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Integration',
                'question': 'Can I integrate with my existing systems?',
                'answer': 'Yes, we offer integrations with popular booking systems, payment processors, and social media platforms. Contact our support team for specific integration needs.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'SEO',
                'question': 'How does SalonSite help with SEO?',
                'answer': 'Our platform includes built-in SEO tools like meta tags, sitemaps, and mobile optimization. We also provide guidance on content optimization for better search engine rankings.',
                'metadata': {'priority': 1}
            },
            {
                'category': 'Mobile',
                'question': 'Are the websites mobile-friendly?',
                'answer': 'Yes, all SalonSite websites are fully responsive and optimized for mobile devices. Your website will look great on any screen size.',
                'metadata': {'priority': 1}
            }
        ]

        # Create BusinessKnowledge objects
        for info in website_info:
            BusinessKnowledge.objects.create(
                category=info['category'],
                question=info['question'],
                answer=info['answer'],
                metadata=info['metadata'],
                is_active=True
            )

        self.stdout.write(self.style.SUCCESS('Successfully loaded website information')) 