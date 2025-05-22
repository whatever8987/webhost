from rest_framework import serializers
from .models import Business, Type
from django.contrib.auth import get_user_model

User = get_user_model()

class TypeSerializer(serializers.ModelSerializer):
    """Serializer for the Type model."""
    class Meta:
        model = Type
        fields = [
            'id', 'name', 'slug', 'info', 'description',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']

class BusinessListSerializer(serializers.ModelSerializer):
    """Serializer for listing businesses."""
    type = TypeSerializer(read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'url', 'type', 'owner_username', 'claimed',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'claimed', 'created_at']

class BusinessDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed business view."""
    type = TypeSerializer(read_only=True)
    owner = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'url', 'owner', 'claimed', 'claimed_at',
            'type', 'is_active', 'created_at', 'updated_at',
            'contact_email', 'contact_phone', 'address'
        ]
        read_only_fields = ['id', 'slug', 'claimed_at', 'created_at', 'updated_at']

class BusinessCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new business."""
    class Meta:
        model = Business
        fields = [
            'name', 'description', 'image', 'url',
            'type', 'contact_email', 'contact_phone', 'address'
        ]

    def validate_name(self, value):
        """Validate business name."""
        if Business.objects.filter(name=value).exists():
            raise serializers.ValidationError("A business with this name already exists.")
        return value

class BusinessUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating an existing business."""
    class Meta:
        model = Business
        fields = [
            'name', 'description', 'image', 'url',
            'type', 'is_active', 'contact_email',
            'contact_phone', 'address'
        ]

class BusinessClaimSerializer(serializers.Serializer):
    """Serializer for claiming a business."""
    def validate(self, data):
        business = self.context['business']
        user = self.context['user']
        
        if business.claimed:
            raise serializers.ValidationError("This business is already claimed.")
        
        if business.owner and business.owner != user:
            raise serializers.ValidationError("This business is already owned by another user.")
        
        return data

class BusinessUnclaimSerializer(serializers.Serializer):
    """Serializer for unclaiming a business."""
    def validate(self, data):
        business = self.context['business']
        user = self.context['user']
        
        if not business.claimed:
            raise serializers.ValidationError("This business is not claimed.")
        
        if business.owner != user:
            raise serializers.ValidationError("You don't have permission to unclaim this business.")
        
        return data