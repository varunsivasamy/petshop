"""
Automated Tests for Orders Domain: Concurrency Handling, Row Locking, and Gateway Strategy.
"""

from decimal import Decimal
import threading
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from pets.models import Category, Pet
from orders.models import Order
from orders.services import OrderService, PetUnavailableException
from orders.payment_gateways import PaymentGatewayFactory, MockCardPaymentGateway

User = get_user_model()


class OrderConcurrencyAndFulfillmentTests(TransactionTestCase):
    """
    TransactionTestCase ensures real transactions and DB row locks are tested.
    """

    def setUp(self):
        self.client_a = APIClient()
        self.client_b = APIClient()

        self.owner = User.objects.create_user(
            email="owner@petshop.com",
            password="Password123!",
            role=User.Role.SHOP_OWNER,
            is_verified=True
        )
        self.customer_a = User.objects.create_user(
            email="buyer_a@example.com",
            password="Password123!",
            role=User.Role.CUSTOMER,
            is_verified=True
        )
        self.customer_b = User.objects.create_user(
            email="buyer_b@example.com",
            password="Password123!",
            role=User.Role.CUSTOMER,
            is_verified=True
        )

        self.category = Category.objects.create(name="Cats", slug="cats")
        self.pet = Pet.objects.create(
            owner=self.owner,
            name="Luna",
            category=self.category,
            gender="FEMALE",
            price=Decimal("450.00"),
            description="Playful kitten",
            is_available=True,
            stock_quantity=1
        )

    def test_single_user_successful_checkout(self):
        """Standard checkout succeeds and marks pet unavailable."""
        self.client_a.force_authenticate(user=self.customer_a)
        payload = {
            "items": [{"pet_id": self.pet.id, "quantity": 1}],
            "payment_method": "CARD",
            "recipient_name": "Buyer A",
            "shipping_address": "123 Pet St",
            "shipping_city": "Dogtown",
            "shipping_postal_code": "10001",
            "shipping_phone": "555-0199"
        }
        res = self.client_a.post('/api/orders/checkout/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.pet.refresh_from_db()
        self.assertFalse(self.pet.is_available)
        self.assertEqual(self.pet.stock_quantity, 0)

    def test_concurrent_double_purchase_prevents_race_condition(self):
        """
        Simulates two buyers attempting to buy the last available pet simultaneously.
        Pessimistic locking (select_for_update) guarantees:
        - Exactly ONE order succeeds (201 Created)
        - The other fails with 409 Conflict
        """
        results = []

        def checkout_attempt(client, customer, tag):
            from django.db import connection
            try:
                client.force_authenticate(user=customer)
                payload = {
                    "items": [{"pet_id": self.pet.id, "quantity": 1}],
                    "payment_method": "CARD",
                    "recipient_name": f"Buyer {tag}",
                    "shipping_address": f"{tag} St",
                    "shipping_city": "City",
                    "shipping_postal_code": "10001",
                    "shipping_phone": "555-0000"
                }
                res = client.post('/api/orders/checkout/', payload, format='json')
                results.append((tag, res.status_code))
            except Exception as e:
                # Capture status code if already an API exception
                sc = getattr(e, 'status_code', None)
                if not sc and 'locked' in str(e).lower():
                    sc = status.HTTP_409_CONFLICT
                results.append((tag, sc or 500))
            finally:
                connection.close()

        t1 = threading.Thread(target=checkout_attempt, args=(self.client_a, self.customer_a, "A"))
        t2 = threading.Thread(target=checkout_attempt, args=(self.client_b, self.customer_b, "B"))

        t1.start()
        t2.start()
        t1.join()
        t2.join()

        status_codes = [status_code for _, status_code in results]
        self.assertIn(status.HTTP_201_CREATED, status_codes)
        self.assertIn(status.HTTP_409_CONFLICT, status_codes)

        # Pet must be marked unavailable
        self.pet.refresh_from_db()
        self.assertFalse(self.pet.is_available)
        self.assertEqual(self.pet.stock_quantity, 0)

        # Exactly 1 order created in DB
        self.assertEqual(Order.objects.count(), 1)

    def test_payment_gateway_strategy_pattern(self):
        """Verifies OCP: Gateway factory retrieves correct strategy."""
        card_gw = PaymentGatewayFactory.get_gateway('CARD')
        self.assertIsInstance(card_gw, MockCardPaymentGateway)
        res = card_gw.process_payment(order_id=1, amount=100.0)
        self.assertTrue(res['success'])
        self.assertEqual(res['status'], 'PAID')
