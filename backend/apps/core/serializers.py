# apps/core/serializers.py
from rest_framework import serializers
from .models import Stats

class ErrorSerializer(serializers.Serializer):
    detail = serializers.CharField(help_text="A general error message or specific error detail.")

class StatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stats
        # Explicitly list the fields you want to include from the Stats model
        fields = (
            'total_salons',
            'sample_sites',
            'active_subscriptions',
            'pending_contacts',
            'last_updated'
            # Add any other fields from your Stats model you want to serialize
        )
        # Now that 'fields' is defined, you can use it:
        read_only_fields = fields # Mark all listed fields as read-only
        # If you were using 'exclude', you wouldn't be able to use 'fields' like this directly
        # for read_only_fields unless you calculate which fields remain.