# admin.py
from django.contrib import admin
from .models import ChatConversation, ChatMessage, BusinessKnowledge

class MessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0

@admin.register(ChatConversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'started_at')
    inlines = [MessageInline]

@admin.register(BusinessKnowledge)
class KnowledgeAdmin(admin.ModelAdmin):
    list_display = ('category', 'question', 'is_active')
    search_fields = ('question', 'answer')
    list_filter = ('category', 'is_active')