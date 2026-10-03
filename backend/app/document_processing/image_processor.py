"""
Universal AI Document Analyzer
================================
Image document processor.

Handles:
    - Direct image files (JPG, JPEG, PNG)
    - Single image → OCR text extraction
"""

import logging
from pathlib import Path
from typing import Optional

from PIL import Image

logger = logging.getLogger(__name__)


def load_image(image_path: str) -> Optional[Image.Image]:
    """
    Load an image from disk using Pillow.

    Args:
        image_path: Absolute or relative path to image file.

    Returns:
        PIL Image object, or None on failure.
    """
    try:
        img = Image.open(image_path).convert("RGB")
        logger.info(f"Loaded image: {image_path} | Size: {img.size}")
        return img
    except Exception as e:
        logger.error(f"Failed to load image '{image_path}': {e}")
        return None


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """
    Preprocess image for better OCR accuracy.

    Steps:
        - Convert to RGB (ensures 3-channel)
        - Resize if image is very small (upscale for OCR readability)

    Args:
        image: PIL Image object.

    Returns:
        Preprocessed PIL Image.
    """
    # Ensure RGB
    image = image.convert("RGB")

    # Upscale small images — EasyOCR performs better on larger images
    min_dimension = 600
    width, height = image.size
    if min(width, height) < min_dimension:
        scale = min_dimension / min(width, height)
        new_size = (int(width * scale), int(height * scale))
        image = image.resize(new_size, Image.LANCZOS)
        logger.debug(f"Upscaled image from {(width, height)} to {new_size}")

    return image


def image_to_numpy(image: Image.Image):
    """
    Convert PIL Image to NumPy array for EasyOCR.

    Args:
        image: PIL Image.

    Returns:
        NumPy array in HWC RGB format.
    """
    import numpy as np
    return np.array(image)
