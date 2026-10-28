"""
Universal AI Document Analyzer
================================
Text cleaning and normalization utilities.

Applies conservative cleaning — preserve document meaning,
only remove clear noise artifacts.
"""

import re
import logging

logger = logging.getLogger(__name__)


def clean_text(raw_text: str) -> str:
    """
    Clean OCR-extracted text while preserving document semantics.

    Steps:
        1. Normalize Unicode characters
        2. Fix line breaks (collapse excessive newlines)
        3. Remove repeated whitespace / spaces
        4. Remove null bytes and control characters
        5. Lightly normalize punctuation spacing
        6. Strip leading/trailing whitespace per line
        7. Remove lines that are purely OCR noise (single chars, etc.)

    Args:
        raw_text: Raw text from OCR engine.

    Returns:
        Cleaned text string.
    """
    if not raw_text or not raw_text.strip():
        return ""

    text = raw_text

    # 1. Normalize unicode — replace common lookalike characters
    text = text.replace("\u2019", "'").replace("\u2018", "'")
    text = text.replace("\u201c", '"').replace("\u201d", '"')
    text = text.replace("\u2013", "-").replace("\u2014", "-")
    text = text.replace("\u00a0", " ")   # Non-breaking space → regular space
    text = text.replace("\u200b", "")    # Zero-width space → remove
    text = text.replace("\ufeff", "")    # BOM → remove

    # 2. Remove null bytes and control characters (except \n, \t)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # 3. Normalize Windows line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # 4. Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 5. Remove excessive inline spaces (3+ spaces → single space)
    text = re.sub(r"[ \t]{3,}", " ", text)

    # 5b. Separate glued words from PDF/OCR layout breaks (e.g., "modelEDUCATION" -> "model EDUCATION", "8.42PROJECTS" -> "8.42 PROJECTS")
    text = re.sub(r"([a-z0-9])([A-Z][a-z])", r"\1 \2", text)
    text = re.sub(r"([a-z0-9])([A-Z]{2,})", r"\1 \2", text)

    # 6. Strip each line and remove lines that are purely noise:
    #    - Empty lines (kept for paragraph spacing)
    #    - Lines with only repeated punctuation (e.g., "-----", "=====")
    #    - Lines with only a single non-word character
    cleaned_lines = []
    for line in text.split("\n"):
        stripped = line.strip()

        # Keep empty lines (they represent paragraph breaks)
        if stripped == "":
            cleaned_lines.append("")
            continue

        # Remove lines that are only repeated symbols (OCR borders/dividers)
        if re.fullmatch(r"[-=_*#|~.+]{3,}", stripped):
            continue

        # Remove lines that are single isolated characters (common OCR noise)
        if len(stripped) == 1 and not stripped.isalpha():
            continue

        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)

    # 7. Final collapse of excess newlines introduced by removals
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def normalize_whitespace(text: str) -> str:
    """
    Collapse all whitespace into single spaces.
    Used when preparing text for embedding (not display).

    Args:
        text: Input text.

    Returns:
        Single-line normalized text.
    """
    return re.sub(r"\s+", " ", text).strip()


def remove_ocr_artifacts(text: str) -> str:
    """
    Remove common EasyOCR-specific artifacts.

    - Stray single digits on their own line (often page number noise)
    - Repeated identical tokens (OCR stuttering)
    - Lines with very high symbol-to-character ratio

    Args:
        text: Cleaned text.

    Returns:
        Further cleaned text.
    """
    lines = text.split("\n")
    filtered = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            filtered.append("")
            continue

        # Skip lines that are only digits (likely page numbers from OCR)
        if re.fullmatch(r"\d{1,4}", stripped):
            continue

        # Skip lines with very high ratio of non-alphanumeric characters
        alpha_count = sum(1 for c in stripped if c.isalnum())
        if len(stripped) > 3 and alpha_count / len(stripped) < 0.2:
            continue

        filtered.append(line)

    return "\n".join(filtered)


def full_clean_pipeline(raw_text: str) -> str:
    """
    Full text cleaning pipeline applied to every extracted document.

    Pipeline:
        raw_text → clean_text → remove_ocr_artifacts → strip

    Args:
        raw_text: Raw OCR output.

    Returns:
        Final clean text.
    """
    text = clean_text(raw_text)
    text = remove_ocr_artifacts(text)
    return text.strip()
