"""
Orders Domain Models: Order, OrderItem, and Payment tracking.
"""

from django.db import models
from django.conf import settings
from django.utils.crypto import get_random_string
from common.models import TimestampedModel
from pets.models import Pet


class Order(TimestampedModel):
    """E-Commerce customer order for pet purchases and adoptions."""

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Payment'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PROCESSING = 'PROCESSING', 'Processing & Vet Inspection'
        SHIPPED = 'SHIPPED', 'In Transit'
        DELIVERED = 'DELIVERED', 'Delivered & Adopted'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAID = 'PAID', 'Paid'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    class PaymentMethod(models.TextChoices):
        CARD = 'CARD', 'Credit / Debit Card'
        CASH_ON_DELIVERY = 'COD', 'Cash On Delivery'
        DIGITAL_WALLET = 'WALLET', 'Digital Wallet'

    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CARD
    )
    transaction_id = models.CharField(max_length=100, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Delivery Information
    recipient_name = models.CharField(max_length=150)
    shipping_address = models.CharField(max_length=255)
    shipping_city = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_phone = models.CharField(max_length=20)
    delivery_notes = models.TextField(blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number} - {self.customer.email} (${self.total_amount})"

    @classmethod
    def generate_order_number(cls) -> str:
        """Generates cryptographically random, collision-resistant order numbers."""
        return f"ORD-{get_random_string(8).upper()}"


class OrderItem(TimestampedModel):
    """Line item within an order preserving historical pricing snapshot."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    pet = models.ForeignKey(Pet, on_delete=models.PROTECT, related_name='order_items')
    pet_name = models.CharField(max_length=150)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.pet_name} x {self.quantity} (${self.subtotal})"
