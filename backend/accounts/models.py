"""
Accounts Model: Custom User with Role-Based Access Control and Verification Status.
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.crypto import get_random_string
from common.models import TimestampedModel


class UserManager(BaseUserManager):
    """Custom user manager supporting email-first or username authentication."""

    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field is required.")
        email = self.normalize_email(email)
        if not username:
            username = email.split('@')[0] + "_" + get_random_string(4)
        
        user = self.model(email=email, username=username, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)


class User(AbstractUser, TimestampedModel):
    """
    Core User entity for PetShop platform.
    Differentiates between Customers, Shop Owners, and Platform Administrators.
    """

    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        SHOP_OWNER = 'SHOP_OWNER', 'Shop Owner'
        ADMIN = 'ADMIN', 'Administrator'

    email = models.EmailField(unique=True, db_index=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Designates whether the user's real identity/email has been verified."
    )
    verification_code = models.CharField(max_length=64, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_shop_owner(self) -> bool:
        return self.role in [self.Role.SHOP_OWNER, self.Role.ADMIN] or self.is_superuser

    @property
    def is_customer(self) -> bool:
        return self.role == self.Role.CUSTOMER
