"""
Automated Tests for Accounts, JWT Auth, and Real User Verification.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .services import AuthService

User = get_user_model()


class AccountsAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.verify_url = '/api/auth/verify/'
        self.login_url = '/api/auth/login/'

    def test_user_registration_and_real_user_verification(self):
        """Test registration creates unverified user and verification code activates real user."""
        reg_payload = {
            "email": "customer@example.com",
            "password": "Password123!",
            "first_name": "Alice",
            "last_name": "Smith",
            "role": "CUSTOMER"
        }
        res = self.client.post(self.register_url, reg_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data['user']['is_verified'])
        verification_code = res.data['verification_code']

        # Verify real user
        verify_payload = {
            "email": "customer@example.com",
            "code": verification_code
        }
        v_res = self.client.post(self.verify_url, verify_payload, format='json')
        self.assertEqual(v_res.status_code, status.HTTP_200_OK)
        self.assertTrue(v_res.data['data']['is_verified'])

        # Check DB state
        user = User.objects.get(email="customer@example.com")
        self.assertTrue(user.is_verified)

    def test_jwt_token_claims_contain_role_and_verification_state(self):
        """Test JWT token payload contains domain role and verified status."""
        user = User.objects.create_user(
            email="owner@petshop.com",
            password="ShopPassword123!",
            role=User.Role.SHOP_OWNER,
            is_verified=True
        )
        login_res = self.client.post(self.login_url, {
            "email": "owner@petshop.com",
            "password": "ShopPassword123!"
        }, format='json')

        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_res.data)
        self.assertIn('refresh', login_res.data)
        self.assertEqual(login_res.data['user']['role'], 'SHOP_OWNER')
        self.assertTrue(login_res.data['user']['is_shop_owner'])
        self.assertTrue(login_res.data['user']['is_verified'])
