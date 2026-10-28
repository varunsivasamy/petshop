"""
Orders Serializers: Checkout request validation and order fulfillment representations.
"""

from rest_framework import serializers
from .models import Order, OrderItem
from pets.serializers import PetListSerializer
from accounts.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    pet_image_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'pet', 'pet_name', 'unit_price', 'quantity', 'subtotal', 'pet_image_url']

    def get_pet_image_url(self, obj):
        if obj.pet:
            primary = obj.pet.images.filter(is_primary=True).first() or obj.pet.images.first()
            if primary and primary.image:
                request = self.context.get('request')
                return request.build_absolute_uri(primary.image.url) if request else primary.image.url
        return None


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'status', 'payment_status',
            'payment_method', 'transaction_id', 'total_amount',
            'recipient_name', 'shipping_address', 'shipping_city',
            'shipping_postal_code', 'shipping_phone', 'delivery_notes',
            'tracking_number', 'items', 'created_at', 'updated_at'
        ]


class OrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer_email', 'status', 'payment_status',
            'payment_method', 'total_amount', 'recipient_name',
            'items_count', 'created_at'
        ]


class CheckoutItemInputSerializer(serializers.Serializer):
    pet_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)


class CheckoutInputSerializer(serializers.Serializer):
    items = CheckoutItemInputSerializer(many=True)
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices,
        default=Order.PaymentMethod.CARD
    )
    recipient_name = serializers.CharField(max_length=150)
    shipping_address = serializers.CharField(max_length=255)
    shipping_city = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_phone = serializers.CharField(max_length=20)
    delivery_notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    tracking_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
