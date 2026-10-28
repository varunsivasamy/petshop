"""
Account Views: REST API controllers delegating business logic to AuthService.
"""

from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    VerifyAccountSerializer,
    ProfileUpdateSerializer,
    CustomTokenObtainPairSerializer,
)
from .services import AuthService
from .permissions import IsShopOwner

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login endpoint that returns augmented user profile claims."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Register new customer or shop owner account."""
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(responses={201: UserSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # For demo & showcasing, return the generated verification code so the user can verify immediately
        tokens = AuthService.get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            "message": "User registered successfully. Real user verification required.",
            "user": user_data,
            "verification_code": user.verification_code, # surfaced for interactive verification
            "tokens": tokens,
        }, status=status.HTTP_201_CREATED)


class VerifyAccountView(APIView):
    """Verify account using verification code to confirm real identity."""
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=VerifyAccountSerializer)
    def post(self, request):
        serializer = VerifyAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        success, message, data = AuthService.verify_account(
            email=serializer.validated_data['email'],
            code=serializer.validated_data['code']
        )

        if not success:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message": message,
            "data": data
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update profile for currently authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """Shop owner & Admin view to inspect registered users."""
    permission_classes = [permissions.IsAuthenticated, IsShopOwner]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-created_at')
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone_number']
