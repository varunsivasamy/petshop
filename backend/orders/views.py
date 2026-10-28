"""
Order Views: HTTP endpoints handling checkout, fulfillment, and history.
"""

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import OperationalError
from drf_spectacular.utils import extend_schema

from .models import Order
from .serializers import (
    OrderDetailSerializer,
    OrderListSerializer,
    CheckoutInputSerializer,
    OrderStatusUpdateSerializer,
)
from .services import OrderService, PetUnavailableException
from accounts.permissions import IsShopOwner


class CheckoutView(APIView):
    """
    Atomic multi-user checkout endpoint.
    Protected by Pessimistic Locking to guarantee zero overselling.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=CheckoutInputSerializer, responses={201: OrderDetailSerializer})
    def post(self, request):
        serializer = CheckoutInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = OrderService()
        try:
            order = service.process_checkout(
                customer=request.user,
                shipping_data={
                    'recipient_name': serializer.validated_data['recipient_name'],
                    'shipping_address': serializer.validated_data['shipping_address'],
                    'shipping_city': serializer.validated_data['shipping_city'],
                    'shipping_postal_code': serializer.validated_data['shipping_postal_code'],
                    'shipping_phone': serializer.validated_data['shipping_phone'],
                    'delivery_notes': serializer.validated_data.get('delivery_notes', ''),
                },
                items_data=serializer.validated_data['items'],
                payment_method=serializer.validated_data['payment_method'],
            )
        except PetUnavailableException as e:
            return Response({"detail": str(e.detail)}, status=status.HTTP_409_CONFLICT)
        except OperationalError:
            return Response(
                {"detail": "This pet is currently being acquired by another customer. Please choose another pet or try again."},
                status=status.HTTP_409_CONFLICT
            )

        response_serializer = OrderDetailSerializer(order, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class CustomerOrderListView(generics.ListAPIView):
    """Customer views their own order adoption history."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).order_by('-created_at')


class OrderDetailView(generics.RetrieveAPIView):
    """View details of a specific order."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_shop_owner:
            return Order.objects.all()
        return Order.objects.filter(customer=user)


class ShopOwnerOrderListView(generics.ListAPIView):
    """Shop Owner inspects all customer orders."""
    permission_classes = [permissions.IsAuthenticated, IsShopOwner]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        service = OrderService()
        filters = {}
        for key in ['status', 'payment_status', 'search']:
            val = self.request.query_params.get(key)
            if val:
                filters[key] = val
        return service.order_repository.list_with_filters(filters)


class UpdateOrderStatusView(APIView):
    """Shop Owner updates fulfillment workflow for an order."""
    permission_classes = [permissions.IsAuthenticated, IsShopOwner]

    @extend_schema(request=OrderStatusUpdateSerializer, responses={200: OrderDetailSerializer})
    def patch(self, request, pk):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = OrderService()
        order = service.update_order_status(
            order_id=pk,
            user=request.user,
            new_status=serializer.validated_data['status'],
            tracking_number=serializer.validated_data.get('tracking_number')
        )

        return Response(OrderDetailSerializer(order, context={'request': request}).data)
