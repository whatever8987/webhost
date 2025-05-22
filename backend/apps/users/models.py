# apps/users/models.py (or your custom user model file)

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    # Inherits username, password, email, first_name, last_name, is_staff, is_active, date_joined

    ROLE_CHOICES = (
        ('user', _('User')),
        ('admin', _('Admin')),
        # Add other roles if needed, e.g., ('staff', _('Staff'))
    )
    role = models.CharField(
        max_length=10, # Consider if 'customer' or other roles might be longer
        choices=ROLE_CHOICES,
        default='user',
        verbose_name=_('Role')
    )
    phone_number = models.CharField(
        max_length=25, # Good that you increased this
        blank=True,
        null=True,
        verbose_name=_('Phone Number')
    )

    # Fields for Stripe integration
    stripe_customer_id = models.CharField(
        max_length=100, # Stripe IDs can be long, e.g., cus_xxxxxxxxxxxxxx
        blank=True,
        null=True,
        verbose_name=_('Stripe Customer ID')
    )
    stripe_subscription_id = models.CharField( # <<< ADDED THIS
        max_length=100, # Stripe IDs can be long, e.g., sub_xxxxxxxxxxxxxx
        blank=True,
        null=True,
        verbose_name=_('Stripe Subscription ID')
    )
    is_subscribed = models.BooleanField( # <<< ADDED THIS
        default=False,
        verbose_name=_('Is Subscribed')
    )
    subscription_status = models.CharField( # <<< ADDED THIS
        max_length=50, # To store statuses like 'active', 'trialing', 'past_due', 'canceled'
        blank=True,
        null=True,
        verbose_name=_('Subscription Status')
    )

    # Fix reverse accessor clashes (you already have this, which is good)
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set', # Changed from 'user_set' to avoid clash if you have multiple User models (unlikely for AUTH_USER_MODEL)
        blank=True,
        help_text=_('The groups this user belongs to. A user will get all permissions granted to each of their groups.'),
        verbose_name=_('groups'),
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set_permissions', # Changed from 'user_set'
        blank=True,
        help_text=_('Specific permissions for this user.'),
        verbose_name=_('user permissions'),
    )

    # Ensure email is unique (you already have this)
    email = models.EmailField(
        _('email address'), # Positional argument for verbose_name
        unique=True,
        blank=False # Ensures email is required
    )

    def is_site_admin(self): # Renamed from is_admin to avoid potential confusion with is_staff/is_superuser
        """Helper method to check if user has the 'admin' role."""
        return self.role == 'admin'

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")