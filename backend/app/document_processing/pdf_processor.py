"""
Universal AI Document Analyzer
================================
PDF document processor.

Handles:
    - PDF → per-page image conversion (using pdf2image + Poppler)
    - Fallback: direct text extraction for text-based PDFs (PyPDF2)
    - Multi-page PDF support
"""

import logging
from pathlib import Path
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)


def pdf_to_images(pdf_path: str, dpi: int = 200) -> List:
    """
    Convert each page of a PDF into a PIL Image for OCR.

    Uses pdf2image (which requires Poppler to be installed).
    Falls back gracefully if pdf2image is unavailable.

    Args:
        pdf_path: Path to the PDF file.
        dpi:      Resolution for rasterization (200 DPI is a good balance).

    Returns:
        List of PIL Image objects, one per page.
        Empty list on failure.
    """
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(pdf_path, dpi=dpi)
        logger.info(f"PDF '{pdf_path}' converted: {len(images)} page(s) at {dpi} DPI")
        return images
    except ImportError:
        logger.error(
            "pdf2image not installed. Install with: pip install pdf2image\n"
            "Also ensure Poppler is installed and on PATH."
        )
        return []
    except Exception as e:
        logger.error(f"Failed to convert PDF '{pdf_path}' to images: {e}")
        return []


def extract_text_from_pdf_direct(pdf_path: str) -> List[Tuple[int, str]]:
    """
    Attempt direct text extraction from a text-based (non-scanned) PDF.

    Uses PyPDF2. Returns empty strings for scanned pages.
    Useful as a quick check — if text is found, we can skip OCR for that page.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        List of (page_number, extracted_text) tuples (1-indexed pages).
    """
    results = []
    try:
        import PyPDF2
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page_num, page in enumerate(reader.pages, start=1):
                try:
                    text = page.extract_text() or ""
                    results.append((page_num, text.strip()))
                except Exception as page_err:
                    logger.warning(f"Page {page_num} direct extraction failed: {page_err}")
                    results.append((page_num, ""))
        logger.info(f"Direct PDF text extraction: {len(results)} page(s)")
    except ImportError:
        logger.warning("PyPDF2 not installed — skipping direct text extraction.")
    except Exception as e:
        logger.error(f"Direct PDF extraction failed for '{pdf_path}': {e}")

    return results


def get_pdf_page_count(pdf_path: str) -> int:
    """
    Return the number of pages in a PDF.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        Number of pages (0 on failure).
    """
    try:
        import PyPDF2
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            return len(reader.pages)
    except Exception as e:
        logger.error(f"Could not get page count for '{pdf_path}': {e}")
        return 0
