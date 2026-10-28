"""
Order Service: Concurrency-Safe Checkout & Order Lifecycle Management.
Adheres to SRP, DIP (depends on repository & payment gateway abstractions).
Guarantees race-condition prevention using Pessimistic Database Row Locking.
"""

from typing import List, Dict, Any, Optional
from decimal import Decimal
from django.db import transaction, DatabaseError, OperationalError
from django.core.exceptions import ValidationError, PermissionDenied
from rest_framework.exceptions import APIException
from common.interfaces import IPaymentGateway
from pets.repositories import IPetRepository, PetRepository
from .repositories import IOrderRepository, OrderRepository
from .payment_gateways import PaymentGatewayFactory
from .models import Order, OrderItem


class PetUnavailableException(APIException):
    """Raised when concurrent buyers contest for an already-claimed pet."""
    status_code = 409
    default_detail = "One or more selected pets are no longer available for adoption/sale."
    default_code = "pet_unavailable"


class OrderService:
    """Coordinates checkout transactions, concurrency locks, and payment processing."""

    def __init__(
        self,
        order_repository: Optional[IOrderRepository] = None,
        pet_repository: Optional[IPetRepository] = None,
    ):
        self.order_repository = order_repository or OrderRepository()
        self.pet_repository = pet_repository or PetRepository()

    def process_checkout(
        self,
        customer,
        shipping_data: Dict[str, Any],
        items_data: List[Dict[str, Any]],
        payment_method: str = "CARD"
    ) -> Order:
        """
        Executes atomic checkout with Pessimistic Row Locking (`select_for_update()`).
        Prevents race conditions in multi-user environments.
        """
        if not items_data:
            raise ValidationError("Cannot checkout an empty order.")

        try:
            # Atomic transaction boundary with pessimistic row locking
            with transaction.atomic():
                total_amount = Decimal('0.00')
                locked_pets = []
                order_items_to_create = []

                for item in items_data:
                    pet_id = item.get('pet_id')
                    qty = item.get('quantity', 1)

                    # Acquire row-level lock on the pet record (Blocks concurrent transactions until commit)
                    pet = self.pet_repository.get_by_id_locked(pet_id)
                    if not pet:
                        raise ValidationError(f"Pet listing #{pet_id} does not exist.")

                    # Concurrency check
                    if not pet.is_available or pet.stock_quantity < qty:
                        raise PetUnavailableException(
                            f"Sorry! '{pet.name}' has just been adopted by another customer or is currently out of stock."
                        )

                    unit_price = Decimal(str(pet.price))
                    line_subtotal = unit_price * qty
                    total_amount += line_subtotal

                    # Update stock and availability within lock
                    pet.stock_quantity -= qty
                    if pet.stock_quantity <= 0:
                        pet.is_available = False
                    pet.save(update_fields=['stock_quantity', 'is_available', 'updated_at'])

                    locked_pets.append((pet, unit_price, qty, line_subtotal))

                # Generate unique order number
                order_number = Order.generate_order_number()

                # Execute payment delegation via Open/Closed strategy
                gateway: IPaymentGateway = PaymentGatewayFactory.get_gateway(payment_method)
                payment_result = gateway.process_payment(
                    order_id=0,
                    amount=float(total_amount),
                    currency="USD",
                    metadata={'customer_email': customer.email}
                )

                payment_status = Order.PaymentStatus.PAID if payment_result.get('status') == 'PAID' else Order.PaymentStatus.PENDING

                # Create Order
                order = Order.objects.create(
                    order_number=order_number,
                    customer=customer,
                    status=Order.Status.CONFIRMED if payment_status == Order.PaymentStatus.PAID else Order.Status.PENDING,
                    payment_status=payment_status,
                    payment_method=payment_method,
                    transaction_id=payment_result.get('transaction_id', ''),
                    total_amount=total_amount,
                    recipient_name=shipping_data.get('recipient_name', customer.get_full_name() or customer.username),
                    shipping_address=shipping_data.get('shipping_address', customer.address),
                    shipping_city=shipping_data.get('shipping_city', customer.city),
                    shipping_postal_code=shipping_data.get('shipping_postal_code', customer.postal_code),
                    shipping_phone=shipping_data.get('shipping_phone', customer.phone_number),
                    delivery_notes=shipping_data.get('delivery_notes', ''),
                )

                # Create OrderItems
                for pet, unit_price, qty, subtotal in locked_pets:
                    OrderItem.objects.create(
                        order=order,
                        pet=pet,
                        pet_name=pet.name,
                        unit_price=unit_price,
                        quantity=qty,
                        subtotal=subtotal
                    )

                return order
        except (OperationalError, DatabaseError) as db_err:
            err_msg = str(db_err).lower()
            if 'locked' in err_msg or 'deadlock' in err_msg or 'timeout' in err_msg:
                raise PetUnavailableException(
                    "This pet is currently being acquired by another customer. Please choose another pet or try again."
                )
            raise db_err

    def update_order_status(
        self,
        order_id: int,
        user,
        new_status: str,
        tracking_number: Optional[str] = None
    ) -> Order:
        """Allows Shop Owners to transition order states."""
        if not user.is_shop_owner:
            raise PermissionDenied("Only Shop Owners can update order fulfillment states.")

        order = self.order_repository.get_by_id(order_id)
        if not order:
            raise ValidationError("Order not found.")

        order.status = new_status
        if tracking_number:
            order.tracking_number = tracking_number

        order.save(update_fields=['status', 'tracking_number', 'updated_at'])
        return order
