# core/models.py
from django.db import models
from django.core.cache import cache # Optional: for caching stats

class Stats(models.Model):
    """Singleton model to store site-wide statistics."""
    # Use PositiveIntegerField or BigIntegerField depending on expected scale
    total_salons = models.PositiveIntegerField(default=0)
    sample_sites = models.PositiveIntegerField(default=0, help_text="Count of unclaimed salons")
    active_subscriptions = models.PositiveIntegerField(default=0)
    pending_contacts = models.PositiveIntegerField(default=0, help_text="Salons with 'notContacted' status")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True) # When first created
    last_updated = models.DateTimeField(auto_now=True) # When last saved

    class Meta:
        verbose_name_plural = "Stats" # Correct pluralization in admin

    def save(self, *args, **kwargs):
        """Enforce singleton pattern (only one row with pk=1)."""
        self.pk = 1 # Always save to the same primary key
        super(Stats, self).save(*args, **kwargs)
        # Optional: Clear cache after saving to ensure fresh data is loaded
        # cache.delete('site_stats')

    def delete(self, *args, **kwargs):
        """Prevent deletion of the singleton instance."""
        pass # Or raise an error: raise PermissionError("Cannot delete the Stats object.")

    @classmethod
    def load(cls):
        """Convenience method to load the singleton instance, creating if necessary."""
        # Optional: Caching to reduce DB queries
        # cached_stats = cache.get('site_stats')
        # if cached_stats:
        #     return cached_stats

        obj, created = cls.objects.get_or_create(pk=1)

        # Optional: Cache the object
        # cache.set('site_stats', obj, timeout=3600) # Cache for 1 hour

        return obj

    def __str__(self):
        return f"Site Stats (Updated: {self.last_updated.strftime('%Y-%m-%d %H:%M')})"

# You could add methods here to recalculate stats if needed, e.g.:
# def recalculate_pending_contacts(self):
#     from salons.models import Salon # Local import to avoid circular deps
#     count = Salon.objects.filter(contact_status='notContacted').count()
#     self.pending_contacts = count
#     self.save(update_fields=['pending_contacts', 'last_updated'])