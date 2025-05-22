# backend/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from apps.payments import views as payment_views # Keep for webhook
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
import os

# --- Import Simple JWT Views ---
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

schema_view = get_schema_view(
    openapi.Info(
        title="Nail API",
        default_version='v1',
        description="API documentation for Nail",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@nail.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin URLs should be first
    path('admin/', admin.site.urls),

    # Group all authentication related endpoints under /api/auth/
    path('api/', include(([
        # --- Simple JWT Token Endpoints ---
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # POST username/password -> Get tokens
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # POST refresh_token -> Get new access_token
        path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),    # POST token -> Verify token validity

        # --- Custom User Management Endpoints (from users.urls) ---
        path('', include('apps.users.urls')), # Include register, profile, change-password

    ], 'auth'), namespace='auth-api')), # Namespace for the whole auth group

    # API endpoints
    path('api/businesses/', include('apps.iframe.urls', namespace='iframe-api')),
    path('api/payments/', include('apps.payments.urls_api', namespace='payments-api')),
    path('api/core/', include('apps.core.urls', namespace='core-api')),
    path('api/', include('apps.chatbot.urls', namespace='chat_endpoint')), 
    path('api/tracking/', include('apps.tracking.urls_api', namespace='tracking-api')),

    # --- API Documentation ---
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # --- Stripe Webhook ---
    path('stripe/webhook/', payment_views.StripeWebhookView.as_view(), name='stripe-webhook'),

    # Serve static files in development
    re_path(r'^static/(?P<path>.*)$', serve, {
        'document_root': settings.STATIC_ROOT
    }),
]

# Catch-all URL pattern to serve the React app (exclude admin and other specific paths)
urlpatterns += [
    re_path(r'^(?!api/|admin/|swagger/|redoc/|stripe/webhook/|static/|media/).*$', 
            TemplateView.as_view(template_name='index.html'), 
            name='react-app'),
]

# --- Debug Media/Static ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)