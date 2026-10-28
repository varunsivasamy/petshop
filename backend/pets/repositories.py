"""
Pet Repository: Decouples Data Access from Business Services (SOLID DIP & LSP).
"""

from abc import abstractmethod
from typing import Optional, List, Dict, Any
from django.db import transaction
from django.db.models import Q
from common.interfaces import IBaseRepository
from .models import Pet, PetImage, Category, Breed


class IPetRepository(IBaseRepository[Pet]):
    """Abstract contract for pet persistence and queries."""

    @abstractmethod
    def get_by_id_locked(self, pet_id: int) -> Optional[Pet]:
        """Fetch pet with pessimistic row-level lock (SELECT FOR UPDATE) for concurrency safety."""
        pass

    @abstractmethod
    def search_and_filter(self, filters: Dict[str, Any]) -> List[Pet]:
        """Retrieve filtered pets according to domain criteria."""
        pass

    @abstractmethod
    def increment_views(self, pet_id: int) -> None:
        """Atomically increment pet views counter."""
        pass


class PetRepository(IPetRepository):
    """Django ORM concrete implementation of IPetRepository."""

    def get_by_id(self, entity_id: int) -> Optional[Pet]:
        try:
            return Pet.objects.select_related('category', 'breed', 'owner')\
                              .prefetch_related('images')\
                              .get(id=entity_id, is_deleted=False)
        except Pet.DoesNotExist:
            return None

    def get_by_id_locked(self, pet_id: int) -> Optional[Pet]:
        """
        Pessimistic locking using SELECT ... FOR UPDATE.
        Must be executed within an active transaction.atomic() block.
        Ensures concurrent purchase requests cannot double-sell the same pet.
        """
        try:
            return Pet.objects.select_for_update()\
                              .select_related('category', 'breed', 'owner')\
                              .get(id=pet_id, is_deleted=False)
        except Pet.DoesNotExist:
            return None

    def list_all(self, **filters) -> List[Pet]:
        qs = Pet.objects.filter(is_deleted=False)
        if filters:
            qs = qs.filter(**filters)
        return qs.select_related('category', 'breed')\
                 .prefetch_related('images')\
                 .order_by('-is_featured', '-created_at')

    def search_and_filter(self, filters: Dict[str, Any]):
        qs = Pet.objects.filter(is_deleted=False)

        # Filters
        category = filters.get('category')
        if category:
            qs = qs.filter(Q(category__slug=category) | Q(category__name__iexact=category))

        gender = filters.get('gender')
        if gender:
            qs = qs.filter(gender=gender)

        size = filters.get('size')
        if size:
            qs = qs.filter(size=size)

        min_price = filters.get('min_price')
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)

        max_price = filters.get('max_price')
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)

        is_available = filters.get('is_available')
        if is_available is not None:
            qs = qs.filter(is_available=is_available)

        search = filters.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(breed__name__icontains=search) |
                Q(description__icontains=search)
            )

        return qs.select_related('category', 'breed')\
                 .prefetch_related('images')\
                 .order_by('-is_featured', '-created_at')

    def create(self, **data) -> Pet:
        return Pet.objects.create(**data)

    def update(self, entity: Pet, **data) -> Pet:
        for field, value in data.items():
            setattr(entity, field, value)
        entity.save()
        return entity

    def delete(self, entity: Pet) -> bool:
        entity.soft_delete()
        return True

    def increment_views(self, pet_id: int) -> None:
        Pet.objects.filter(id=pet_id).update(views_count=models.F('views_count') + 1)
