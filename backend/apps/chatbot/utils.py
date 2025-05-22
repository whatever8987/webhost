from django.db.models import Q
from .models import BusinessKnowledge
import logging

logger = logging.getLogger(__name__)

def get_business_knowledge(query):
    try:
        # Log the incoming query
        logger.info(f"Searching business knowledge for query: {query}")
        
        # Get the knowledge entries
        knowledge = BusinessKnowledge.objects.filter(
            Q(question__icontains=query) | Q(answer__icontains=query),
            is_active=True
        ).values('question', 'answer')[:5]  # Limit to 5 most relevant
        
        # Log the results
        logger.info(f"Found {len(knowledge)} relevant entries")
        
        # If no results found, return some general information
        if not knowledge:
            logger.info("No specific matches found, returning general information")
            return BusinessKnowledge.objects.filter(
                category='General',
                is_active=True
            ).values('question', 'answer')[:2]
        
        return knowledge
    except Exception as e:
        logger.error(f"Error in get_business_knowledge: {str(e)}")
        return []
