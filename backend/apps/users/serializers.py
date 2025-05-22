# apps/users/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from apps.iframe.models import Business# from django.core.exceptions import ValidationError # Not explicitly used here, DRF's serializers.ValidationError is used
from django.utils.translation import gettext_lazy as _

UserModel = get_user_model()
User = get_user_model()

class MessageResponseSerializer(serializers.Serializer):
    """Serializer for simple success messages like {'message': '...'}"""
    message = serializers.CharField(help_text="A success or informational message.")


class LoginRequestSerializer(serializers.Serializer): # This is good for documenting, not for actual login logic
    """For documenting login request body for token-based authentication (e.g., Simple JWT)."""
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, style={'input_type': 'password'})
    # Note: Simple JWT's TokenObtainPairView uses its own serializer.
    # This serializer is purely for documentation if you want to show a generic login schema.


# LogoutResponseSerializer is not typically needed as logout often doesn't have a body
# or is handled by token blacklist mechanisms. If you have a specific response:
# class LogoutResponseSerializer(serializers.Serializer):
#     """For documenting logout response body in Swagger."""
#     detail = serializers.CharField(default="Successfully logged out.")


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone_number', 'stripe_customer_id',
            'stripe_subscription_id', 'is_subscribed', 'subscription_status',
            'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'stripe_customer_id', 
                           'stripe_subscription_id', 'is_subscribed', 
                           'subscription_status']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user."""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True}
        }

    def validate(self, data):
        """Validate that passwords match."""
        if data['password'] != data['password2']:
            raise serializers.ValidationError(_("Passwords don't match"))
        return data

    def create(self, validated_data):
        """Create a new user with encrypted password."""
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information."""
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number',
            'email'
        ]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscription-related fields."""
    class Meta:
        model = User
        fields = [
            'stripe_customer_id', 'stripe_subscription_id',
            'is_subscribed', 'subscription_status'
        ]
        read_only_fields = fields


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user role management."""
    class Meta:
        model = User
        fields = ['role']
        read_only_fields = ['role']  # Only admins should be able to change roles


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password], style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, required=True, label="Confirm Password", style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True) # Make email explicitly required for registration

    class Meta:
        model = UserModel
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name', 'phone_number')
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'phone_number': {'required': False, 'allow_blank': True, 'allow_null': True}
        }

    def validate_email(self, value): # Add email uniqueness validation
        if UserModel.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        # attrs.pop('password2') # No longer needed after validation
        return attrs

    def create(self, validated_data):
        # Remove password2 before creating the user object, as it's not a model field
        validated_data.pop('password2')
        password = validated_data.pop('password') # Get password to use set_password

        user = UserModel.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change endpoint."""
    current_password = serializers.CharField(
        required=True, style={'input_type': 'password'}, write_only=True
    )
    new_password = serializers.CharField(
        required=True, validators=[validate_password], style={'input_type': 'password'}, write_only=True
    )
    new_password2 = serializers.CharField(
        required=True, label="Confirm New Password", style={'input_type': 'password'}, write_only=True
    )

    # No need for validate_new_password2 if validated in a general validate method
    # def validate_new_password2(self, value):
    #     if self.initial_data.get('new_password') != value:
    #         raise serializers.ValidationError("New passwords must match.")
    #     return value

    def validate(self, data):
        if data.get('new_password') != data.get('new_password2'):
            raise serializers.ValidationError({"new_password2": "New passwords must match."})
        # current_password will be checked in the view against the actual user
        return data


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile fields like first_name, last_name, phone_number, and salon."""
    # Assuming 'salon' is a ForeignKey to a Salon model in your UserModel
    # If 'salon' is managed by another app (e.g., 'salons_app'):
    # from apps.salons_app.models import Salon
    # salon = serializers.PrimaryKeyRelatedField(queryset=Salon.objects.all(), required=False, allow_null=True)

    class Meta:
        model = UserModel
        # Add 'salon' if it's part of the user profile update
        fields = ('first_name', 'last_name', 'phone_number') # Add 'salon' here if applicable
        # Example if salon is a field on User model:
        # fields = ('first_name', 'last_name', 'phone_number', 'salon')
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True, 'allow_null': True}, # allow_null if model field allows it
            'last_name': {'required': False, 'allow_blank': True, 'allow_null': True},
            'phone_number': {'required': False, 'allow_blank': True, 'allow_null': True},
            # 'salon': {'required': False, 'allow_null': True} # If salon is part of this serializer
        }