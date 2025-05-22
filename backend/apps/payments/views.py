# apps/payments/views.py

import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
# from django.db.models import F # Not used in this snippet
from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema # Changed
from drf_yasg import openapi # Changed

from .models import SubscriptionPlan
from apps.users.models import User
# from apps.core.models import Stats # Not used in this snippet

from .serializers import (
    SubscriptionPlanSerializer,
    PaymentIntentRequestSerializer,
    PaymentIntentResponseSerializer,
    SubscriptionRequestSerializer,
    SubscriptionResponseSerializer,
    WebhookResponseSerializer # Make sure this serializer is defined
)
# Assuming ErrorSerializer for common error responses
# from apps.core.serializers import ErrorSerializer


# Configure Stripe API Key at the module level or in a more global app config
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY
else:
    print("WARNING: STRIPE_SECRET_KEY is not set. Stripe functionality will fail.")


class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows viewing available subscription plans.
    """
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by('price_cents')
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema( # Changed
        tags=['Subscriptions'],
        summary="List subscription plans",
        description="Retrieve a list of all active subscription plans.",
        responses={200: SubscriptionPlanSerializer(many=True)} # Inferred for list
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema( # Changed
        tags=['Subscriptions'],
        summary="Retrieve subscription plan",
        description="Get details of a specific subscription plan.",
        responses={ # Inferred for retrieve, but explicit 404 is good
            200: SubscriptionPlanSerializer,
            404: openapi.Response(description="Plan not found")
        }
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


class CreatePaymentIntentView(views.APIView):
    """
    API endpoint for creating Stripe Payment Intents.
    """
    permission_classes = [permissions.IsAuthenticated]
    # serializer_class = PaymentIntentRequestSerializer # Not a generic view, so define in swagger_auto_schema

    @swagger_auto_schema( # Changed
        tags=['Payments'],
        summary="Create payment intent",
        description="""Creates a Stripe Payment Intent for processing payments.
        Returns a client secret for completing the payment on the client side.""",
        request_body=PaymentIntentRequestSerializer,
        responses={
            200: PaymentIntentResponseSerializer,
            400: openapi.Response(
                description="Invalid request data or Stripe error. Example: {\"error\": \"Stripe error: ...\"}"
                # schema=ErrorSerializer # If you have a generic error serializer
            ),
            401: openapi.Response(description="Authentication required"),
            500: openapi.Response(description="Server error or Stripe not configured")
        },
        # For examples in drf-yasg, you often put them in the serializer's Meta class
        # or provide them as part of an openapi.Schema definition if you're being very explicit.
        # Simple examples can also go in the description.
        # operation_description_example = "Request: {\"amount_cents\": 1999, ...}"
    )
    def post(self, request, *args, **kwargs):
        serializer = PaymentIntentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        amount_cents = validated_data['amount_cents']
        description = validated_data.get('description', 'One-time payment')
        currency = validated_data.get('currency', 'usd').lower()
        user = request.user

        if not stripe.api_key: # Check moved from global to instance method
            return Response(
                {"error": "Stripe is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            customer_id = user.stripe_customer_id
            if not customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.username, # Or full name if available
                    metadata={'user_id': str(user.id)} # Stripe metadata values must be strings
                )
                customer_id = customer.id
                # Ensure user model is updated immediately if other operations depend on it
                user.stripe_customer_id = customer_id
                user.save(update_fields=['stripe_customer_id'])


            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                customer=customer_id,
                description=description,
                metadata={'user_id': str(user.id)} # Stripe metadata values must be strings
            )
            return Response({ # Matches PaymentIntentResponseSerializer
                'clientSecret': intent.client_secret,
                'intentId': intent.id
            })

        except stripe.error.StripeError as e:
            print(f"Stripe Error (PaymentIntent): {e}")
            return Response(
                {"error": f"Stripe error: {e.user_message or str(e)}"},
                status=status.HTTP_400_BAD_REQUEST # Or a more specific Stripe error status if applicable
            )
        except Exception as e:
            print(f"Error creating PaymentIntent: {e}") # Log the full exception for debugging
            return Response(
                {"error": "An unexpected error occurred while creating payment intent."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateSubscriptionView(views.APIView):
    """
    API endpoint for creating Stripe Subscriptions.
    """
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema( # Changed
        tags=['Subscriptions'],
        summary="Create subscription",
        description="""Creates a Stripe Subscription for the selected plan.
        Returns a client secret for completing the payment setup.""",
        request_body=SubscriptionRequestSerializer,
        responses={
            200: SubscriptionResponseSerializer, # For new and existing requiring confirmation
            400: openapi.Response(
                description="Invalid request data, existing active subscription, or Stripe error."
            ),
            401: openapi.Response(description="Authentication required"),
            404: openapi.Response(description="Plan not found"),
            500: openapi.Response(description="Server error or Stripe not configured")
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = SubscriptionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        plan_pk = serializer.validated_data['plan_id']
        user = request.user

        if not stripe.api_key: # Check moved from global to instance method
            return Response(
                {"error": "Stripe is not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            plan = get_object_or_404(SubscriptionPlan, pk=plan_pk, is_active=True)

            customer_id = user.stripe_customer_id
            if not customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.username, # Or full name
                    metadata={'user_id': str(user.id)}
                )
                customer_id = customer.id
                user.stripe_customer_id = customer_id
                user.save(update_fields=['stripe_customer_id'])


            if user.stripe_subscription_id:
                try:
                    existing_sub = stripe.Subscription.retrieve(user.stripe_subscription_id)
                    if existing_sub.status in ['active', 'trialing']:
                        # If existing subscription requires payment confirmation
                        if (existing_sub.latest_invoice and
                            hasattr(existing_sub.latest_invoice, 'payment_intent') and # Check if payment_intent is an attribute
                            existing_sub.latest_invoice.payment_intent and # Check if it's not None
                            isinstance(existing_sub.latest_invoice.payment_intent, stripe.PaymentIntent) and # Check type
                            existing_sub.latest_invoice.payment_intent.status == 'requires_payment_method'):
                            return Response({ # Matches SubscriptionResponseSerializer
                                'subscriptionId': existing_sub.id,
                                'clientSecret': existing_sub.latest_invoice.payment_intent.client_secret,
                                'message': 'Existing subscription requires payment confirmation.'
                            }, status=status.HTTP_200_OK)
                        else:
                            return Response(
                                {"error": f"User already has an '{existing_sub.status}' subscription. Please manage it."},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    # If status is past_due, canceled, unpaid, etc., allow creating a new one after clearing old ID
                    elif existing_sub.status not in ['active', 'trialing']:
                         user.stripe_subscription_id = None
                         user.save(update_fields=['stripe_subscription_id'])

                except stripe.error.InvalidRequestError as e_retrieve:
                    # This can happen if the subscription ID on the user is stale/deleted in Stripe
                    print(f"Stripe Error retrieving sub {user.stripe_subscription_id}: {e_retrieve}. Clearing local ID.")
                    user.stripe_subscription_id = None
                    user.save(update_fields=['stripe_subscription_id'])


            subscription_params = {
                'customer': customer_id,
                'items': [{'price': plan.stripe_price_id}],
                'payment_behavior': 'default_incomplete', # Important for SCA
                'expand': ['latest_invoice.payment_intent'],
                'metadata': {'user_id': str(user.id), 'plan_id': str(plan.id)}
            }
            if plan.trial_period_days and plan.trial_period_days > 0:
                subscription_params['trial_period_days'] = plan.trial_period_days

            subscription = stripe.Subscription.create(**subscription_params)

            # Update user's subscription ID
            user.stripe_subscription_id = subscription.id
            user.save(update_fields=['stripe_subscription_id'])

            client_secret = None
            if (subscription.latest_invoice and
                hasattr(subscription.latest_invoice, 'payment_intent') and
                subscription.latest_invoice.payment_intent and
                isinstance(subscription.latest_invoice.payment_intent, stripe.PaymentIntent)):
                client_secret = subscription.latest_invoice.payment_intent.client_secret
            
            # If the subscription is immediately active (e.g., trial without payment)
            # or if payment_behavior wasn't 'default_incomplete' and it succeeded
            if subscription.status == 'active' or subscription.status == 'trialing':
                 return Response({ # Matches SubscriptionResponseSerializer
                    'subscriptionId': subscription.id,
                    'clientSecret': client_secret, # Might be None if no immediate payment required
                    'status': subscription.status
                })


            # Default response for subscriptions that need further action (e.g. payment)
            return Response({ # Matches SubscriptionResponseSerializer
                'subscriptionId': subscription.id,
                'clientSecret': client_secret, # This will be present if payment_behavior='default_incomplete'
                'status': subscription.status
            })

        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"error": "Selected plan not found or is inactive."},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            print(f"Stripe Error (Subscription): {e}")
            error_msg = f"Stripe error: {e.user_message or str(e)}"
            if isinstance(e, stripe.error.InvalidRequestError) and 'No such price' in str(e):
                 error_msg = (f"Stripe error: Invalid Price ID ('{plan.stripe_price_id if 'plan' in locals() else 'unknown'}'). "
                             "Please check Stripe configuration for the plan.")
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating Subscription: {e}") # Log full exception
            return Response(
                {"error": "An unexpected error occurred while creating the subscription."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(views.APIView):
    """
    API endpoint for handling Stripe webhook events.
    Note: CSRF exemption is required for Stripe webhooks.
    """
    permission_classes = [permissions.AllowAny] # Webhooks come from Stripe, not authenticated users

    @swagger_auto_schema( # Changed, but exclude=True means it won't show in UI
        exclude=True # Good to keep this excluded from typical API user docs
    )
    def post(self, request, format=None):
        payload = request.body
        sig_header = request.headers.get('Stripe-Signature')
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        if not endpoint_secret:
            print("CRITICAL: Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured.")
            # For security, don't reveal too much in the error response to Stripe
            return Response({"error": "Webhook configuration error."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if not sig_header:
            return Response({"error": "Missing Stripe-Signature header."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except ValueError as e: # Invalid payload
            print(f"Webhook ValueError (Invalid Payload): {e}")
            return Response({"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            print(f"Webhook SignatureVerificationError (Invalid Signature): {e}")
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e: # Other construction errors
            print(f"Webhook event construction error: {e}")
            return Response({"error": "Webhook processing error"}, status=status.HTTP_400_BAD_REQUEST)

        # --- Event Handling Logic ---
        event_type = event['type']
        data_object = event['data']['object']

        print(f"Received Stripe webhook: Type: {event_type}, Event ID: {event['id']}")

        user_id_from_meta = data_object.get('metadata', {}).get('user_id')
        customer_id_from_event = data_object.get('customer') # Could be a customer object or just ID string

        user = None
        try:
            if user_id_from_meta:
                user = User.objects.get(id=user_id_from_meta)
            elif customer_id_from_event and isinstance(customer_id_from_event, str):
                user = User.objects.filter(stripe_customer_id=customer_id_from_event).first()
                if not user: # If not found by stripe_customer_id, try retrieving customer from stripe for metadata
                    stripe_customer = stripe.Customer.retrieve(customer_id_from_event)
                    user_id_from_stripe_customer_meta = stripe_customer.get('metadata', {}).get('user_id')
                    if user_id_from_stripe_customer_meta:
                        user = User.objects.get(id=user_id_from_stripe_customer_meta)
            
            if not user and event_type.startswith('customer.subscription.'): # For subscription events, sub object has customer
                subscription_object = data_object
                if subscription_object and subscription_object.get('customer'):
                    customer_id_from_sub = subscription_object.get('customer')
                    if isinstance(customer_id_from_sub, str):
                         user = User.objects.filter(stripe_customer_id=customer_id_from_sub).first()


        except User.DoesNotExist:
            print(f"Webhook Error: User not found. user_id_meta: {user_id_from_meta}, customer_id_event: {customer_id_from_event}")
            # Still return 200 to Stripe to acknowledge receipt, but log the error
            return Response({'status': 'user not found, event acknowledged'}, status=status.HTTP_200_OK)
        except stripe.error.StripeError as e:
            print(f"Webhook Error: Stripe API error while trying to find user: {e}")
            return Response({'status': 'stripe error finding user, event acknowledged'}, status=status.HTTP_200_OK)
        except Exception as e_user:
            print(f"Webhook Error: Unexpected error finding user: {e_user}")
            return Response({'status': 'unexpected error finding user, event acknowledged'}, status=status.HTTP_200_OK)


        # --- Handle specific event types ---
        if event_type == 'customer.subscription.updated' or \
           event_type == 'customer.subscription.created' or \
           event_type == 'customer.subscription.deleted' or \
           event_type == 'customer.subscription.trial_will_end': # Or other relevant subscription events

            subscription = data_object # This is the Stripe Subscription object
            sub_id = subscription.id
            sub_status = subscription.status
            
            print(f"Handling subscription event: Sub ID: {sub_id}, Status: {sub_status}, User: {user.username if user else 'Unknown'}")

            if user:
                if sub_status in ['canceled', 'unpaid', 'incomplete_expired'] or event_type == 'customer.subscription.deleted':
                    if user.stripe_subscription_id == sub_id: # Only clear if it's the current known sub
                        user.stripe_subscription_id = None
                        user.is_subscribed = False # Add an is_subscribed field to your User model
                        user.subscription_status = sub_status # Add this field too
                        user.save(update_fields=['stripe_subscription_id', 'is_subscribed', 'subscription_status'])
                        print(f"Subscription {sub_id} ended for user {user.id}. Status: {sub_status}")
                elif sub_status in ['active', 'trialing']:
                    # Update user record with the current active/trialing subscription
                    user.stripe_subscription_id = sub_id
                    user.is_subscribed = True
                    user.subscription_status = sub_status
                    # You might want to store plan_id, current_period_end, etc. on your User model too
                    current_plan_id_from_stripe = subscription.get('items',{}).get('data',[{}])[0].get('price',{}).get('id')
                    # Map stripe_price_id back to your local plan if needed, or store stripe_price_id
                    user.save(update_fields=['stripe_subscription_id', 'is_subscribed', 'subscription_status'])
                    print(f"Subscription {sub_id} is {sub_status} for user {user.id}")
                else: # e.g., 'incomplete', 'past_due'
                    user.is_subscribed = False
                    user.subscription_status = sub_status
                    # user.stripe_subscription_id might still be this sub_id if it's incomplete/past_due
                    user.save(update_fields=['is_subscribed', 'subscription_status'])
                    print(f"Subscription {sub_id} for user {user.id} has status: {sub_status}")
            else:
                print(f"Webhook Warning: No user identified for subscription event. Sub ID: {sub_id}")

        elif event_type == 'invoice.payment_succeeded':
            invoice = data_object
            subscription_id = invoice.get('subscription')
            if user and subscription_id and user.stripe_subscription_id == subscription_id:
                # Payment for an existing subscription succeeded.
                # Could update 'last_payment_date' or 'current_period_end' on the user model.
                user.is_subscribed = True # Ensure this is true
                user.subscription_status = 'active' # Or based on the actual subscription status
                # Consider fetching the subscription object again to get the most current status and period end
                try:
                    sub = stripe.Subscription.retrieve(subscription_id)
                    user.subscription_status = sub.status
                    # user.current_period_end = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc)
                except stripe.error.StripeError as e_sub_retrieve:
                    print(f"Error retrieving subscription {subscription_id} after invoice payment: {e_sub_retrieve}")

                user.save(update_fields=['is_subscribed', 'subscription_status'])
                print(f"Invoice payment succeeded for user {user.id}, subscription {subscription_id}")

        elif event_type == 'invoice.payment_failed':
            invoice = data_object
            subscription_id = invoice.get('subscription')
            if user and subscription_id and user.stripe_subscription_id == subscription_id:
                # Payment for an existing subscription failed.
                # The subscription might move to 'past_due' or eventually 'canceled'.
                # The 'customer.subscription.updated' event will usually handle the status change.
                user.is_subscribed = False # Or reflect actual subscription status
                user.subscription_status = 'payment_failed' # Or more specific from sub status
                user.save(update_fields=['is_subscribed', 'subscription_status'])
                print(f"Invoice payment failed for user {user.id}, subscription {subscription_id}")
        
        elif event_type == 'checkout.session.completed':
            session = data_object
            # If you use Stripe Checkout sessions for one-time payments or setting up subscriptions
            if session.mode == 'payment':
                # Handle successful one-time payment
                print(f"Checkout session (payment) completed: {session.id}, User: {user.username if user else 'Unknown'}")
            elif session.mode == 'subscription':
                # Subscription was set up via Checkout.
                # The 'customer.subscription.created/updated' webhooks will usually handle the main logic.
                stripe_subscription_id = session.get('subscription')
                if user and stripe_subscription_id:
                    user.stripe_subscription_id = stripe_subscription_id
                    # Potentially update is_subscribed and subscription_status here too,
                    # but rely on customer.subscription.* events for definitive status.
                    user.save(update_fields=['stripe_subscription_id'])
                    print(f"Checkout session (subscription) completed: {session.id}, Sub ID: {stripe_subscription_id}, User: {user.username if user else 'Unknown'}")


        # Add more event handlers as needed (e.g., payment_intent.succeeded/failed if not tied to invoice/sub)

        else:
            print(f'Webhook Info: Unhandled event type {event_type}')

        # Return a 200 response to Stripe to acknowledge receipt of the event
        # The WebhookResponseSerializer is defined to match {'received': True} or {'status': '...'}
        return Response({'status': 'Webhook received successfully'}, status=status.HTTP_200_OK)