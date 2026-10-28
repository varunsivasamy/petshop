"""
Management command to seed database with initial categories, breeds, pets, demo accounts and sample orders.
"""

from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from pets.models import Category, Breed, Pet, PetImage
from pets.image_service import ImageOptimizationService
from orders.models import Order, OrderItem

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds database with categories, breeds, demo shop owner, verified customers, pets and orders.'

    def _create_mock_image(self, title: str, color_bg: str = '#4F46E5') -> SimpleUploadedFile:
        """Generates a simple colorful placeholder image with pet name."""
        img = Image.new('RGB', (800, 600), color=color_bg)
        draw = ImageDraw.Draw(img)
        # Draw background shapes
        draw.ellipse([200, 100, 600, 500], fill='#312E81')
        draw.rectangle([300, 200, 500, 400], fill='#4338CA')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        return SimpleUploadedFile(f"{title.lower().replace(' ', '_')}.jpg", buffer.read(), content_type="image/jpeg")

    def handle(self, *args, **options):
        self.stdout.write("Starting PetShop database seeding...")

        # 1. Create Demo Shop Owner
        owner, created = User.objects.get_or_create(
            email="owner@petshop.com",
            defaults={
                "username": "shop_owner",
                "first_name": "Marcus",
                "last_name": "Paws",
                "role": User.Role.SHOP_OWNER,
                "is_verified": True,
                "phone_number": "+1 (555) 234-5678",
                "address": "742 Evergreen Terrace",
                "city": "Springfield",
                "postal_code": "97477"
            }
        )
        if created:
            owner.set_password("owner123")
            owner.save()
            self.stdout.write(self.style.SUCCESS("Created Shop Owner: owner@petshop.com (password: owner123)"))

        # 2. Create Demo Customer (Verified)
        customer, created = User.objects.get_or_create(
            email="customer@example.com",
            defaults={
                "username": "sarah_customer",
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "role": User.Role.CUSTOMER,
                "is_verified": True,
                "phone_number": "+1 (555) 876-5432",
                "address": "456 Oak Avenue",
                "city": "Metropolis",
                "postal_code": "62960"
            }
        )
        if created:
            customer.set_password("customer123")
            customer.save()
            self.stdout.write(self.style.SUCCESS("Created Customer: customer@example.com (password: customer123)"))

        # 3. Create Categories
        categories_data = [
            {"name": "Dogs", "slug": "dogs", "icon": "Dog", "desc": "Loyal, energetic, and loving companions."},
            {"name": "Cats", "slug": "cats", "icon": "Cat", "desc": "Independent, playful, and affectionate felines."},
            {"name": "Birds", "slug": "birds", "icon": "Feather", "desc": "Vibrant, singing, and social feathered friends."},
            {"name": "Small Pets", "slug": "small-pets", "icon": "Rabbit", "desc": "Gentle bunnies, hamsters, and guinea pigs."},
        ]

        cats_map = {}
        for cat in categories_data:
            c, _ = Category.objects.get_or_create(
                slug=cat['slug'],
                defaults={'name': cat['name'], 'description': cat['desc'], 'icon': cat['icon']}
            )
            cats_map[cat['slug']] = c

        # 4. Create Breeds
        breeds_data = [
            ("dogs", "Golden Retriever"),
            ("dogs", "French Bulldog"),
            ("dogs", "German Shepherd"),
            ("dogs", "Poodle"),
            ("cats", "British Shorthair"),
            ("cats", "Maine Coon"),
            ("cats", "Siamese"),
            ("birds", "Budgerigar"),
            ("birds", "Cockatiel"),
            ("small-pets", "Holland Lop"),
            ("small-pets", "Syrian Hamster"),
        ]

        breeds_map = {}
        for cat_slug, bname in breeds_data:
            b, _ = Breed.objects.get_or_create(category=cats_map[cat_slug], name=bname)
            breeds_map[bname] = b

        # 5. Create Pets
        pets_to_seed = [
            {
                "name": "Milo",
                "category": cats_map["dogs"],
                "breed": breeds_map["Golden Retriever"],
                "gender": Pet.Gender.MALE,
                "size": Pet.Size.LARGE,
                "age_months": 3,
                "price": Decimal("850.00"),
                "description": "Milo is a cheerful, golden ball of sunshine who loves to play fetch and cuddle after playtime. Fully vaccinated and health certified.",
                "is_featured": True,
                "color": "#F59E0B",
            },
            {
                "name": "Bella",
                "category": cats_map["dogs"],
                "breed": breeds_map["French Bulldog"],
                "gender": Pet.Gender.FEMALE,
                "size": Pet.Size.SMALL,
                "age_months": 5,
                "price": Decimal("1200.00"),
                "description": "Bella is an adorable French Bulldog with charming bat ears and an affectionate personality. Great with apartments and kids.",
                "is_featured": True,
                "color": "#3B82F6",
            },
            {
                "name": "Oliver",
                "category": cats_map["cats"],
                "breed": breeds_map["British Shorthair"],
                "gender": Pet.Gender.MALE,
                "size": Pet.Size.MEDIUM,
                "age_months": 4,
                "price": Decimal("750.00"),
                "description": "Oliver has a plush silver-blue coat and striking amber eyes. Calm, dignified, and loves a warm lap in the evening.",
                "is_featured": True,
                "color": "#6366F1",
            },
            {
                "name": "Luna",
                "category": cats_map["cats"],
                "breed": breeds_map["Maine Coon"],
                "gender": Pet.Gender.FEMALE,
                "size": Pet.Size.LARGE,
                "age_months": 6,
                "price": Decimal("950.00"),
                "description": "Luna is a gentle giant Maine Coon with tufted ears and a luxurious long coat. Inquisitive, playful, and vocal.",
                "is_featured": False,
                "color": "#8B5CF6",
            },
            {
                "name": "Rio",
                "category": cats_map["birds"],
                "breed": breeds_map["Cockatiel"],
                "gender": Pet.Gender.MALE,
                "size": Pet.Size.SMALL,
                "age_months": 8,
                "price": Decimal("220.00"),
                "description": "Rio loves whistling friendly melodies and perching on shoulders. Hand-tamed and exceptionally friendly.",
                "is_featured": False,
                "color": "#10B981",
            },
            {
                "name": "Clover",
                "category": cats_map["small-pets"],
                "breed": breeds_map["Holland Lop"],
                "gender": Pet.Gender.FEMALE,
                "size": Pet.Size.SMALL,
                "age_months": 2,
                "price": Decimal("140.00"),
                "description": "Clover is a sweet lop-eared bunny with velvety fur. Loves fresh clover and head scratches.",
                "is_featured": True,
                "color": "#EC4899",
            },
        ]

        img_service = ImageOptimizationService()

        for pet_spec in pets_to_seed:
            color = pet_spec.pop('color')
            name = pet_spec['name']
            pet, p_created = Pet.objects.get_or_create(
                name=name,
                owner=owner,
                defaults=pet_spec
            )
            if p_created:
                # Add mock image
                img_file = self._create_mock_image(name, color_bg=color)
                processed = img_service.process_and_hash(img_file)
                PetImage.objects.create(
                    pet=pet,
                    image=processed['file'],
                    is_primary=True,
                    content_hash=processed['content_hash'],
                    file_size_bytes=processed['file_size']
                )

        # 6. Create a Demo Order for the Customer
        sample_pet = Pet.objects.first()
        if not Order.objects.filter(customer=customer).exists() and sample_pet:
            order = Order.objects.create(
                order_number="ORD-SAMPLE01",
                customer=customer,
                status=Order.Status.CONFIRMED,
                payment_status=Order.PaymentStatus.PAID,
                payment_method=Order.PaymentMethod.CARD,
                transaction_id="TXN-DEMO-999888",
                total_amount=sample_pet.price,
                recipient_name="Sarah Jenkins",
                shipping_address="456 Oak Avenue",
                shipping_city="Metropolis",
                shipping_postal_code="62960",
                shipping_phone="+1 (555) 876-5432",
                tracking_number="TRK-9876543210"
            )
            OrderItem.objects.create(
                order=order,
                pet=sample_pet,
                pet_name=sample_pet.name,
                unit_price=sample_pet.price,
                quantity=1,
                subtotal=sample_pet.price
            )

        self.stdout.write(self.style.SUCCESS("PetShop database seeded successfully!"))
