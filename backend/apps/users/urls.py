# users/urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management endpoints
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('users/register/', views.RegisterView.as_view(), name='user-register'),
    path('users/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Business management
    path('users/business/', views.UserBusinessView.as_view(), name='user-business'),
    
    # Subscription management
    path('users/subscription/', views.UserSubscriptionView.as_view(), name='user-subscription'),
    path('users/check-subscription/', views.check_subscription_status, name='check-subscription'),
    
    # Role management
    path('users/<int:pk>/role/', views.UserRoleView.as_view(), name='user-role'),
    path('users/check-role/', views.check_user_role, name='check-role'),
]