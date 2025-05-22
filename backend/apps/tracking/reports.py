from django.db.models import Count, F
# Truncation functions for grouping by time periods (day, month, etc.)
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from datetime import timedelta, date # Import date for date object handling

from .models import Visit

# Helper function to handle date filtering across report functions
def filter_visits_by_date_range(queryset, start_date, end_date):
    """Helper to apply date range filtering to a Visit queryset."""
    if start_date:
        # Filter from the start of the start_date
        queryset = queryset.filter(timestamp__gte=start_date)
    if end_date:
        # Filter up to the end of the end_date
        # Add timedelta(days=1) and use __lt to include the whole end_date day
        queryset = queryset.filter(timestamp__lt=end_date + timedelta(days=1))
    return queryset

def get_total_visits(start_date=None, end_date=None):
    """
    Returns the total number of visits within a date range.
    Dates should be Python date objects.
    """
    qs = Visit.objects.all()
    qs = filter_visits_by_date_range(qs, start_date, end_date)
    return qs.count()

def get_visits_by_day(start_date=None, end_date=None):
    """
    Returns the count of visits grouped by day within a date range.
    Dates should be Python date objects.
    Returns a list of dictionaries like [{'day': date(YYYY, M, D), 'count': N}, ...].
    """
    qs = Visit.objects.all()
    qs = filter_visits_by_date_range(qs, start_date, end_date)

    # Truncate timestamp to day, group by the truncated day, count visits, order chronologically
    return qs.annotate(day=TruncDay('timestamp', tzinfo=timezone.utc)) \
             .values('day') \
             .annotate(count=Count('id')) \
             .order_by('day')


def get_unique_visitors_by_ip(start_date=None, end_date=None):
    """
    Returns the count of unique non-null IP addresses within a date range.
    Dates should be Python date objects.
    """
    qs = Visit.objects.exclude(ip_address__isnull=True).exclude(ip_address='') # Exclude null/empty IPs
    qs = filter_visits_by_date_range(qs, start_date, end_date)

    # Use distinct() on values('ip_address') to count unique IPs
    return qs.values('ip_address').distinct().count()

def get_unique_visitors_by_session(start_date=None, end_date=None):
    """
    Returns the count of unique non-null session keys within a date range.
    Useful for estimating unique users who are NOT logged in.
    Dates should be Python date objects.
    """
    qs = Visit.objects.exclude(session_key__isnull=True).exclude(session_key='') # Exclude null/empty sessions
    qs = filter_visits_by_date_range(qs, start_date, end_date)

    # Use distinct() on values('session_key') to count unique sessions
    return qs.values('session_key').distinct().count()


def get_unique_authenticated_users(start_date=None, end_date=None):
    """
    Returns the count of unique authenticated users who had visits within a date range.
    Dates should be Python date objects.
    """
    qs = Visit.objects.exclude(user__isnull=True) # Only include visits linked to a user
    qs = filter_visits_by_date_range(qs, start_date, end_date)

    # Use distinct() on values('user') to count unique user IDs
    return qs.values('user').distinct().count()

def get_most_popular_pages(start_date=None, end_date=None, limit=10):
    """
    Returns the most visited paths within a date range.
    Dates should be Python date objects.
    Returns a list of dictionaries like [{'path': '/some-url/', 'count': N}, ...].
    """
    qs = Visit.objects.all()
    qs = filter_visits_by_date_range(qs, start_date, end_date)

    # Group by path, count visits, order by count descending, and limit
    # Exclude paths that are likely static or API endpoints if not already excluded by middleware
    # This provides a second layer of filtering for paths that might slip through middleware
    # Or if you want popular *API* endpoints, remove this exclusion.
    # Adjust excluded_prefixes to match middleware or specific report needs
    excluded_prefixes = [
         '/static/',
         '/media/',
         '/admin/',
         '/api/', # Exclude API endpoints from popular pages? Adjust as needed.
         '/favicon.ico',
         '/robots.txt',
         '/__debug__/',
     ]
    for prefix in excluded_prefixes:
         qs = qs.exclude(path__startswith=prefix)


    return qs.values('path') \
             .annotate(count=Count('id')) \
             .order_by('-count')[:limit] # Get top N pages


# --- Example of combining unique counts for a rough "Total Unique Visitors" ---
# Note: This is just an *estimate*. A user might clear cookies (new session_key),
# switch networks (new IP), log in/out (new user link vs session).
# True unique visitor tracking across long periods is complex.
def get_estimated_unique_visitors(start_date=None, end_date=None):
    """
    Provides a rough estimate of unique visitors by combining authenticated users and unique sessions for unauthenticated visits.
    This is not a perfect measure due to IP changes, session expiry/deletion, etc.
    """
    qs = Visit.objects.all()
    qs = filter_visits_by_date_range(qs, start_date, end_date)

    # Get unique users (authenticated)
    unique_users_qs = qs.exclude(user__isnull=True).values('user').distinct()

    # Get unique sessions *for visits NOT linked to a user*
    unique_sessions_qs = qs.filter(user__isnull=True).exclude(session_key__isnull=True).exclude(session_key='').values('session_key').distinct()

    # Count the number of unique user IDs and unique session keys
    num_unique_users = unique_users_qs.count()
    num_unique_sessions = unique_sessions_qs.count()

    # Return the sum as an estimate
    return num_unique_users + num_unique_sessions