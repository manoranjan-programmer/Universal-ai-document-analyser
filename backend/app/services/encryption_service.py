"""
Universal AI Document Analyzer
================================
Document Encryption Service.
Provides AES symmetric encryption (Fernet: AES-128-CBC + HMAC-SHA256)
to store documents in MongoDB in encrypted form and decrypt them upon retrieval.
"""

import base64
import hashlib
import json
import logging
from typing import Any, Dict, Optional
from cryptography.fernet import Fernet
from app.config import get_settings

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Encrypts and decrypts document payloads using authenticated symmetric encryption.
    """

    def __init__(self, key: Optional[str] = None):
        settings = get_settings()
        raw_key = key or settings.document_encryption_key or "universal-ai-document-analyzer-secret-encryption-key"
        # Derive a consistent 32-byte urlsafe-base64 key via SHA-256
        key_digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
        fernet_key = base64.urlsafe_b64encode(key_digest)
        self.cipher = Fernet(fernet_key)
        logger.info("🔐 EncryptionService initialized with authenticated AES (Fernet).")

    def encrypt_dict(self, data: Dict[str, Any]) -> str:
        """
        Serialize a Python dictionary to JSON and encrypt it.

        Args:
            data: Dictionary containing document metadata, text, etc.

        Returns:
            Encrypted ciphertext as an ASCII string.
        """
        json_bytes = json.dumps(data, default=str).encode("utf-8")
        encrypted_bytes = self.cipher.encrypt(json_bytes)
        return encrypted_bytes.decode("ascii")

    def decrypt_dict(self, token: str) -> Dict[str, Any]:
        """
        Decrypt a ciphertext token back into a Python dictionary.

        Args:
            token: Encrypted ciphertext string.

        Returns:
            Decrypted dictionary.
        """
        decrypted_bytes = self.cipher.decrypt(token.encode("ascii"))
        return json.loads(decrypted_bytes.decode("utf-8"))


_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """Singleton getter for EncryptionService."""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service
