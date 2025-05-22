# chatbot/serializers.py
from rest_framework import serializers
from .models import ChatConversation, ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'is_from_user', 'timestamp', 'metadata']
        read_only_fields = ['id', 'timestamp']

class ChatConversationSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())

    class Meta:
        model = ChatConversation
        fields = ['id', 'user', 'session_id', 'started_at', 'ip_address', 'user_agent', 'messages']
        read_only_fields = ['id', 'started_at', 'user']

class ChatRequestSerializer(serializers.Serializer):
    contents = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    session_id = serializers.CharField(required=False, allow_null=True)