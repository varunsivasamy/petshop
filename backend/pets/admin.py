from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Breed, Pet, PetImage


class PetImageInline(admin.TabularInline):
    model = PetImage
    extra = 1
    fields = ('image', 'is_primary', 'content_hash', 'file_size_bytes', 'preview')
    readonly_fields = ('content_hash', 'file_size_bytes', 'preview')

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />', obj.image.url)
        return "No image"


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'breed', 'price', 'is_available', 'is_featured', 'image_thumbnail', 'created_at')
    list_filter = ('category', 'is_available', 'is_featured', 'gender', 'size', 'is_vaccinated')
    search_fields = ('name', 'description', 'breed__name')
    inlines = [PetImageInline]
    ordering = ('-created_at',)

    def image_thumbnail(self, obj):
        img_url = obj.primary_image_url
        if img_url:
            return format_html('<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" />', img_url)
        return "No Image"
    image_thumbnail.short_description = 'Photo'


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(Breed)
class BreedAdmin(admin.ModelAdmin):
    list_display = ('name', 'category')
    list_filter = ('category',)
    search_fields = ('name',)


@admin.register(PetImage)
class PetImageAdmin(admin.ModelAdmin):
    list_display = ('pet', 'is_primary', 'content_hash', 'file_size_bytes', 'created_at')
    list_filter = ('is_primary',)
    search_fields = ('pet__name', 'content_hash')
