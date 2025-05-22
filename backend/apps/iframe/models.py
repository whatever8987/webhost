from django.db import models
from PIL import Image
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

# Using settings.AUTH_USER_MODEL is the standard way to refer to your user model
User = get_user_model()

class Business(models.Model):
    """Model representing a business/salon that can be embedded as an iframe."""
    name = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        verbose_name=_('Business Name')
    )
    slug = models.SlugField(
        max_length=255,
        blank=True,
        verbose_name=_('URL Slug')
    )
    description = models.TextField(
        default='',
        verbose_name=_('Description')
    )
    image = models.ImageField(
        default='default.jpg',
        upload_to='business_pics',
        verbose_name=_('Business Image')
    )
    url = models.URLField(
        null=False,
        blank=False,
        verbose_name=_('Business URL')
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='owned_businesses',
        blank=True,
        null=True,
        verbose_name=_('Owner')
    )
    claimed = models.BooleanField(
        default=False,
        verbose_name=_('Claimed')
    )
    claimed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_('Claimed At')
    )
    type = models.ForeignKey(
        'Type',
        on_delete=models.PROTECT,
        null=True,
        related_name='businesses',
        verbose_name=_('Business Type')
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Active')
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name=_('Created At')
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Updated At')
    )
    contact_email = models.EmailField(
        blank=True,
        null=True,
        verbose_name=_('Contact Email')
    )
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name=_('Contact Phone')
    )
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Business Address')
    )

    class Meta:
        verbose_name = _('Business')
        verbose_name_plural = _('Businesses')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        """Validate the business data."""
        if self.claimed and not self.owner:
            raise ValidationError(_('A claimed business must have an owner.'))
        
        if self.claimed and not self.claimed_at:
            self.claimed_at = timezone.now()

    def save(self, *args, **kwargs):
        """Save the business and handle image resizing."""
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Handle claiming
        if self.claimed and not self.claimed_at:
            self.claimed_at = timezone.now()
        
        super().save(*args, **kwargs)

        # Resize image if needed
        if self.image and hasattr(self.image, 'path'):
            try:
                img = Image.open(self.image.path)
                if img.height > 300 or img.width > 300:
                    output_size = (300, 300)
                    img.thumbnail(output_size)
                    img.save(self.image.path)
            except (FileNotFoundError, Exception) as e:
                # Log the error in production
                pass

    def claim(self, user):
        """Claim the business for a user."""
        if self.claimed:
            raise ValidationError(_('This business is already claimed.'))
        
        self.owner = user
        self.claimed = True
        self.claimed_at = timezone.now()
        self.save()

    def unclaim(self):
        """Remove the claim on the business."""
        self.owner = None
        self.claimed = False
        self.claimed_at = None
        self.save()


class Type(models.Model):
    """Model representing business types/categories."""
    name = models.CharField(
        max_length=255,
        db_index=True,
        unique=True,
        null=False,
        blank=False,
        verbose_name=_('Type Name')
    )
    slug = models.SlugField(
        max_length=255,
        blank=True,
        verbose_name=_('URL Slug')
    )
    info = models.URLField(
        default='',
        verbose_name=_('Type Information URL')
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Description')
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Active')
    )
    created_at = models.DateTimeField(
        default=timezone.now,
        verbose_name=_('Created At')
    )

    class Meta:
        verbose_name = _('Business Type')
        verbose_name_plural = _('Business Types')
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Generate slug if not provided."""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)