"""
Automated Tests for Pets Domain: Services, Repositories, Caching, and Permissions.
"""

from io import BytesIO
from PIL import Image
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Breed, Pet, PetImage
from .services import PetService
from .image_service import ImageOptimizationService

User = get_user_model()


class PetDomainTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner@petshop.com",
            password="Password123!",
            role=User.Role.SHOP_OWNER,
            is_verified=True
        )
        self.customer = User.objects.create_user(
            email="customer@example.com",
            password="Password123!",
            role=User.Role.CUSTOMER,
            is_verified=True
        )
        self.category = Category.objects.create(name="Dogs", slug="dogs")
        self.breed = Breed.objects.create(name="Golden Retriever", category=self.category)

    def _generate_test_image(self) -> SimpleUploadedFile:
        file = BytesIO()
        image = Image.new('RGB', (400, 400), color='blue')
        image.save(file, 'JPEG')
        file.seek(0)
        return SimpleUploadedFile("puppy.jpg", file.read(), content_type="image/jpeg")

    def test_shop_owner_creates_pet_with_image_and_sha256_hash(self):
        """Verify shop owner creates pet listing, image is hashed for local caching."""
        self.client.force_authenticate(user=self.owner)
        img = self._generate_test_image()

        payload = {
            "name": "Buddy",
            "category": self.category.id,
            "breed": self.breed.id,
            "gender": "MALE",
            "size": "MEDIUM",
            "age_months": 4,
            "price": "650.00",
            "description": "Friendly golden retriever puppy.",
            "is_vaccinated": True,
            "is_microchipped": True,
            "is_available": True,
            "stock_quantity": 1,
            "images": [img]
        }

        res = self.client.post('/api/pets/catalog/', payload, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['name'], "Buddy")

        # Check pet and image hash in DB
        pet = Pet.objects.get(id=res.data['id'])
        self.assertEqual(pet.images.count(), 1)
        pet_img = pet.images.first()
        self.assertTrue(len(pet_img.content_hash) == 64) # SHA256 length

    def test_customer_cannot_create_or_delete_pet(self):
        """Enforces role-based security: Customers cannot modify pet inventory."""
        self.client.force_authenticate(user=self.customer)
        res = self.client.post('/api/pets/catalog/', {
            "name": "Forbidden Pet",
            "category": self.category.id,
            "price": "100.00",
            "description": "Test"
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_image_cache_service_headers(self):
        """Verifies Cache-Control and ETag headers generation for zero bandwidth re-requests."""
        service = ImageOptimizationService()
        headers = service.get_cache_headers("abc123hash")
        self.assertEqual(headers['Cache-Control'], 'public, max-age=31536000, immutable')
        self.assertEqual(headers['ETag'], '"abc123hash"')
