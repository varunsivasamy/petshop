"""
Pets Serializers: Lightweight representations for fast SPA Virtual DOM rendering,
and rich detailed representations for product pages.
"""

from rest_framework import serializers
from .models import Pet, PetImage, Category, Breed
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    pet_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'pet_count']


class BreedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Breed
        fields = ['id', 'name', 'description', 'category']


class PetImageSerializer(serializers.ModelSerializer):
    """Includes image URL and SHA256 content_hash for client-side local caching."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PetImage
        fields = ['id', 'image_url', 'is_primary', 'content_hash', 'file_size_bytes', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class PetListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer optimized for fast list rendering
    in the React Single Page Application virtual DOM.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    breed_name = serializers.CharField(source='breed.name', read_only=True, default=None)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'category', 'category_name', 'breed', 'breed_name',
            'gender', 'size', 'age_months', 'price',
            'is_vaccinated', 'is_available', 'is_featured', 'primary_image'
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary and primary.image:
            request = self.context.get('request')
            url = request.build_absolute_uri(primary.image.url) if request else primary.image.url
            return {
                'id': primary.id,
                'url': url,
                'content_hash': primary.content_hash,
            }
        return None


class PetDetailSerializer(serializers.ModelSerializer):
    """Comprehensive representation of pet with full gallery and health disclosures."""
    category = CategorySerializer(read_only=True)
    breed = BreedSerializer(read_only=True)
    images = PetImageSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Pet
        fields = [
            'id', 'name', 'category', 'breed', 'gender', 'size',
            'age_months', 'price', 'description', 'is_vaccinated',
            'is_neutered', 'is_microchipped', 'health_notes',
            'is_available', 'stock_quantity', 'is_featured',
            'views_count', 'owner', 'images', 'created_at', 'updated_at'
        ]


class PetCreateUpdateSerializer(serializers.ModelSerializer):
    """Shop owner serializer for creating and modifying pet listings."""

    class Meta:
        model = Pet
        fields = [
            'name', 'category', 'breed', 'gender', 'size',
            'age_months', 'price', 'description', 'is_vaccinated',
            'is_neutered', 'is_microchipped', 'health_notes',
            'is_available', 'stock_quantity', 'is_featured'
        ]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be a non-negative number.")
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value
