# payments/urls_api.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# <<< Add this line >>>
app_name = 'payments' # Define the application namespace

router = DefaultRouter()
router.register(r'plans', views.SubscriptionPlanViewSet, basename='plan')

urlpatterns = [
    path('', include(router.urls)),
    path('create-intent/', views.CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('create-subscription/', views.CreateSubscriptionView.as_view(), name='create-subscription'),
]