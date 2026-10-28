"""
Order Repository: Encapsulates query logic and status persistence for Orders.
"""

from abc import abstractmethod
from typing import Optional, List, Dict, Any
from django.db.models import Q
from common.interfaces import IBaseRepository
from .models import Order, OrderItem


class IOrderRepository(IBaseRepository[Order]):
    """Abstract repository for Orders."""

    @abstractmethod
    def get_by_order_number(self, order_number: str) -> Optional[Order]:
        pass

    @abstractmethod
    def list_by_customer(self, customer_id: int) -> List[Order]:
        pass

    @abstractmethod
    def list_with_filters(self, filters: Dict[str, Any]) -> List[Order]:
        pass


class OrderRepository(IOrderRepository):
    """Concrete ORM Order Repository."""

    def get_by_id(self, entity_id: int) -> Optional[Order]:
        try:
            return Order.objects.select_related('customer')\
                                .prefetch_related('items__pet__images')\
                                .get(id=entity_id)
        except Order.DoesNotExist:
            return None

    def get_by_order_number(self, order_number: str) -> Optional[Order]:
        try:
            return Order.objects.select_related('customer')\
                                .prefetch_related('items__pet__images')\
                                .get(order_number=order_number)
        except Order.DoesNotExist:
            return None

    def list_all(self, **filters) -> List[Order]:
        return Order.objects.filter(**filters)\
                            .select_related('customer')\
                            .prefetch_related('items')\
                            .order_by('-created_at')

    def list_by_customer(self, customer_id: int) -> List[Order]:
        return Order.objects.filter(customer_id=customer_id)\
                            .prefetch_related('items__pet__images')\
                            .order_by('-created_at')

    def list_with_filters(self, filters: Dict[str, Any]) -> List[Order]:
        qs = Order.objects.all().select_related('customer').prefetch_related('items__pet')
        
        status = filters.get('status')
        if status:
            qs = qs.filter(status=status)

        payment_status = filters.get('payment_status')
        if payment_status:
            qs = qs.filter(payment_status=payment_status)

        search = filters.get('search')
        if search:
            qs = qs.filter(
                Q(order_number__icontains=search) |
                Q(customer__email__icontains=search) |
                Q(recipient_name__icontains=search)
            )

        return qs.order_by('-created_at')

    def create(self, **data) -> Order:
        return Order.objects.create(**data)

    def update(self, entity: Order, **data) -> Order:
        for field, value in data.items():
            setattr(entity, field, value)
        entity.save()
        return entity

    def delete(self, entity: Order) -> bool:
        entity.status = Order.Status.CANCELLED
        entity.save(update_fields=['status'])
        return True
