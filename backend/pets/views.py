"""
Pets Views: REST API endpoints orchestrating PetService and ImageOptimizationService.
"""

from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Count, Q
from django.http import HttpResponse, HttpResponseNotModified, Http404
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Pet, PetImage, Category, Breed
from .serializers import (
    PetListSerializer,
    PetDetailSerializer,
    PetCreateUpdateSerializer,
    PetImageSerializer,
    CategorySerializer,
    BreedSerializer,
)
from .services import PetService
from .image_service import ImageOptimizationService
from accounts.permissions import IsShopOwner


class PetViewSet(viewsets.ModelViewSet):
    """
    Pet Listings CRUD:
    - Anyone can browse and view pets.
    - Shop Owners / Admins can create, update, and delete listings.
    """
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.service = PetService()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'upload_image', 'delete_image']:
            return [permissions.IsAuthenticated(), IsShopOwner()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action == 'list':
            return PetListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PetCreateUpdateSerializer
        return PetDetailSerializer

    def get_queryset(self):
        # Allow Shop Owners to inspect both available and unavailable pets
        user = self.request.user
        filters = {}

        # Query parameters
        for key in ['category', 'gender', 'size', 'search']:
            val = self.request.query_params.get(key)
            if val:
                filters[key] = val

        min_price = self.request.query_params.get('min_price')
        if min_price:
            filters['min_price'] = float(min_price)

        max_price = self.request.query_params.get('max_price')
        if max_price:
            filters['max_price'] = float(max_price)

        is_avail = self.request.query_params.get('is_available')
        if is_avail is not None:
            filters['is_available'] = is_avail.lower() in ('true', '1')
        elif not (user.is_authenticated and user.is_shop_owner):
            # Regular customers by default see available pets
            filters['is_available'] = True

        return self.service.list_pets(filters)

    def retrieve(self, request, *args, **kwargs):
        pet_id = kwargs.get('pk')
        pet = self.service.get_pet_details(pet_id)
        if not pet:
            return Response({"detail": "Pet not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PetDetailSerializer(pet, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = PetCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        images = request.FILES.getlist('images')
        
        pet = self.service.create_pet(
            owner=request.user,
            data=serializer.validated_data,
            images=images
        )
        return Response(
            PetDetailSerializer(pet, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        pet_id = kwargs.get('pk')
        serializer = PetCreateUpdateSerializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        pet = self.service.update_pet(
            pet_id=pet_id,
            user=request.user,
            data=serializer.validated_data
        )
        return Response(PetDetailSerializer(pet, context={'request': request}).data)

    def destroy(self, request, *args, **kwargs):
        pet_id = kwargs.get('pk')
        self.service.delete_pet(pet_id=pet_id, user=request.user)
        return Response({"message": "Pet listing removed successfully."}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='upload-image', parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """Shop Owner uploads additional images for a pet."""
        pet = self.get_object()
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"detail": "Image file is required."}, status=status.HTTP_400_BAD_REQUEST)

        is_primary = request.data.get('is_primary', 'false').lower() in ('true', '1')
        pet_image = self.service.attach_image(pet, image_file, is_primary=is_primary)

        return Response(
            PetImageSerializer(pet_image, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path='delete-image/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """Delete an image from a pet."""
        pet = self.get_object()
        image = get_object_or_404(PetImage, id=image_id, pet=pet)
        image.delete()
        return Response({"message": "Image deleted."}, status=status.HTTP_204_NO_CONTENT)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List pet categories with dynamic counts."""
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.annotate(
            pet_count=Count('pets', filter=Q(pets__is_available=True, pets__is_deleted=False))
        ).order_by('name')


class BreedListView(generics.ListAPIView):
    """List breeds, optionally filtered by category."""
    serializer_class = BreedSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        category_id = self.request.query_params.get('category')
        if category_id:
            return Breed.objects.filter(category_id=category_id)
        return Breed.objects.all()


class CachedImageDeliveryView(generics.GenericAPIView):
    """
    Dedicated bandwidth-optimized image delivery endpoint.
    - Emits aggressive Cache-Control: max-age=31536000, immutable
    - Emits ETag = "{content_hash}"
    - Returns HTTP 304 Not Modified if client already holds the image locally
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, image_id):
        image_obj = get_object_or_404(PetImage, id=image_id)
        content_hash = image_obj.content_hash

        # Check conditional cache (client already has it stored)
        if content_hash and ImageOptimizationService.handle_conditional_cache(request, content_hash):
            response = HttpResponseNotModified()
            response['ETag'] = f'"{content_hash}"'
            response['Cache-Control'] = 'public, max-age=31536000, immutable'
            return response

        if not image_obj.image or not os.path.exists(image_obj.image.path):
            raise Http404("Image file not found on disk.")

        with open(image_obj.image.path, 'rb') as f:
            content = f.read()

        response = HttpResponse(content, content_type='image/jpeg')
        response['Cache-Control'] = 'public, max-age=31536000, immutable'
        if content_hash:
            response['ETag'] = f'"{content_hash}"'
        return response
