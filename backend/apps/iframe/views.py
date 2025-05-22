from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Business, Type
from .serializers import (
    TypeSerializer,
    BusinessListSerializer,
    BusinessDetailSerializer,
    BusinessCreateSerializer,
    BusinessUpdateSerializer,
    BusinessClaimSerializer,
    BusinessUnclaimSerializer
)

class TypeListView(generics.ListCreateAPIView):
    """View for listing and creating business types."""
    queryset = Type.objects.filter(is_active=True)
    serializer_class = TypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Type.objects.filter(is_active=True)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        return queryset

class TypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating and deleting a business type."""
    queryset = Type.objects.all()
    serializer_class = TypeSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'slug'

class BusinessListView(generics.ListCreateAPIView):
    """View for listing and creating businesses."""
    serializer_class = BusinessListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Business.objects.filter(is_active=True)
        
        # Filter by type
        type_slug = self.request.query_params.get('type', None)
        if type_slug:
            queryset = queryset.filter(type__slug=type_slug)
        
        # Filter by claimed status
        claimed = self.request.query_params.get('claimed', None)
        if claimed is not None:
            claimed = claimed.lower() == 'true'
            queryset = queryset.filter(claimed=claimed)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search)
            )
        
        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BusinessCreateSerializer
        return BusinessListSerializer

class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating and deleting a business."""
    queryset = Business.objects.all()
    serializer_class = BusinessDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BusinessUpdateSerializer
        return BusinessDetailSerializer

    def get_permissions(self):
        if self.request.method in ['DELETE', 'PUT', 'PATCH']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]

class BusinessClaimView(APIView):
    """View for claiming a business."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        business = get_object_or_404(Business, slug=slug)
        serializer = BusinessClaimSerializer(
            data=request.data,
            context={'business': business, 'user': request.user}
        )
        
        if serializer.is_valid():
            try:
                business.claim(request.user)
                return Response({
                    'message': 'Business claimed successfully',
                    'business': BusinessDetailSerializer(business).data
                })
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BusinessUnclaimView(APIView):
    """View for unclaiming a business."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        business = get_object_or_404(Business, slug=slug)
        serializer = BusinessUnclaimSerializer(
            data=request.data,
            context={'business': business, 'user': request.user}
        )
        
        if serializer.is_valid():
            try:
                business.unclaim()
                return Response({
                    'message': 'Business unclaimed successfully',
                    'business': BusinessDetailSerializer(business).data
                })
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_businesses(request):
    """Get all businesses owned by the current user."""
    businesses = Business.objects.filter(owner=request.user)
    serializer = BusinessListSerializer(businesses, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_business_ownership(request, slug):
    """Check if the current user owns a specific business."""
    business = get_object_or_404(Business, slug=slug)
    return Response({
        'is_owner': business.owner == request.user,
        'is_claimed': business.claimed
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def type_businesses(request):
    """Get all businesses grouped by their type."""
    try:
        types = Type.objects.filter(is_active=True)
        result = []
        
        for type_obj in types:
            try:
                businesses = Business.objects.filter(
                    type=type_obj,
                    is_active=True
                )
                if businesses.exists():
                    # Get the serialized data
                    business_data = BusinessListSerializer(businesses, many=True).data
                    
                    # Add full URLs for images
                    for business in business_data:
                        if business.get('image'):
                            business['image'] = request.build_absolute_uri(business['image'])
                    
                    result.append({
                        'type': type_obj.name,
                        'businesses': business_data
                    })
            except Exception as e:
                print(f"Error processing businesses for type {type_obj.name}: {str(e)}")
                continue
        
        return Response(result)
    except Exception as e:
        print(f"Error in type_businesses view: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )