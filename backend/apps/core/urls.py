# core/urls.py
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Path for the stats endpoint
    path('stats/', views.StatsView.as_view(), name='stats'),
    # Add other core API paths here if needed later
]