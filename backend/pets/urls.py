"""
Pets URL configuration.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PetViewSet,
    CategoryViewSet,
    BreedListView,
    CachedImageDeliveryView,
)

router = DefaultRouter()
router.register(r'catalog', PetViewSet, basename='pet')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
    path('breeds/', BreedListView.as_view(), name='breed-list'),
    path('media-cached/<int:image_id>/', CachedImageDeliveryView.as_view(), name='cached-image-delivery'),
]
