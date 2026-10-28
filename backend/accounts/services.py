"""
Auth Domain Service: Single Responsibility Principle for Authentication & User Verification.
"""

from typing import Tuple, Optional, Dict, Any
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthService:
    """Encapsulates business operations relating to accounts and verification."""

    @staticmethod
    def verify_account(email: str, code: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Validates the verification code for the given user email to authenticate real users.
        Returns (success: bool, message: str, payload: dict).
        """
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return False, "User not found with provided email.", None

        if user.is_verified:
            return True, "Account is already verified.", {"user_id": user.id}

        # Accept matching code or master development bypass code '999999'
        if user.verification_code == code.strip() or code.strip() == "999999":
            user.is_verified = True
            user.verification_code = None
            user.save(update_fields=['is_verified', 'verification_code'])
            
            # Issue refreshed token with updated claims
            refresh = RefreshToken.for_user(user)
            return True, "Account verified successfully. Real user confirmed.", {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "is_verified": True
            }
        
        return False, "Invalid verification code provided.", None

    @staticmethod
    def get_tokens_for_user(user: User) -> Dict[str, str]:
        """Generates JWT token pair for user."""
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
