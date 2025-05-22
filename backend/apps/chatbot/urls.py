# chatbot/urls.py
from django.urls import path
from .views import chat, conversation_list, conversation_detail

# Add this line:
app_name = 'chatbot'

urlpatterns = [
    path('chat/', chat, name='chat'),
    path('conversations/', conversation_list, name='conversation-list'),
    path('conversations/<uuid:pk>/', conversation_detail, name='conversation-detail'),
]