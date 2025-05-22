
from django.contrib import admin
from .models import Stats

@admin.register(Stats)
class StatsAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'total_salons', 'sample_sites', 'active_subscriptions', 'pending_contacts', 'last_updated')
    # Make fields read-only as they should be updated programmatically
    readonly_fields = ('created_at', 'last_updated') # Allow editing counts for manual correction if needed

    # Prevent adding new Stats objects via admin
    def has_add_permission(self, request):
        return False

    # Prevent deleting the Stats object via admin
    def has_delete_permission(self, request, obj=None):
        return False