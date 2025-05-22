from django.contrib import admin
from django.urls import reverse # Needed to generate links
from django.utils.html import format_html # Needed to render HTML links
from .models import Visit

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    # Columns to display in the list view
    list_display = ('path', 'timestamp', 'user_link', 'ip_address', 'session_key')

    # Fields to filter the list view by
    list_filter = ('timestamp', 'user', 'ip_address')

    # Fields to search by
    search_fields = ('path', 'ip_address', 'user__username') # Search by path, IP, or the username of the linked user

    # Adds date navigation drill-down (Year/Month/Day) above the list
    date_hierarchy = 'timestamp'

    # Fields that cannot be edited in the detail view (all fields for Visit)
    readonly_fields = ('path', 'timestamp', 'ip_address', 'user', 'session_key')

    # Disable Add, Change, and Delete permissions - visits should only be created by middleware
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        # You might allow superusers to delete old records if needed
        return request.user.is_superuser

    # Custom method to display a link to the user in the admin
    def user_link(self, obj):
        if obj.user:
            try:
                # Construct the URL for the user change page in the admin
                link = reverse("admin:%s_%s_change" % (obj.user._meta.app_label, obj.user._meta.model_name), args=[obj.user.id])
                return format_html('<a href="{}">{}</a>', link, obj.user.username)
            except Exception as e:
                # Handle cases where the user app/model names might differ or reverse fails
                # logger.error(f"Error creating user link for visit {obj.id}: {e}") # Requires logger in admin.py
                return obj.user.username # Fallback to just showing username
        return "-" # Display '-' if no user is linked

    user_link.short_description = 'User' # Column header name
    # Allows sorting by the user foreign key
    user_link.admin_order_field = 'user'


# Optional: Add custom actions, filters, or views later if needed for more complex reporting in admin