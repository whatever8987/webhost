from django.urls import path
from .views_api import ReportOverviewAPIView # Import your API view(s)

# Define the app namespace for DRF and URL reversing
app_name = 'tracking_api'

urlpatterns = [
    # Maps requests to /api/tracking/overview/ (because it will be included under 'api/tracking/')
    path('overview/', ReportOverviewAPIView.as_view(), name='report_overview'),

    # Add other paths here if you create more API views in views_api.py
    # path('popular-pages/', PopularPagesAPIView.as_view(), name='popular_pages'),
]