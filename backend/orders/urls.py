"""
Orders URL patterns.
"""

from django.urls import path
from .views import (
    CheckoutView,
    CustomerOrderListView,
    OrderDetailView,
    ShopOwnerOrderListView,
    UpdateOrderStatusView,
)

urlpatterns = [
    path('checkout/', CheckoutView.as_view(), name='order-checkout'),
    path('my-orders/', CustomerOrderListView.as_view(), name='customer-orders'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('admin/all/', ShopOwnerOrderListView.as_view(), name='shopowner-orders'),
    path('admin/<int:pk>/status/', UpdateOrderStatusView.as_view(), name='shopowner-order-status'),
]
