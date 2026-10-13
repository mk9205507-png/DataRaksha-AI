import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service client for Supabase PostgreSQL database operations."""

    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        self._client = None

        if self.url and self.key and "placeholder" not in self.url:
            try:
                from supabase import create_client
                self._client = create_client(self.url, self.key)
                logger.info("Supabase client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}")
        else:
            logger.info("Supabase credentials not configured. Running in mock/offline mode.")

    @property
    def is_connected(self) -> bool:
        return self._client is not None

    async def save_scan_history(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Persists a scan record to scan_history table."""
        if not self._client:
            logger.debug(f"[Mock DB] Saved scan: {record.get('scan_type')}")
            return record

        try:
            res = self._client.table("scan_history").insert(record).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Failed to persist scan history: {e}")
            return None

    async def get_user_scans(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves past scan entries for authenticated user."""
        if not self._client:
            return []

        try:
            res = (
                self._client.table("scan_history")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.error(f"Failed to query scan history: {e}")
            return []

    async def save_letter(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Persists a generated letter record."""
        if not self._client:
            return record

        try:
            res = self._client.table("data_request_letters").insert(record).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Failed to persist letter: {e}")
            return None


supabase_service = SupabaseService()
