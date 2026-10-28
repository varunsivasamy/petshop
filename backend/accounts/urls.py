"""
Account URL endpoints.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    VerifyAccountView,
    CustomTokenObtainPairView,
    UserProfileView,
    UserListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('verify/', VerifyAccountView.as_view(), name='auth-verify'),
    path('login/', CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('profile/', UserProfileView.as_view(), name='auth-profile'),
    path('users/', UserListView.as_view(), name='admin-users-list'),
]
