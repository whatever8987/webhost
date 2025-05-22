from django.db import models
from django.conf import settings  # Add this import

class ChatConversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Use this instead of 'User'
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    session_id = models.CharField(max_length=255)
    started_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

class ChatMessage(models.Model):
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    is_from_user = models.BooleanField()
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)


class BusinessKnowledge(models.Model):
    category = models.CharField(max_length=100)
    question = models.TextField()
    answer = models.TextField()
    metadata = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)