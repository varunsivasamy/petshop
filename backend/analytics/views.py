"""
Analytics Views: Aggregated metrics for Shop Owner Admin Dashboard.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from pets.models import Pet, Category
from accounts.permissions import IsShopOwner

User = get_user_model()


class DashboardAnalyticsView(APIView):
    """Provides high-level e-commerce and inventory metrics for the shop owner."""
    permission_classes = [permissions.IsAuthenticated, IsShopOwner]

    def get(self, request):
        # Financial & Sales Metrics
        revenue_data = Order.objects.filter(
            payment_status=Order.PaymentStatus.PAID
        ).aggregate(total_revenue=Sum('total_amount'), total_orders=Count('id'))

        total_revenue = float(revenue_data['total_revenue'] or 0.0)
        total_orders = revenue_data['total_orders'] or 0

        # Pet Inventory Metrics
        total_pets = Pet.objects.filter(is_deleted=False).count()
        available_pets = Pet.objects.filter(is_deleted=False, is_available=True).count()
        adopted_pets = Pet.objects.filter(is_deleted=False, is_available=False).count()

        # Customer & Real User Metrics
        total_customers = User.objects.filter(role=User.Role.CUSTOMER).count()
        verified_customers = User.objects.filter(role=User.Role.CUSTOMER, is_verified=True).count()

        # Breakdown by Category
        category_breakdown = Category.objects.annotate(
            total_count=Count('pets', filter=Q(pets__is_deleted=False)),
            available_count=Count('pets', filter=Q(pets__is_deleted=False, pets__is_available=True)),
            sold_count=Count('pets', filter=Q(pets__is_deleted=False, pets__is_available=False)),
        ).values('name', 'slug', 'total_count', 'available_count', 'sold_count')

        # Recent 5 Orders
        recent_orders = Order.objects.select_related('customer').order_by('-created_at')[:5].values(
            'id', 'order_number', 'customer__email', 'total_amount', 'status', 'created_at'
        )

        return Response({
            'overview': {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'total_pets': total_pets,
                'available_pets': available_pets,
                'adopted_pets': adopted_pets,
                'total_customers': total_customers,
                'verified_customers': verified_customers,
            },
            'category_breakdown': list(category_breakdown),
            'recent_orders': list(recent_orders),
        })
