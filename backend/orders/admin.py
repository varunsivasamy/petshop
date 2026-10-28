from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ('pet_name', 'quantity', 'unit_price', 'subtotal')
    readonly_fields = ('pet_name', 'quantity', 'unit_price', 'subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'recipient_name', 'total_amount', 'status', 'payment_status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'customer__email', 'recipient_name', 'tracking_number')
    inlines = [OrderItemInline]
    ordering = ('-created_at',)
