from django.db import models
from django.conf import settings # To reference the custom user model
from django.utils import timezone

class Visit(models.Model):
    """Records a visit to a specific URL."""
    # Using CharField for path, indexed for querying
    path = models.CharField(max_length=255, db_index=True)

    # Timestamp of the visit, indexed for time-based queries
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    # IP Address, stored as GenericIPAddressField for IPv4 and IPv6, optional
    # Indexed for querying unique IPs
    ip_address = models.GenericIPAddressField(null=True, blank=True, db_index=True)

    # Link to the user if authenticated, optional
    # SET_NULL means if the user is deleted, the visit record remains but the user link becomes null
    # Indexed for querying user visits
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visits'
    )

    # Session key for distinguishing unique non-authenticated users.
    # Requires SessionMiddleware. Indexed.
    session_key = models.CharField(max_length=40, null=True, blank=True, db_index=True)

    # Add referrer tracking
    referrer = models.URLField(max_length=500, null=True, blank=True, db_index=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    device_type = models.CharField(max_length=50, null=True, blank=True, db_index=True)

    def __str__(self):
        user_info = self.user.username if self.user else self.ip_address or 'Unknown'
        # Limit path length for display if needed
        display_path = self.path if len(self.path) < 50 else self.path[:47] + '...'
        return f"Visit to {display_path} by {user_info} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-timestamp'] # Default order is newest first
        verbose_name = "Website Visit"
        verbose_name_plural = "Website Visits"