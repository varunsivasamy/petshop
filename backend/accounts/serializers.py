"""
Accounts Serializers with Token customization and user validation.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Augments JWT claims with user domain role and verification state."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        token['is_shop_owner'] = user.is_shop_owner
        token['full_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'is_verified': self.user.is_verified,
            'is_shop_owner': self.user.is_shop_owner,
            'phone_number': self.user.phone_number,
            'address': self.user.address,
            'city': self.user.city,
            'postal_code': self.user.postal_code,
            'avatar': self.user.avatar.url if self.user.avatar else None,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    """Public and internal representation of a User entity."""

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'is_verified', 'is_shop_owner', 'phone_number',
            'address', 'city', 'postal_code', 'avatar', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at', 'is_shop_owner']


class RegisterSerializer(serializers.ModelSerializer):
    """Validates registration data and generates identity verification token."""
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.CUSTOMER)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'password', 'first_name',
            'last_name', 'role', 'phone_number', 'address', 'city', 'postal_code'
        ]
        extra_kwargs = {
            'username': {'required': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value.lower()

    def create(self, validated_data):
        password = validated_data.pop('password')
        email = validated_data['email']
        username = validated_data.get('username') or email.split('@')[0] + "_" + get_random_string(4)
        validated_data['username'] = username

        # Generate verification code for real user authentication
        verification_code = get_random_string(6, allowed_chars='0123456789')
        validated_data['verification_code'] = verification_code
        validated_data['is_verified'] = False  # Real user verification required

        user = User.objects.create_user(password=password, **validated_data)
        return user


class VerifyAccountSerializer(serializers.Serializer):
    """Processes verification code to confirm real user authenticity."""
    email = serializers.EmailField()
    code = serializers.CharField(max_length=64)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Enables authenticated users to update their profile and shipping details."""

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number',
            'address', 'city', 'postal_code', 'avatar'
        ]
