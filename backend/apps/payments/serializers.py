# apps/payments/serializers.py
from rest_framework import serializers
from .models import SubscriptionPlan
# Removed drf_spectacular imports
# from drf_spectacular.utils import extend_schema_field
# from drf_spectacular.types import OpenApiTypes
from drf_yasg import openapi # For explicit schema types if needed

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    display_price = serializers.SerializerMethodField(help_text="Formatted price string, e.g., '19.99'")

    # @extend_schema_field(OpenApiTypes.STR) # REMOVE THIS - drf-spectacular specific
    # For drf-yasg, the type is usually inferred. If not, or for more detail:
    # display_price = serializers.CharField(read_only=True, help_text="Formatted price string, e.g., '19.99'")
    # And the SerializerMethodField populates it.
    # Or, in @swagger_auto_schema for the view, you can override field types if necessary.

    def get_display_price(self, obj: SubscriptionPlan) -> str:
        """Calculates and returns the formatted price string."""
        if not isinstance(obj, SubscriptionPlan) or obj.price_cents is None: # Added check for None price
             return ""
        return f"{obj.price_cents / 100.0:.2f}" # e.g. 19.99

    class Meta:
        model = SubscriptionPlan
        fields = (
            'id', 'name', 'description', 'price_cents', 'display_price',
            'currency', 'features', 'stripe_price_id', 'trial_period_days',
            'is_active', 'is_popular'
        )
        read_only_fields = ( # These are fields not expected in POST/PUT for the plan itself
            'id', 'display_price', 'is_active' # 'is_active' might be admin-settable though
        )

class PaymentIntentRequestSerializer(serializers.Serializer):
    amount_cents = serializers.IntegerField(
        required=True,
        min_value=50, # Stripe often has minimums, e.g., 50 cents
        help_text="Amount in cents (e.g., 1999 for $19.99)"
    )
    description = serializers.CharField(
        required=False,
        help_text="Optional description for the payment intent."
    )
    currency = serializers.CharField(
        required=False,
        max_length=3,
        default='usd',
        help_text="3-letter ISO currency code (default: usd)."
    )

class PaymentIntentResponseSerializer(serializers.Serializer):
    clientSecret = serializers.CharField(help_text="The client secret for the PaymentIntent.")
    intentId = serializers.CharField(help_text="The ID of the PaymentIntent.")

class SubscriptionRequestSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField(required=True, help_text="The ID of the SubscriptionPlan to subscribe to.")

class SubscriptionResponseSerializer(serializers.Serializer):
    subscriptionId = serializers.CharField(help_text="The ID of the created/retrieved Stripe Subscription.")
    clientSecret = serializers.CharField(
        required=False,
        allow_null=True,
        help_text="The client secret of the latest invoice's PaymentIntent, if action is required."
    )
    message = serializers.CharField(
        required=False,
        help_text="An optional message, e.g., if an existing subscription requires payment confirmation."
    )
    status = serializers.CharField( # Added status based on view logic
        required=False,
        help_text="The current status of the subscription (e.g., 'active', 'trialing', 'incomplete')."
    )


class WebhookResponseSerializer(serializers.Serializer):
    # Based on your previous views.py update, this matches the success response
    status = serializers.CharField(default="Webhook received successfully")
    # Or if you used 'received':
    # received = serializers.BooleanField(default=True)