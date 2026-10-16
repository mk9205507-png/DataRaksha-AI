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
        user_id = str(record.get("user_id") or "")
        # For local demo accounts, avoid inserting to Supabase table to prevent foreign key errors with profiles
        if not self._client or user_id.startswith("00000000-0000-0000-0000-") or "demo" in user_id:
            logger.debug(f"[Mock DB] Saved scan for user {user_id}: {record.get('scan_type')}")
            return record

        try:
            res = self._client.table("scan_history").insert(record).execute()
            return res.data[0] if res.data else None
        except Exception as e:
            logger.error(f"Failed to persist scan history: {e}")
            return None

    async def get_user_scans(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieves past scan entries for authenticated user."""
        if not self._client or str(user_id).startswith("00000000-0000-0000-0000-") or "demo" in str(user_id):
            return [
                {
                    "id": "demo-sc-1",
                    "user_id": user_id,
                    "scan_type": "message",
                    "input_preview": "URGENT: Your State Bank account has been suspended...",
                    "risk_level": "High",
                    "risk_score": 88,
                    "summary": "Phishing urgency cues and banking impersonation detected.",
                    "created_at": "2026-10-16T10:00:00Z",
                }
            ]

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

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches the user's extended profile from public.profiles."""
        if not self._client:
            return None

        try:
            res = (
                self._client.table("profiles")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )
            return res.data if res else None
        except Exception as e:
            logger.warning(f"Could not fetch profile for user {user_id}: {e}")
            return None


supabase_service = SupabaseService()

