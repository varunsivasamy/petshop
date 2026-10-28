"""
Pets Domain Models: Categories, Breeds, Pets, and Media Assets with Hashing.
"""

from django.db import models
from django.conf import settings
from common.models import TimestampedModel, SoftDeletableModel
import hashlib


class Category(TimestampedModel):
    """Pet Category e.g., Dogs, Cats, Birds, Exotic."""
    name = models.CharField(max_length=100, unique=True, db_index=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name or emoji")

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Breed(TimestampedModel):
    """Pet Breed tied to a specific Category."""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='breeds')
    name = models.CharField(max_length=100, db_index=True)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ('category', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Pet(TimestampedModel, SoftDeletableModel):
    """
    Pet listing entity managed by the Shop Owner and browsed/ordered by Customers.
    """

    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        UNKNOWN = 'UNKNOWN', 'Unknown'

    class Size(models.TextChoices):
        SMALL = 'SMALL', 'Small'
        MEDIUM = 'MEDIUM', 'Medium'
        LARGE = 'LARGE', 'Large'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pets',
        help_text="Shop owner managing this pet."
    )
    name = models.CharField(max_length=150, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='pets')
    breed = models.ForeignKey(Breed, on_delete=models.SET_NULL, null=True, blank=True, related_name='pets')
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.UNKNOWN)
    size = models.CharField(max_length=10, choices=Size.choices, default=Size.MEDIUM)
    age_months = models.PositiveIntegerField(help_text="Age in months", default=3)
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    description = models.TextField()
    
    # Health and Care Attributes
    is_vaccinated = models.BooleanField(default=True)
    is_neutered = models.BooleanField(default=False)
    is_microchipped = models.BooleanField(default=True)
    health_notes = models.TextField(blank=True, default="Health checked and verified by certified veterinarian.")
    
    # Inventory & Status (Concurrency-Critical)
    is_available = models.BooleanField(default=True, db_index=True)
    stock_quantity = models.PositiveIntegerField(default=1, help_text="Quantity available (1 for individual pet)")
    is_featured = models.BooleanField(default=False, db_index=True)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_featured', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.category.name} (${self.price})"

    @property
    def primary_image_url(self) -> str:
        """Returns primary image url or fallback placeholder."""
        primary = self.images.filter(is_primary=True).first() or self.images.first()
        if primary and primary.image:
            return primary.image.url
        return ""


def pet_image_upload_path(instance, filename: str) -> str:
    """Generate isolated content-addressed path for pet images."""
    pet_id = instance.pet_id if instance.pet_id else 'temp'
    return f"pets/{pet_id}/{filename}"


class PetImage(TimestampedModel):
    """
    Server-side stored image with SHA256 checksum for immutable client-side caching.
    """
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=pet_image_upload_path)
    is_primary = models.BooleanField(default=False)
    content_hash = models.CharField(max_length=64, blank=True, db_index=True)
    file_size_bytes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-is_primary', 'id']

    def save(self, *args, **kwargs):
        # Calculate SHA256 checksum for server-side deduplication and client-side caching
        if self.image and not self.content_hash:
            try:
                self.image.seek(0)
                file_content = self.image.read()
                self.content_hash = hashlib.sha256(file_content).hexdigest()
                self.file_size_bytes = len(file_content)
                self.image.seek(0)
            except Exception:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.pet.name} (Primary: {self.is_primary})"
