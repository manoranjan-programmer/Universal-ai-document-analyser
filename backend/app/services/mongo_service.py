"""
Universal AI Document Analyzer
================================
MongoDB Service for Encrypted Document Storage.
Handles saving, updating, retrieving, and deleting encrypted documents in MongoDB.
"""

import os
import base64
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.config import get_settings
from app.services.encryption_service import get_encryption_service

logger = logging.getLogger(__name__)


class MongoDocumentStore:
    """
    Manages encrypted document persistence in MongoDB.
    """

    def __init__(self):
        self.settings = get_settings()
        self._client: Optional[MongoClient] = None
        self._db: Optional[Database] = None
        self._collection: Optional[Collection] = None
        self.encryption = get_encryption_service()
        self._connect()

    def _connect(self):
        try:
            self._client = MongoClient(
                self.settings.mongodb_uri,
                serverSelectionTimeoutMS=2000,
            )
            # Ping database to verify connection
            self._client.admin.command("ping")
            self._db = self._client[self.settings.mongodb_db_name]
            self._collection = self._db[self.settings.mongodb_collection]
            logger.info(
                f" Connected to MongoDB at '{self.settings.mongodb_uri}', "
                f"db='{self.settings.mongodb_db_name}', collection='{self.settings.mongodb_collection}'"
            )
        except Exception as e:
            logger.warning(
                f"⚠️ Could not connect to MongoDB at '{self.settings.mongodb_uri}': {e}. "
                f"Falling back to local cache mode."
            )
            self._client = None
            self._db = None
            self._collection = None

    @property
    def is_connected(self) -> bool:
        return self._collection is not None

    def save_encrypted_document(self, doc_id: str, doc_data: Dict[str, Any]) -> bool:
        """
        Encrypt document data (and file content if available and < 12MB)
        and persist into MongoDB.
        """
        if not self.is_connected:
            self._connect()
            if not self.is_connected:
                return False

        try:
            # Prepare payload for encryption
            payload = dict(doc_data)

            # If raw file exists and size < 12MB, embed encrypted raw file bytes as base64
            file_path = payload.get("file_path")
            if file_path and os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                if file_size < 12 * 1024 * 1024:
                    try:
                        with open(file_path, "rb") as f:
                            payload["file_bytes_base64"] = base64.b64encode(f.read()).decode("ascii")
                    except Exception as fe:
                        logger.warning(f"Could not read raw file for embedding in encrypted payload: {fe}")

            # Encrypt the entire document payload
            encrypted_payload = self.encryption.encrypt_dict(payload)

            record = {
                "_id": doc_id,
                "document_id": doc_id,
                "is_encrypted": True,
                "encryption_algorithm": "AES-128-CBC-HMAC-SHA256 (Fernet)",
                "encrypted_payload": encrypted_payload,
                "updated_at": datetime.utcnow().isoformat(),
            }

            self._collection.update_one(
                {"_id": doc_id},
                {"$set": record},
                upsert=True
            )
            logger.info(f"🔒 Document '{doc_id}' stored encrypted in MongoDB.")
            return True
        except Exception as e:
            logger.error(f"Failed to store encrypted document in MongoDB: {e}")
            return False

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve and decrypt a document from MongoDB.
        """
        if not self.is_connected:
            self._connect()
            if not self.is_connected:
                return None

        try:
            record = self._collection.find_one({"_id": doc_id})
            if not record:
                return None

            if record.get("is_encrypted") and "encrypted_payload" in record:
                decrypted = self.encryption.decrypt_dict(record["encrypted_payload"])
                # Remove large file_bytes_base64 from lightweight memory response
                decrypted.pop("file_bytes_base64", None)
                return decrypted
            else:
                record.pop("_id", None)
                return record
        except Exception as e:
            logger.error(f"Failed to retrieve/decrypt document '{doc_id}' from MongoDB: {e}")
            return None

    def get_all_documents(self) -> List[Dict[str, Any]]:
        """
        Retrieve and decrypt all documents from MongoDB.
        """
        if not self.is_connected:
            self._connect()
            if not self.is_connected:
                return []

        docs = []
        try:
            for record in self._collection.find():
                try:
                    if record.get("is_encrypted") and "encrypted_payload" in record:
                        decrypted = self.encryption.decrypt_dict(record["encrypted_payload"])
                        decrypted.pop("file_bytes_base64", None)
                        docs.append(decrypted)
                    else:
                        record.pop("_id", None)
                        docs.append(record)
                except Exception as de:
                    logger.warning(f"Error decrypting document record '{record.get('_id')}': {de}")
            return docs
        except Exception as e:
            logger.error(f"Failed to fetch documents from MongoDB: {e}")
            return []

    def delete_document(self, doc_id: str) -> bool:
        """
        Delete an encrypted document from MongoDB.
        """
        if not self.is_connected:
            self._connect()
            if not self.is_connected:
                return False

        try:
            res = self._collection.delete_one({"_id": doc_id})
            logger.info(f"Deleted document '{doc_id}' from MongoDB (deleted_count={res.deleted_count}).")
            return res.deleted_count > 0
        except Exception as e:
            logger.error(f"Failed to delete document '{doc_id}' from MongoDB: {e}")
            return False


_mongo_store: Optional[MongoDocumentStore] = None


def get_mongo_store() -> MongoDocumentStore:
    """Singleton getter for MongoDocumentStore."""
    global _mongo_store
    if _mongo_store is None:
        _mongo_store = MongoDocumentStore()
    return _mongo_store
