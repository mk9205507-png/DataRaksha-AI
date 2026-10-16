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
        self._mock_scans: Dict[str, List[Dict[str, Any]]] = {}

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
        import uuid
        from datetime import datetime, timezone
        if "id" not in record:
            record["id"] = str(uuid.uuid4())
        if "created_at" not in record:
            record["created_at"] = datetime.now(timezone.utc).isoformat()
        self._mock_scans.setdefault(user_id, []).insert(0, record)

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

    async def get_user_scans(
        self,
        user_id: str,
        scan_type: Optional[str] = None,
        risk_level: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """Retrieves past scan entries for authenticated user with pagination and filtering."""
        user_id_str = str(user_id)
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str in self._mock_scans:
            user_records = self._mock_scans.get(user_id_str, [])
            if not user_records and ("demo" in user_id_str or user_id_str.startswith("00000000-0000-0000-0000-")):
                user_records = [
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
            filtered = [
                r for r in user_records
                if (not scan_type or r.get("scan_type") == scan_type)
                and (not risk_level or r.get("risk_level") == risk_level)
            ]
            offset = max(0, (page - 1) * limit)
            paginated = filtered[offset : offset + limit]
            return {
                "total_records": len(filtered),
                "page": page,
                "limit": limit,
                "records": paginated,
            }

        try:
            query = (
                self._client.table("scan_history")
                .select("*", count="exact")
                .eq("user_id", user_id)
            )
            if scan_type:
                query = query.eq("scan_type", scan_type)
            if risk_level:
                query = query.eq("risk_level", risk_level)

            offset = max(0, (page - 1) * limit)
            res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            total_count = res.count if hasattr(res, "count") and res.count is not None else len(res.data or [])
            return {
                "total_records": total_count,
                "page": page,
                "limit": limit,
                "records": res.data or [],
            }
        except Exception as e:
            logger.error(f"Failed to query scan history: {e}")
            return {"total_records": 0, "page": page, "limit": limit, "records": []}

    async def delete_user_scan(self, user_id: str, scan_id: str) -> bool:
        """Deletes a specific scan record belonging to the authenticated user."""
        user_id_str = str(user_id)
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str in self._mock_scans:
            user_records = self._mock_scans.get(user_id_str, [])
            before_len = len(user_records)
            self._mock_scans[user_id_str] = [r for r in user_records if r.get("id") != scan_id]
            return len(self._mock_scans[user_id_str]) < before_len or scan_id == "demo-sc-1"

        try:
            res = (
                self._client.table("scan_history")
                .delete()
                .eq("id", scan_id)
                .eq("user_id", user_id)
                .execute()
            )
            return len(res.data) > 0 if res.data else True
        except Exception as e:
            logger.error(f"Failed to delete scan record {scan_id}: {e}")
            return False

    async def clear_user_scans(self, user_id: str) -> int:
        """Deletes all scan records for the authenticated user."""
        user_id_str = str(user_id)
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str in self._mock_scans:
            count = len(self._mock_scans.get(user_id_str, []))
            self._mock_scans[user_id_str] = []
            return count

        try:
            res = self._client.table("scan_history").delete().eq("user_id", user_id).execute()
            return len(res.data) if res.data else 0
        except Exception as e:
            logger.error(f"Failed to clear scan history for {user_id}: {e}")
            return 0

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

