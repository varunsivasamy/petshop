"""
Role-based and verification permissions.
"""

from rest_framework import permissions


class IsShopOwner(permissions.BasePermission):
    """Allows access only to authenticated users with SHOP_OWNER or ADMIN role."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_shop_owner
        )


class IsVerifiedUser(permissions.BasePermission):
    """Requires user to be email/identity verified."""

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_verified
        )


class IsSelfOrShopOwner(permissions.BasePermission):
    """Allows users to manage their own object or allows Shop Owners/Admins full access."""

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_shop_owner:
            return True
        return hasattr(obj, 'user') and obj.user == request.user or obj == request.user
