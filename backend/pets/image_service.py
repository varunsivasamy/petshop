"""
Image Optimization & Server-Side Storage Service.
Adheres to Single Responsibility Principle and Bandwidth Conservation requirements.
"""

import hashlib
import os
from io import BytesIO
from typing import Dict, Any, Tuple
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpResponse, HttpResponseNotModified
from common.interfaces import IImageOptimizationService


class ImageOptimizationService(IImageOptimizationService):
    """
    Handles server-side validation, dimension constraints, compression,
    and HTTP caching headers (ETag, Cache-Control).
    """

    MAX_DIMENSION = 1600
    IMAGE_QUALITY = 85

    def process_and_hash(self, uploaded_file) -> Dict[str, Any]:
        """
        Processes an uploaded image file:
        - Validates format
        - Resizes if oversized while preserving aspect ratio
        - Computes SHA256 content hash for server deduplication and client local caching
        """
        image = Image.open(uploaded_file)
        
        # Convert RGBA/Palette to RGB if necessary for JPEG/WebP
        if image.mode in ('RGBA', 'P') and uploaded_file.name.lower().endswith(('.jpg', '.jpeg')):
            image = image.convert('RGB')

        # Resize if dimensions exceed threshold
        orig_width, orig_height = image.size
        if max(orig_width, orig_height) > self.MAX_DIMENSION:
            image.thumbnail((self.MAX_DIMENSION, self.MAX_DIMENSION), Image.Resampling.LANCZOS)

        # Save to buffer
        output_buffer = BytesIO()
        image_format = image.format or 'JPEG'
        image.save(output_buffer, format=image_format, quality=self.IMAGE_QUALITY, optimize=True)
        output_buffer.seek(0)
        
        content = output_buffer.getvalue()
        content_hash = hashlib.sha256(content).hexdigest()

        # Wrap back into Django UploadedFile
        optimized_file = InMemoryUploadedFile(
            file=output_buffer,
            field_name=uploaded_file.field_name if hasattr(uploaded_file, 'field_name') else 'image',
            name=uploaded_file.name,
            content_type=uploaded_file.content_type,
            size=len(content),
            charset=None
        )

        return {
            'file': optimized_file,
            'content_hash': content_hash,
            'file_size': len(content),
            'width': image.width,
            'height': image.height,
        }

    def get_cache_headers(self, content_hash: str) -> Dict[str, str]:
        """
        Returns aggressive immutable cache headers so clients cache locally
        and do not re-request the same image repeatedly.
        """
        return {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': f'"{content_hash}"',
            'Vary': 'Accept-Encoding',
        }

    @staticmethod
    def handle_conditional_cache(request, content_hash: str) -> bool:
        """
        Returns True if client already has this image cached locally (ETag match),
        allowing view to return HTTP 304 Not Modified.
        """
        if_none_match = request.headers.get('If-None-Match')
        if if_none_match:
            clean_etags = [tag.strip(' "') for tag in if_none_match.split(',')]
            if content_hash in clean_etags:
                return True
        return False
