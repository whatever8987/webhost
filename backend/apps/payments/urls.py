# payments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'payments'

# Router for read-only SubscriptionPlan endpoint
router = DefaultRouter()
router.register(r'plans', views.SubscriptionPlanViewSet, basename='plan')

urlpatterns = [
    # List/Retrieve Subscription Plans
    path('', include(router.urls)),

    # Stripe Actions
    path('create-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('create-subscription/', views.CreateSubscriptionView.as_view(), name='create-subscription'),

    # Stripe Webhook Handler (should not have '/api/' prefix usually, direct path)
    # Path is often defined in Stripe dashboard, e.g., yoursite.com/stripe/webhook/
    # Let's put it under /stripe/ for clarity, adjust if needed
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
]