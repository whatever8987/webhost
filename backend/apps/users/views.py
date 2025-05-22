# apps/users/views.py

from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema # Changed from drf_spectacular
from drf_yasg import openapi # For OpenApiResponse if needed directly, or for complex types
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    UserSubscriptionSerializer,
    UserRoleSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    UserProfileUpdateSerializer,
    MessageResponseSerializer,
)
# Assuming ErrorSerializer is defined and imported if you use it for explicit error responses in swagger_auto_schema
# For example, if it's in a shared location:
# from apps.core.serializers import ErrorSerializer

UserModel = get_user_model()
User = get_user_model()


class UserListView(generics.ListCreateAPIView):
    """View for listing all users and creating new users."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  # Only admins can list all users

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating and deleting a user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.request.method in ['DELETE', 'PUT', 'PATCH']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for users to manage their own profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer


class RegisterView(generics.CreateAPIView):
    """View for user registration."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ChangePasswordView(generics.UpdateAPIView):
    """View for changing user password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Check current password
            if not user.check_password(serializer.validated_data['current_password']):
                return Response(
                    {"current_password": "Current password is incorrect."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response(
                {"message": "Password successfully updated."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserSubscriptionView(generics.RetrieveUpdateAPIView):
    """View for managing user subscription."""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


class UserRoleView(generics.UpdateAPIView):
    """View for managing user roles (admin only)."""
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_subscription_status(request):
    """Check if the current user has an active subscription."""
    user = request.user
    return Response({
        'is_subscribed': user.is_subscribed,
        'subscription_status': user.subscription_status,
        'stripe_customer_id': user.stripe_customer_id,
        'stripe_subscription_id': user.stripe_subscription_id
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_user_role(request):
    """Check the current user's role."""
    user = request.user
    return Response({
        'role': user.role,
        'is_admin': user.is_site_admin()
    })


class UserBusinessView(generics.UpdateAPIView):
    """View for managing user's business relationship."""
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Only update the iframe field
            if 'iframe' in serializer.validated_data:
                user.iframe = serializer.validated_data['iframe']
                user.save(update_fields=['iframe'])
                return Response({
                    'message': 'Business relationship updated successfully',
                    'iframe': user.iframe.id if user.iframe else None
                })
            return Response({
                'message': 'No business relationship to update'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)