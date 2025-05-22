from django.db import models
from django.utils.translation import gettext_lazy as _ # <<< Import this

class SubscriptionPlan(models.Model):
    """Represents a subscribable plan offered to users."""
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_('Plan Name') # <<< Marked verbose_name
    )
    description = models.TextField(
        blank=True,
        verbose_name=_('Description') # <<< Marked verbose_name
    )
    price_cents = models.PositiveIntegerField(
        help_text=_('Price in cents (e.g., 7900 for $79.00)'), # <<< Marked help_text
        verbose_name=_('Price (Cents)') # <<< Marked verbose_name
    )

    currency = models.CharField(
        max_length=3,
        default='usd',
        verbose_name=_('Currency') # <<< Marked verbose_name
    )
    features = models.JSONField(
        default=list,
        blank=True,
        help_text=_('List of features included in the plan'), # <<< Marked help_text
        verbose_name=_('Features') # <<< Marked verbose_name
    )

    stripe_price_id = models.CharField(
        max_length=255,
        unique=True,
        help_text=_('Stripe Price ID (e.g., price_xxxxxxxxxxxx)'), # <<< Marked help_text
        verbose_name=_('Stripe Price ID') # <<< Marked verbose_name
    )
    trial_period_days = models.PositiveIntegerField(
        default=0,
        help_text=_('Number of trial days (0 for no trial)'), # <<< Marked help_text
        verbose_name=_('Trial Period (Days)') # <<< Marked verbose_name
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this plan is available for new subscriptions'), # <<< Marked help_text
        verbose_name=_('Is Active') # <<< Marked verbose_name
    )
    is_popular = models.BooleanField(
        default=False,
        help_text=_('Mark as popular for highlighting in UI'), # <<< Marked help_text
        verbose_name=_('Is Popular') # <<< Marked verbose_name
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Created At') # <<< Marked verbose_name
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Updated At') # <<< Marked verbose_name
    )

    class Meta:
        verbose_name = _("Subscription Plan") # <<< Marked verbose_name
        verbose_name_plural = _("Subscription Plans") # <<< Marked verbose_name_plural


    def __str__(self):
        # The __str__ method content itself is usually not translated
        display_price = self.price_cents / 100.0
        return f"{self.name} (${display_price:.2f}/{self.currency.upper()})"

    @property
    def display_price(self):
         # This property generates a string for display, often not translated
         return f"{self.price_cents / 100.0:.2f}"