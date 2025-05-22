import logging
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve, Resolver404 # Useful for checking URL patterns, but simple path check is fine here
from django.conf import settings
from django.utils import timezone # Get current time consistently
from .models import Visit
import re

# Configure a logger for your middleware
logger = logging.getLogger(__name__)

def get_device_type(user_agent):
    """Determine device type from user agent string."""
    if not user_agent:
        return None
        
    user_agent = user_agent.lower()
    
    if re.search(r'mobile|android|iphone|ipad|ipod', user_agent):
        return 'mobile'
    elif re.search(r'tablet|ipad', user_agent):
        return 'tablet'
    else:
        return 'desktop'

class VisitorTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to log incoming requests as 'Visit' objects.
    Excludes static/media files, admin, and other configured paths.
    Captures path, user, IP, and session key.
    """

    def process_request(self, request):
        # --- 1. Define Paths to Exclude ---
        # Add any paths you don't want to track (e.g., static, admin, health checks)
        # Use startswith for prefixes like /static/, /media/, /admin/
        # Use exact matches for specific files like /favicon.ico
        excluded_prefixes = [
            settings.STATIC_URL,
            settings.MEDIA_URL,
            '/admin/',
            '/api/schema/', # Exclude schema endpoints
            '/stripe/webhook/', # Exclude webhook endpoint
            '/favicon.ico', # Common static file
            '/robots.txt', # Common static file
            '/__debug__/', # Django debug toolbar if used
             # Add prefixes for specific API endpoints you don't need to track, e.g.:
             # '/api/status/'
        ]
        # Check if the current request path starts with any excluded prefix
        if any(request.path.startswith(prefix) for prefix in excluded_prefixes):
            # logger.debug(f"Excluding path from tracking: {request.path}")
            return None # Don't process this request for tracking

        # --- 2. Optional: Exclude specific HTTP methods ---
        # By default, it tracks all methods (GET, POST, etc.). You might only want GET.
        # if request.method != 'GET':
        #     return None

        # --- 3. Capture Data ---
        # Get the full path including query string if needed, otherwise just path
        # tracked_path = request.get_full_path() # Use this for full URL
        tracked_path = request.path # Use this for path only

        # Get the user if authenticated
        # AuthenticationMiddleware must be before this middleware for request.user to be available
        user = request.user if request.user.is_authenticated else None

        # Get IP address
        # This is tricky behind proxies (like Nginx).
        # HTTP_X_FORWARDED_FOR is the standard header set by proxies.
        # request.META['REMOTE_ADDR'] is the address of the direct client (Nginx in this case).
        # Configure your web server (Nginx) to correctly set X-Forwarded-For.
        ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
        if ip_address:
            # X-Forwarded-For can contain a comma-separated list. The client's IP is typically first.
            ip_address = ip_address.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

        # Get the session key
        # SessionMiddleware must be before this middleware for request.session to be available
        session_key = request.session.session_key
        # Note: session_key will be None if the session hasn't been accessed/created yet.
        # It will be created automatically upon first modification (e.g., setting a session var)
        # If you need session_key for every visit, you might need to ensure session creation
        # or handle the None case. Default middleware often lazy-loads sessions.

        # Get referrer
        referrer = request.META.get('HTTP_REFERER')
        
        # Get user agent and device type
        user_agent = request.META.get('HTTP_USER_AGENT')
        device_type = get_device_type(user_agent)

        # --- 4. Save the Visit ---
        try:
            Visit.objects.create(
                path=tracked_path,
                timestamp=timezone.now(), # Capture time now
                ip_address=ip_address,
                user=user,
                session_key=session_key,
                referrer=referrer,
                user_agent=user_agent,
                device_type=device_type
            )
            # logger.debug(f"Logged visit: {tracked_path}")
        except Exception as e:
            # Log any database saving errors without stopping the request
            logger.error(f"Error logging visit for path {tracked_path}: {e}", exc_info=True)


        # --- 5. Continue Request Processing ---
        # Must return None or a HttpResponse object to continue the middleware chain.
        return None

    # process_response is not strictly needed for basic logging, but can be used
    # def process_response(self, request, response):
    #     return response