"""
Abstract interfaces and protocols embodying SOLID design principles:
- DIP: Dependency Inversion Principle (Services depend on interfaces)
- OCP: Open/Closed Principle (Pluggable strategies for payment and media)
- LSP: Liskov Substitution Principle (Consistent contracts for repos and gateways)
"""

from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional, List, Any, Dict

T = TypeVar('T')


class IBaseRepository(ABC, Generic[T]):
    """Generic repository abstraction decoupling domain services from direct ORM dependencies."""

    @abstractmethod
    def get_by_id(self, entity_id: Any) -> Optional[T]:
        """Fetch single entity by primary key."""
        pass

    @abstractmethod
    def list_all(self, **filters) -> List[T]:
        """List entities matching criteria."""
        pass

    @abstractmethod
    def create(self, **data) -> T:
        """Persist new entity."""
        pass

    @abstractmethod
    def update(self, entity: T, **data) -> T:
        """Update existing entity."""
        pass

    @abstractmethod
    def delete(self, entity: T) -> bool:
        """Delete or soft-delete entity."""
        pass


class IPaymentGateway(ABC):
    """
    Open/Closed Principle: Order processing delegates payment to an abstract gateway.
    New payment channels (Stripe, Razorpay, Mock, CashOnDelivery) can be introduced
    without touching order core logic.
    """

    @property
    @abstractmethod
    def gateway_code(self) -> str:
        """Unique identifier of the payment gateway."""
        pass

    @abstractmethod
    def process_payment(self, order_id: int, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Execute payment transaction returning status, transaction_id, and details."""
        pass

    @abstractmethod
    def refund_payment(self, transaction_id: str, amount: float) -> bool:
        """Issue refund against a previous transaction."""
        pass


class IImageOptimizationService(ABC):
    """
    Abstract image processor responsible for server-side storage,
    ETag generation, and bandwidth reduction headers.
    """

    @abstractmethod
    def process_and_hash(self, uploaded_file) -> Dict[str, Any]:
        """Validate, optimize image dimensions, and compute SHA256 content hash."""
        pass

    @abstractmethod
    def get_cache_headers(self, content_hash: str) -> Dict[str, str]:
        """Generate HTTP Cache-Control and ETag headers for aggressive client caching."""
        pass
