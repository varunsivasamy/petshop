"""
Pet Domain Service: Business Logic for Pet Listings & Inventory Management.
Adheres to SRP, OCP, and DIP (Depends on IPetRepository and IImageOptimizationService).
"""

from typing import List, Dict, Any, Optional, Tuple
from django.core.exceptions import PermissionDenied, ValidationError
from .repositories import IPetRepository, PetRepository
from .image_service import ImageOptimizationService
from .models import Pet, PetImage, Category, Breed


class PetService:
    """Orchestrates pet catalog, verification, image association, and inventory state."""

    def __init__(
        self,
        repository: Optional[IPetRepository] = None,
        image_service: Optional[ImageOptimizationService] = None
    ):
        # Dependency Inversion: allows swapping repository/image_service in unit tests
        self.repository = repository or PetRepository()
        self.image_service = image_service or ImageOptimizationService()

    def list_pets(self, filters: Dict[str, Any]):
        """Queries pets according to multi-parameter filters."""
        return self.repository.search_and_filter(filters)

    def get_pet_details(self, pet_id: int) -> Optional[Pet]:
        """Retrieves pet details and records view activity."""
        pet = self.repository.get_by_id(pet_id)
        if pet:
            self.repository.increment_views(pet_id)
        return pet

    def create_pet(self, owner, data: Dict[str, Any], images=None) -> Pet:
        """Creates a new pet listing associated with the shop owner."""
        if not owner.is_shop_owner:
            raise PermissionDenied("Only authorized Shop Owners can list pets for sale.")

        data['owner'] = owner
        pet = self.repository.create(**data)

        # Process and attach initial images if provided
        if images:
            for idx, img_file in enumerate(images):
                self.attach_image(pet, img_file, is_primary=(idx == 0))

        return pet

    def update_pet(self, pet_id: int, user, data: Dict[str, Any]) -> Pet:
        """Updates pet listing ensuring only the shop owner or admin can edit."""
        pet = self.repository.get_by_id(pet_id)
        if not pet:
            raise ValidationError("Pet listing not found.")

        if not user.is_shop_owner:
            raise PermissionDenied("Unauthorized to update this pet listing.")

        return self.repository.update(pet, **data)

    def delete_pet(self, pet_id: int, user) -> bool:
        """Soft-deletes a pet listing."""
        pet = self.repository.get_by_id(pet_id)
        if not pet:
            raise ValidationError("Pet listing not found.")

        if not user.is_shop_owner:
            raise PermissionDenied("Unauthorized to delete this pet listing.")

        return self.repository.delete(pet)

    def attach_image(self, pet: Pet, uploaded_file, is_primary: bool = False) -> PetImage:
        """Validates, hashes, stores server-side, and associates an image with a pet."""
        processed = self.image_service.process_and_hash(uploaded_file)
        
        # If this is set as primary, unmark other primary images
        if is_primary:
            pet.images.filter(is_primary=True).update(is_primary=False)
        elif not pet.images.exists():
            is_primary = True

        pet_image = PetImage.objects.create(
            pet=pet,
            image=processed['file'],
            is_primary=is_primary,
            content_hash=processed['content_hash'],
            file_size_bytes=processed['file_size']
        )
        return pet_image
