"""
Universal AI Document Analyzer
================================
OCR Service using EasyOCR.

Architecture:
    Document File (PDF / Image)
         ↓
    PDF pages → Images  (pdf_processor)
         ↓
    EasyOCR reader.readtext()
         ↓
    Raw text per page
         ↓
    Text cleaning  (text_cleaner)
         ↓
    Structured OCR result

NOTE:
    We use the pretrained EasyOCR model (english language).
    No model training is performed here.
"""

import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.document_processing.text_cleaner import full_clean_pipeline
from app.document_processing.pdf_processor import pdf_to_images, extract_text_from_pdf_direct
from app.document_processing.image_processor import load_image, preprocess_image_for_ocr, image_to_numpy

logger = logging.getLogger(__name__)

# ── EasyOCR singleton ─────────────────────────────────────────────────────────
# EasyOCR reader is expensive to initialize (downloads models on first run).
# We keep a single instance for the application lifetime.
_ocr_reader = None


def get_ocr_reader():
    """
    Return the EasyOCR reader singleton.
    Initializes on first call (lazy loading).

    Returns:
        easyocr.Reader instance.

    Raises:
        RuntimeError: If EasyOCR cannot be imported or initialized.
    """
    global _ocr_reader
    if _ocr_reader is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR reader (first call — may download models)...")
            # gpu=False ensures CPU compatibility for all environments
            _ocr_reader = easyocr.Reader(["en"], gpu=False)
            logger.info("EasyOCR reader ready.")
        except ImportError:
            raise RuntimeError(
                "EasyOCR is not installed. Run: pip install easyocr"
            )
        except Exception as e:
            raise RuntimeError(f"Failed to initialize EasyOCR: {e}")
    return _ocr_reader


def run_ocr_on_image(image_array) -> str:
    """
    Run EasyOCR on a single image (NumPy array).

    Args:
        image_array: NumPy array in HWC RGB format.

    Returns:
        Extracted text as a single joined string.
    """
    reader = get_ocr_reader()
    try:
        results = reader.readtext(image_array, detail=0, paragraph=True)
        text = " ".join(results)
        return text
    except Exception as e:
        logger.error(f"OCR failed on image: {e}")
        return ""


def process_image_file(file_path: str) -> Dict[str, Any]:
    """
    Extract text from a single image file (JPG, JPEG, PNG).

    Args:
        file_path: Path to the image file.

    Returns:
        Dict with keys: filename, pages, extracted_text, success, error
    """
    filename = Path(file_path).name
    logger.info(f"Processing image: {filename}")

    result = {
        "filename": filename,
        "file_path": file_path,
        "pages": 1,
        "page_texts": [],
        "extracted_text": "",
        "success": False,
        "error": None,
    }

    # Load and preprocess image
    pil_image = load_image(file_path)
    if pil_image is None:
        result["error"] = f"Could not load image file: {filename}"
        return result

    try:
        preprocessed = preprocess_image_for_ocr(pil_image)
        img_array = image_to_numpy(preprocessed)
    except Exception as e:
        result["error"] = f"Image preprocessing failed: {e}"
        return result

    # Run OCR
    raw_text = run_ocr_on_image(img_array)
    if not raw_text.strip():
        result["error"] = "OCR produced no text. The image may be blank or unreadable."
        return result

    # Clean text
    cleaned = full_clean_pipeline(raw_text)
    result["page_texts"] = [{"page": 1, "text": cleaned}]
    result["extracted_text"] = cleaned
    result["success"] = True

    logger.info(f"  Image OCR done | chars: {len(cleaned)}")
    return result


def process_pdf_file(file_path: str) -> Dict[str, Any]:
    """
    Extract text from a PDF file (scanned or text-based).

    Strategy:
        1. Try direct PyPDF2 text extraction first.
        2. For each page — if direct text is substantial (>50 chars), use it.
        3. Otherwise, convert page to image and run EasyOCR.

    Args:
        file_path: Path to the PDF file.

    Returns:
        Dict with keys: filename, pages, extracted_text, page_texts, success, error
    """
    filename = Path(file_path).name
    logger.info(f"Processing PDF: {filename}")

    result = {
        "filename": filename,
        "file_path": file_path,
        "pages": 0,
        "page_texts": [],
        "extracted_text": "",
        "success": False,
        "error": None,
    }

    # Step 1: Direct text extraction
    direct_pages = extract_text_from_pdf_direct(file_path)
    total_pages = len(direct_pages)
    result["pages"] = total_pages

    if total_pages == 0:
        result["error"] = "PDF could not be read. It may be corrupted or password-protected."
        return result

    # Step 2: Convert PDF pages to images for OCR
    pdf_images = pdf_to_images(file_path, dpi=200)

    all_page_texts = []
    combined_text_parts = []

    for page_num, direct_text in direct_pages:
        page_result = {"page": page_num, "text": ""}

        # Decide: use direct text or OCR
        if len(direct_text.strip()) > 50:
            # Text-based PDF page — use direct extraction
            cleaned = full_clean_pipeline(direct_text)
            page_result["text"] = cleaned
            page_result["source"] = "direct"
            logger.debug(f"  Page {page_num}: direct extraction ({len(cleaned)} chars)")
        else:
            # Scanned page — use OCR
            img_index = page_num - 1
            if img_index < len(pdf_images):
                try:
                    preprocessed = preprocess_image_for_ocr(pdf_images[img_index])
                    img_array = image_to_numpy(preprocessed)
                    raw_ocr = run_ocr_on_image(img_array)
                    cleaned = full_clean_pipeline(raw_ocr)
                    page_result["text"] = cleaned
                    page_result["source"] = "ocr"
                    logger.debug(f"  Page {page_num}: OCR ({len(cleaned)} chars)")
                except Exception as e:
                    logger.warning(f"  Page {page_num}: OCR failed — {e}")
                    page_result["source"] = "failed"
            else:
                logger.warning(f"  Page {page_num}: no image available for OCR")
                page_result["source"] = "missing"

        all_page_texts.append(page_result)
        if page_result["text"]:
            combined_text_parts.append(page_result["text"])

    result["page_texts"] = all_page_texts
    result["extracted_text"] = "\n\n".join(combined_text_parts)
    result["success"] = len(combined_text_parts) > 0

    if not result["success"]:
        result["error"] = "No text could be extracted from any page of this PDF."

    logger.info(
        f"  PDF done | pages: {total_pages} | "
        f"chars: {len(result['extracted_text'])}"
    )
    return result


def process_document(file_path: str) -> Dict[str, Any]:
    """
    Universal document processor entry point.

    Detects file type and delegates to the appropriate processor.

    Args:
        file_path: Path to PDF or image file.

    Returns:
        Structured extraction result dict.
    """
    ext = Path(file_path).suffix.lower().lstrip(".")

    if ext == "pdf":
        return process_pdf_file(file_path)
    elif ext in {"jpg", "jpeg", "png"}:
        return process_image_file(file_path)
    else:
        return {
            "filename": Path(file_path).name,
            "file_path": file_path,
            "pages": 0,
            "page_texts": [],
            "extracted_text": "",
            "success": False,
            "error": f"Unsupported file type: .{ext}. Supported: pdf, jpg, jpeg, png",
        }
