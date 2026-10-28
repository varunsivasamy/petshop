"""
Payment Gateway Strategy Implementations.
Open/Closed Principle (OCP): New gateways can be added without modifying OrderService.
"""

from typing import Dict, Any
from django.utils.crypto import get_random_string
from common.interfaces import IPaymentGateway


class MockCardPaymentGateway(IPaymentGateway):
    """Simulated credit/debit card payment gateway for instant processing."""

    @property
    def gateway_code(self) -> str:
        return "CARD"

    def process_payment(self, order_id: int, amount: float, currency: str = "USD", metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        # In a real environment, this invokes Stripe / PayPal API
        transaction_id = f"TXN-CARD-{get_random_string(12).upper()}"
        return {
            'success': True,
            'transaction_id': transaction_id,
            'amount': amount,
            'currency': currency,
            'message': 'Payment authorized and captured successfully.',
            'status': 'PAID',
        }

    def refund_payment(self, transaction_id: str, amount: float) -> bool:
        return True


class CashOnDeliveryGateway(IPaymentGateway):
    """Cash on delivery payment handler."""

    @property
    def gateway_code(self) -> str:
        return "COD"

    def process_payment(self, order_id: int, amount: float, currency: str = "USD", metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        transaction_id = f"TXN-COD-{get_random_string(8).upper()}"
        return {
            'success': True,
            'transaction_id': transaction_id,
            'amount': amount,
            'currency': currency,
            'message': 'Order confirmed for Cash On Delivery.',
            'status': 'PENDING',
        }

    def refund_payment(self, transaction_id: str, amount: float) -> bool:
        return True


class PaymentGatewayFactory:
    """Factory creating payment gateway strategies (DIP & OCP)."""

    _registry: Dict[str, IPaymentGateway] = {
        'CARD': MockCardPaymentGateway(),
        'COD': CashOnDeliveryGateway(),
        'WALLET': MockCardPaymentGateway(),
    }

    @classmethod
    def get_gateway(cls, method: str) -> IPaymentGateway:
        gateway = cls._registry.get(method.upper())
        if not gateway:
            # Fallback to Card
            return cls._registry['CARD']
        return gateway

    @classmethod
    def register_gateway(cls, code: str, gateway: IPaymentGateway):
        """Allows runtime extension with new gateways without touching core code."""
        cls._registry[code.upper()] = gateway
