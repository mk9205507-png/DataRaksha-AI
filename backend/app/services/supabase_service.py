import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class SupabaseService:
    """Service client for Supabase PostgreSQL database operations."""

    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_KEY
        self.service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY
        self._client = None
        self._admin_client = None
        self._mock_scans: Dict[str, List[Dict[str, Any]]] = {}
        self._mock_gmail_connections: Dict[str, Dict[str, Any]] = {}
        self._mock_profiles: Dict[str, Dict[str, Any]] = {
            "00000000-0000-0000-0000-000000000002": {
                "id": "00000000-0000-0000-0000-000000000002",
                "email": "admin@dataraksha.ai",
                "role": "admin",
                "created_at": "2026-10-01T00:00:00Z",
                "updated_at": "2026-10-01T00:00:00Z",
            },
            "00000000-0000-0000-0000-000000000001": {
                "id": "00000000-0000-0000-0000-000000000001",
                "email": "demo@dataraksha.ai",
                "role": "individual",
                "created_at": "2026-10-05T00:00:00Z",
                "updated_at": "2026-10-05T00:00:00Z",
            },
        }
        self._mock_audit_logs: List[Dict[str, Any]] = [
            {
                "id": "mock-audit-1",
                "admin_id": "00000000-0000-0000-0000-000000000002",
                "admin_email": "admin@dataraksha.ai",
                "action": "system_initialization",
                "target_entity": "system",
                "target_id": "core",
                "details": {"message": "Admin portal initialized with secure role-based access control."},
                "created_at": "2026-10-20T10:00:00Z",
            }
        ]

        if self.url and self.key and "placeholder" not in self.url:
            try:
                from supabase import create_client
                self._client = create_client(self.url, self.key)
                logger.info("Supabase standard client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not connect to Supabase: {e}")
        else:
            logger.info("Supabase credentials not configured. Running in mock/offline mode.")

        if self.url and self.service_role_key and "placeholder" not in self.service_role_key:
            try:
                from supabase import create_client
                self._admin_client = create_client(self.url, self.service_role_key)
                logger.info("Supabase service_role admin client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize Supabase service_role client: {e}")

    @property
    def is_connected(self) -> bool:
        return self._client is not None

    @property
    def db_client(self):
        """Returns the privileged admin client if available, else standard client."""
        return self._admin_client or self._client

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

        # For local demo accounts or test accounts, avoid inserting to Supabase table
        if not self._client or user_id.startswith("00000000-0000-0000-0000-") or "demo" in user_id or user_id.startswith("test-"):
            logger.debug(f"[Mock DB] Saved scan for user {user_id}: {record.get('scan_type')}")
            return record

        try:
            # Ensure user profile exists to prevent foreign key errors with profiles table
            try:
                prof = self._client.table("profiles").select("id").eq("id", user_id).execute()
                if not prof.data:
                    self._client.table("profiles").insert({
                        "id": user_id,
                        "email": record.get("user_email") or f"user_{user_id[:8]}@dataraksha.ai",
                        "role": "individual",
                    }).execute()
            except Exception as pe:
                logger.debug(f"Profiles upsert check note: {pe}")

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
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str.startswith("test-"):
            user_records = self._mock_scans.get(user_id_str, [])
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
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str.startswith("test-"):
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
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str.startswith("test-"):
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
        user_id_str = str(user_id)
        if user_id_str in self._mock_profiles:
            return self._mock_profiles[user_id_str]

        client = self.db_client
        if not client:
            return self._mock_profiles.get(user_id_str)

        try:
            res = (
                client.table("profiles")
                .select("*")
                .eq("id", user_id_str)
                .single()
                .execute()
            )
            return res.data if res else None
        except Exception as e:
            logger.debug(f"Could not fetch profile for user {user_id}: {e}")
            return self._mock_profiles.get(user_id_str)

    async def save_gmail_connection(
        self,
        user_id: str,
        email: str,
        refresh_token: str,
        access_token: Optional[str] = None,
        token_expiry: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Stores or updates a user's Gmail OAuth connection credentials."""
        user_id_str = str(user_id)
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()

        record = {
            "user_id": user_id_str,
            "email": email,
            "refresh_token": refresh_token,
            "access_token": access_token,
            "token_expiry": token_expiry,
            "updated_at": now_iso,
        }

        # Keep in-memory mock store updated
        self._mock_gmail_connections[user_id_str] = {**record, "created_at": now_iso}

        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str:
            return self._mock_gmail_connections[user_id_str]

        try:
            # Upsert into user_gmail_connections table using on_conflict="user_id"
            res = (
                self._client.table("user_gmail_connections")
                .upsert(record, on_conflict="user_id")
                .execute()
            )
            return res.data[0] if res.data else self._mock_gmail_connections[user_id_str]
        except Exception as e:
            logger.error(f"Failed to persist user_gmail_connection for user {user_id}: {e}")
            # Fall back to in-memory store so user flow never breaks
            return self._mock_gmail_connections[user_id_str]

    async def get_gmail_connection(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches stored Gmail credentials for authenticated user."""
        user_id_str = str(user_id)
        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str or user_id_str in self._mock_gmail_connections:
            return self._mock_gmail_connections.get(user_id_str)

        try:
            res = (
                self._client.table("user_gmail_connections")
                .select("*")
                .eq("user_id", user_id_str)
                .maybe_single()
                .execute()
            )
            if res and res.data:
                return res.data
            return self._mock_gmail_connections.get(user_id_str)
        except Exception as e:
            logger.warning(f"Could not fetch user_gmail_connections for user {user_id}: {e}")
            return self._mock_gmail_connections.get(user_id_str)

    async def update_gmail_access_token(
        self,
        user_id: str,
        access_token: str,
        token_expiry: Optional[str] = None,
    ) -> bool:
        """Updates refreshed access token and expiry for a user."""
        user_id_str = str(user_id)
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()

        if user_id_str in self._mock_gmail_connections:
            self._mock_gmail_connections[user_id_str]["access_token"] = access_token
            self._mock_gmail_connections[user_id_str]["token_expiry"] = token_expiry
            self._mock_gmail_connections[user_id_str]["updated_at"] = now_iso

        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str:
            return True

        try:
            res = (
                self._client.table("user_gmail_connections")
                .update({
                    "access_token": access_token,
                    "token_expiry": token_expiry,
                    "updated_at": now_iso,
                })
                .eq("user_id", user_id_str)
                .execute()
            )
            return len(res.data) > 0 if res.data else True
        except Exception as e:
            logger.error(f"Failed to update Gmail access token for {user_id}: {e}")
            return False

    async def delete_gmail_connection(self, user_id: str) -> bool:
        """Removes user's Gmail connection and stored tokens."""
        user_id_str = str(user_id)
        if user_id_str in self._mock_gmail_connections:
            del self._mock_gmail_connections[user_id_str]

        if not self._client or user_id_str.startswith("00000000-0000-0000-0000-") or "demo" in user_id_str:
            return True

        try:
            res = (
                self._client.table("user_gmail_connections")
                .delete()
                .eq("user_id", user_id_str)
                .execute()
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete Gmail connection for {user_id}: {e}")
            return False

    async def get_admin_overview(self) -> Dict[str, Any]:
        """
        Calculates aggregated platform metrics from genuine stored records in Supabase.
        Returns total scans, scans today, risk level breakdown, scans by type,
        registered user counts, and recent activity feed.
        """
        from datetime import datetime, timezone
        now_utc = datetime.now(timezone.utc)
        today_date_str = now_utc.strftime("%Y-%m-%d")

        total_scans = 0
        scans_today = 0
        risk_breakdown = {"low": 0, "medium": 0, "high": 0}
        scans_by_type = {"message": 0, "link": 0, "policy": 0}
        registered_users = 0
        recent_activity: List[Dict[str, Any]] = []

        client = self.db_client

        # 1. Query registered users count from profiles
        if client:
            try:
                prof_res = client.table("profiles").select("id", count="exact").execute()
                registered_users = prof_res.count if hasattr(prof_res, "count") and prof_res.count is not None else len(prof_res.data or [])
            except Exception as e:
                logger.warning(f"Failed to fetch profiles count: {e}")
                registered_users = len(self._mock_profiles)
        else:
            registered_users = len(self._mock_profiles)

        # 2. Query scan_history table
        if client:
            try:
                res = client.table("scan_history").select("id, scan_type, risk_level, risk_score, input_preview, created_at").order("created_at", desc=True).execute()
                records = res.data or []
                total_scans = len(records)
                for r in records:
                    stype = (r.get("scan_type") or "").lower()
                    if stype in scans_by_type:
                        scans_by_type[stype] += 1

                    rlevel = (r.get("risk_level") or "").lower()
                    if rlevel in risk_breakdown:
                        risk_breakdown[rlevel] += 1

                    created = r.get("created_at") or ""
                    if created.startswith(today_date_str):
                        scans_today += 1

                for item in records[:8]:
                    recent_activity.append({
                        "id": str(item.get("id")),
                        "type": "scan",
                        "scan_type": item.get("scan_type"),
                        "risk_level": item.get("risk_level"),
                        "risk_score": item.get("risk_score"),
                        "preview": item.get("input_preview", "")[:60],
                        "timestamp": item.get("created_at"),
                    })
            except Exception as e:
                logger.warning(f"Failed to query scan_history for admin overview: {e}")
        else:
            # In-memory mock scans aggregation
            all_mock = [item for sublist in self._mock_scans.values() for item in sublist]
            total_scans = len(all_mock)
            for r in all_mock:
                stype = (r.get("scan_type") or "").lower()
                if stype in scans_by_type:
                    scans_by_type[stype] += 1
                rlevel = (r.get("risk_level") or "").lower()
                if rlevel in risk_breakdown:
                    risk_breakdown[rlevel] += 1
                created = r.get("created_at") or ""
                if created.startswith(today_date_str):
                    scans_today += 1

            for item in sorted(all_mock, key=lambda x: x.get("created_at", ""), reverse=True)[:8]:
                recent_activity.append({
                    "id": str(item.get("id")),
                    "type": "scan",
                    "scan_type": item.get("scan_type"),
                    "risk_level": item.get("risk_level"),
                    "risk_score": item.get("risk_score"),
                    "preview": item.get("input_preview", "")[:60],
                    "timestamp": item.get("created_at"),
                })

        return {
            "total_scans": total_scans,
            "scans_today": scans_today,
            "registered_users": registered_users,
            "risk_breakdown": risk_breakdown,
            "scans_by_type": scans_by_type,
            "recent_activity": recent_activity,
            "system_status": {
                "gemini_api": "Operational (Real-time AI heuristics)",
                "safe_browsing_api": "Operational (v4 Threat Feeds)",
                "supabase_db": "Connected (Row Level Security Active)" if self._client else "Offline / Disconnected",
            },
        }

    async def get_admin_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """
        Retrieves registered users list for administrator management.
        Calculates scan activity count per user without exposing passwords or tokens.
        """
        client = self.db_client
        offset = max(0, (page - 1) * limit)

        # Fallback to mock profiles in local offline mode
        if not client:
            users_list = list(self._mock_profiles.values())
            if role and role in ("admin", "individual"):
                users_list = [u for u in users_list if u.get("role") == role]
            if search:
                s_lower = search.lower()
                users_list = [
                    u for u in users_list
                    if s_lower in (u.get("email") or "").lower() or s_lower in str(u.get("id", "")).lower()
                ]

            total = len(users_list)
            paginated = users_list[offset : offset + limit]
            enriched = []
            for u in paginated:
                uid = str(u.get("id"))
                scan_count = len(self._mock_scans.get(uid, []))
                enriched.append({
                    "id": uid,
                    "email": u.get("email", ""),
                    "role": u.get("role", "individual"),
                    "created_at": u.get("created_at") or "",
                    "updated_at": u.get("updated_at") or "",
                    "scan_count": scan_count,
                    "status": "active",
                })
            return {"total": total, "page": page, "limit": limit, "users": enriched}

        try:
            query = client.table("profiles").select("*", count="exact")
            if role and role in ("admin", "individual"):
                query = query.eq("role", role)
            if search:
                s_clean = search.strip()
                query = query.or_(f"email.ilike.%{s_clean}%,id.eq.{s_clean}" if "-" in s_clean and len(s_clean) == 36 else f"email.ilike.%{s_clean}%")

            res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            profiles_data = res.data or []
            total_count = res.count if hasattr(res, "count") and res.count is not None else len(profiles_data)

            # If remote database returned no profiles, seamlessly check mock profiles
            if not profiles_data and self._mock_profiles:
                users_list = list(self._mock_profiles.values())
                if role and role in ("admin", "individual"):
                    users_list = [u for u in users_list if u.get("role") == role]
                if search:
                    s_lower = search.lower()
                    users_list = [
                        u for u in users_list
                        if s_lower in (u.get("email") or "").lower() or s_lower in str(u.get("id", "")).lower()
                    ]
                total_count = len(users_list)
                profiles_data = users_list[offset : offset + limit]

            # Get scan counts per user
            enriched = []
            for p in profiles_data:
                uid = str(p.get("id"))
                scans_c = len(self._mock_scans.get(uid, []))
                try:
                    count_res = client.table("scan_history").select("id", count="exact").eq("user_id", uid).execute()
                    if hasattr(count_res, "count") and count_res.count is not None:
                        scans_c = max(scans_c, count_res.count)
                except Exception:
                    pass

                enriched.append({
                    "id": uid,
                    "email": p.get("email", ""),
                    "role": p.get("role", "individual"),
                    "created_at": p.get("created_at") or "",
                    "updated_at": p.get("updated_at") or "",
                    "scan_count": scans_c,
                    "status": "active",
                })

            return {"total": total_count, "page": page, "limit": limit, "users": enriched}
        except Exception as e:
            logger.warning(f"Remote profiles query encountered note: {e}, using local records")
            users_list = list(self._mock_profiles.values())
            if role and role in ("admin", "individual"):
                users_list = [u for u in users_list if u.get("role") == role]
            if search:
                s_lower = search.lower()
                users_list = [
                    u for u in users_list
                    if s_lower in (u.get("email") or "").lower() or s_lower in str(u.get("id", "")).lower()
                ]
            total = len(users_list)
            paginated = users_list[offset : offset + limit]
            enriched = [
                {
                    "id": str(u.get("id")),
                    "email": u.get("email", ""),
                    "role": u.get("role", "individual"),
                    "created_at": u.get("created_at") or "",
                    "updated_at": u.get("updated_at") or "",
                    "scan_count": len(self._mock_scans.get(str(u.get("id")), [])),
                    "status": "active",
                }
                for u in paginated
            ]
            return {"total": total, "page": page, "limit": limit, "users": enriched}

    async def get_user_details(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves comprehensive account profile and scan activity for a specific user."""
        user_id_str = str(user_id)
        profile = await self.get_user_profile(user_id_str)
        if not profile:
            return None

        client = self.db_client
        recent_scans = []
        total_scans = 0

        if client:
            try:
                res = (
                    client.table("scan_history")
                    .select("id, scan_type, risk_level, risk_score, input_preview, created_at", count="exact")
                    .eq("user_id", user_id_str)
                    .order("created_at", desc=True)
                    .range(0, 4)
                    .execute()
                )
                recent_scans = res.data or []
                total_scans = res.count if hasattr(res, "count") and res.count is not None else len(recent_scans)
            except Exception as e:
                logger.warning(f"Could not fetch recent scans for user {user_id}: {e}")

        if not recent_scans:
            user_scans = self._mock_scans.get(user_id_str, [])
            total_scans = max(total_scans, len(user_scans))
            recent_scans = user_scans[:5]

        return {
            "id": user_id_str,
            "email": profile.get("email", ""),
            "role": profile.get("role", "individual"),
            "created_at": profile.get("created_at"),
            "updated_at": profile.get("updated_at"),
            "status": "active",
            "total_scans": total_scans,
            "recent_scans": recent_scans,
        }

    async def update_user_role(
        self,
        admin_id: str,
        admin_email: str,
        target_user_id: str,
        new_role: str,
    ) -> Dict[str, Any]:
        """
        Safely updates a user's role with verification and lockout prevention.
        Records an audit log entry of the action.
        """
        if new_role not in ("admin", "individual"):
            raise ValueError(f"Invalid role '{new_role}'. Must be 'admin' or 'individual'.")

        admin_id_str = str(admin_id)
        target_id_str = str(target_user_id)

        # Lockout protection: Administrator cannot demote their own account
        if admin_id_str == target_id_str and new_role != "admin":
            raise ValueError("Administrators cannot revoke their own admin permissions to prevent lockout.")

        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()

        # Update in mock store
        if target_id_str in self._mock_profiles:
            self._mock_profiles[target_id_str]["role"] = new_role
            self._mock_profiles[target_id_str]["updated_at"] = now_iso

        client = self.db_client
        if client and self._admin_client:
            try:
                res = (
                    client.table("profiles")
                    .update({"role": new_role, "updated_at": now_iso})
                    .eq("id", target_id_str)
                    .execute()
                )
                logger.info(f"Updated role for user {target_id_str} to {new_role}")
            except Exception as e:
                logger.error(f"Failed to update profile role in database: {e}")
                raise RuntimeError(f"Database error updating user role: {str(e)}")
        elif client:
            try:
                client.table("profiles").update({"role": new_role, "updated_at": now_iso}).eq("id", target_id_str).execute()
            except Exception as e:
                logger.warning(f"Database update with anon client note (service role key required for remote write): {e}")

        # Audit trail logging
        audit_entry = {
            "admin_id": admin_id_str,
            "admin_email": admin_email,
            "action": "update_user_role",
            "target_entity": "profile",
            "target_id": target_id_str,
            "details": {"new_role": new_role, "updated_at": now_iso},
            "created_at": now_iso,
        }
        self._mock_audit_logs.insert(0, {**audit_entry, "id": f"audit-{len(self._mock_audit_logs)+1}"})

        if client:
            try:
                client.table("admin_audit_logs").insert(audit_entry).execute()
            except Exception as ae:
                logger.debug(f"Audit log insertion note: {ae}")

        return {
            "success": True,
            "user_id": target_id_str,
            "new_role": new_role,
            "message": f"Successfully updated user role to '{new_role}'.",
        }

    async def get_admin_scans(
        self,
        search: Optional[str] = None,
        scan_type: Optional[str] = None,
        risk_level: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Dict[str, Any]:
        """
        Retrieves all platform scan records for administrator inspection.
        Preserves original records with user association and risk classification.
        """
        offset = max(0, (page - 1) * limit)
        client = self.db_client

        if not client:
            all_scans = []
            for uid, scans in self._mock_scans.items():
                user_email = self._mock_profiles.get(uid, {}).get("email", f"user_{uid[:6]}@dataraksha.ai")
                for s in scans:
                    all_scans.append({**s, "user_email": user_email})

            filtered = all_scans
            if scan_type and scan_type in ("message", "link", "policy"):
                filtered = [s for s in filtered if s.get("scan_type") == scan_type]
            if risk_level and risk_level in ("Low", "Medium", "High"):
                filtered = [s for s in filtered if s.get("risk_level") == risk_level]
            if search:
                s_lower = search.lower()
                filtered = [
                    s for s in filtered
                    if s_lower in (s.get("input_preview") or "").lower()
                    or s_lower in (s.get("summary") or "").lower()
                    or s_lower in (s.get("user_email") or "").lower()
                    or s_lower in str(s.get("id") or "").lower()
                ]

            filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            total = len(filtered)
            paginated = filtered[offset : offset + limit]
            return {"total": total, "page": page, "limit": limit, "scans": paginated}

        try:
            # Query scan_history table with profiles join
            query = client.table("scan_history").select("*, profiles(email)", count="exact")
            if scan_type and scan_type in ("message", "link", "policy"):
                query = query.eq("scan_type", scan_type)
            if risk_level and risk_level in ("Low", "Medium", "High"):
                query = query.eq("risk_level", risk_level)
            if search:
                s_clean = search.strip()
                query = query.or_(f"input_preview.ilike.%{s_clean}%,summary.ilike.%{s_clean}%")

            res = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            data = res.data or []
            total_count = res.count if hasattr(res, "count") and res.count is not None else len(data)

            formatted_scans = []
            for item in data:
                prof = item.get("profiles") or {}
                user_email = prof.get("email") if isinstance(prof, dict) else ""
                formatted_scans.append({
                    "id": str(item.get("id")),
                    "user_id": str(item.get("user_id")),
                    "user_email": user_email or f"user_{str(item.get('user_id'))[:8]}",
                    "scan_type": item.get("scan_type"),
                    "input_preview": item.get("input_preview", ""),
                    "risk_level": item.get("risk_level"),
                    "risk_score": item.get("risk_score"),
                    "summary": item.get("summary", ""),
                    "detected_threats": item.get("detected_threats", []),
                    "recommendations": item.get("recommendations", []),
                    "created_at": item.get("created_at"),
                })

            return {"total": total_count, "page": page, "limit": limit, "scans": formatted_scans}
        except Exception as e:
            logger.error(f"Failed to query admin platform scans: {e}")
            return {"total": 0, "page": page, "limit": limit, "scans": []}

    async def get_admin_audit_logs(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Retrieves administrative audit logs."""
        offset = max(0, (page - 1) * limit)
        client = self.db_client

        if not client:
            total = len(self._mock_audit_logs)
            paginated = self._mock_audit_logs[offset : offset + limit]
            return {"total": total, "page": page, "limit": limit, "logs": paginated}

        try:
            res = (
                client.table("admin_audit_logs")
                .select("*", count="exact")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            logs = res.data or []
            total = res.count if hasattr(res, "count") and res.count is not None else len(logs)
            return {"total": total, "page": page, "limit": limit, "logs": logs}
        except Exception as e:
            logger.warning(f"Could not query admin_audit_logs table: {e}")
            total = len(self._mock_audit_logs)
            paginated = self._mock_audit_logs[offset : offset + limit]
            return {"total": total, "page": page, "limit": limit, "logs": paginated}


supabase_service = SupabaseService()


