# apps/core/views.py

from rest_framework import generics, permissions
from drf_yasg.utils import swagger_auto_schema # Changed
from drf_yasg import openapi # Changed

from .models import Stats
from .serializers import StatsSerializer
# Assuming ErrorSerializer is defined and imported if you use it
# from .serializers import ErrorSerializer # Or from a shared app

class StatsView(generics.RetrieveAPIView):
    """
    API endpoint to retrieve site-wide statistics.
    Only accessible by admin users.
    """
    serializer_class = StatsSerializer # Used for 200 response
    permission_classes = [permissions.IsAdminUser]

    @swagger_auto_schema( # Changed
        tags=['Statistics'],
        summary="Retrieve site statistics",
        description="""Returns comprehensive site statistics. Requires admin privileges.""",
        responses={
            200: StatsSerializer, # Inferred by serializer_class
            403: openapi.Response(description="Forbidden - Admin access required")
            # If you had a specific ErrorSerializer for 403:
            # 403: openapi.Response(description="Forbidden - Admin access required", schema=ErrorSerializer)
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        """Load the singleton Stats object."""
        # Ensure Stats.load() is robust or handle potential errors here
        stats_instance = Stats.load()
        if stats_instance is None:
            # This case should ideally not happen if Stats.load() always returns an instance
            # or raises an appropriate exception that RetrieveAPIView would handle (e.g., as a 500).
            # For explicit handling if Stats.load() can return None:
            # from django.http import Http404
            # raise Http404("Statistics data not available.")
            pass # Assuming Stats.load() always returns a valid object or raises
        return stats_instance