from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated # Adjust permissions as needed
from rest_framework.exceptions import ParseError # More specific error for bad input
from rest_framework import generics
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers

from datetime import datetime, date, timedelta

from .reports import (
    get_total_visits,
    get_visits_by_day,
    get_unique_visitors_by_ip,
    get_unique_visitors_by_session, # Added unique sessions
    get_unique_authenticated_users,
    get_most_popular_pages,
    get_estimated_unique_visitors # Added estimated unique visitors
)

# Helper to parse date query parameters
def parse_date_params(request):
    """
    Parses 'start_date' and 'end_date' from query parameters.
    Returns date objects or None, and raises ParseError on invalid format.
    """
    start_date_str = request.query_params.get('start_date')
    end_date_str = request.query_params.get('end_date')

    start_date = None
    end_date = None

    try:
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    except ValueError:
        raise ParseError("Invalid start_date format. Use YYYY-MM-DD.")

    try:
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        raise ParseError("Invalid end_date format. Use YYYY-MM-DD.")

    return start_date, end_date


class ReportOverviewSerializer(serializers.Serializer):
    total_visits = serializers.IntegerField()
    unique_ips = serializers.IntegerField()
    unique_authenticated_users = serializers.IntegerField()
    estimated_unique_visitors = serializers.IntegerField()
    visits_by_day = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    popular_pages = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    date_range = serializers.DictField(
        child=serializers.CharField(allow_null=True)
    )


class ReportOverviewAPIView(generics.GenericAPIView):
    serializer_class = ReportOverviewSerializer
    permission_classes = [IsAdminUser]

    @swagger_auto_schema(tags=["Reports"])
    def get(self, request, *args, **kwargs):
        try:
            start_date, end_date = parse_date_params(request)
        except ParseError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # --- Set Default Date Range if not provided ---
        if start_date is None and end_date is None:
            end_date = date.today()
            start_date = end_date - timedelta(days=29)
        elif start_date is None and end_date is not None:
            start_date = end_date - timedelta(days=29)
        elif start_date is not None and end_date is None:
            end_date = date.today()

        if start_date and end_date and start_date > end_date:
            return Response({"error": "start_date cannot be after end_date."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = {
                "total_visits": get_total_visits(start_date, end_date),
                "unique_ips": get_unique_visitors_by_ip(start_date, end_date),
                "unique_authenticated_users": get_unique_authenticated_users(start_date, end_date),
                "estimated_unique_visitors": get_estimated_unique_visitors(start_date, end_date),
                "visits_by_day": [
                    {'day': entry['day'].strftime('%Y-%m-%d'), 'count': entry['count']}
                    for entry in get_visits_by_day(start_date, end_date)
                ],
                "popular_pages": get_most_popular_pages(start_date, end_date, limit=10),
                "date_range": {
                    "start_date": start_date.strftime('%Y-%m-%d') if start_date else None,
                    "end_date": end_date.strftime('%Y-%m-%d') if end_date else None,
                }
            }
            serializer = self.get_serializer(data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error("Error generating tracking report:", exc_info=True)
            return Response({"error": "An internal error occurred while generating the report."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# You can add more API views here if you want separate endpoints for different reports
# e.g., A view for /api/tracking/popular-pages/ that supports different limits or filtering.