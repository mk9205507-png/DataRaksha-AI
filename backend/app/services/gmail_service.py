import base64
import hashlib
import hmac
import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import httpx
from fastapi import HTTPException, status
from app.core.config import settings
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GMAIL_MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages"

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
]


class GmailService:
    """Server-side Gmail API service supporting OAuth 2.0 authorization-code flow with offline access."""

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
        self.state_secret = settings.GMAIL_STATE_SECRET

    def generate_state(self, user_id: str) -> str:
        """
        Creates a tamper-proof signed state token binding the Supabase user ID.
        Format: base64(json({user_id, timestamp})).signature
        """
        payload = {
            "user_id": str(user_id),
            "timestamp": int(datetime.now(timezone.utc).timestamp()),
        }
        raw_json = json.dumps(payload, separators=(",", ":"))
        encoded_data = base64.urlsafe_b64encode(raw_json.encode()).decode().rstrip("=")
        sig = hmac.new(
            self.state_secret.encode(),
            encoded_data.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"{encoded_data}.{sig}"

    def verify_and_extract_state(self, state: str) -> str:
        """
        Verifies state signature and extracts user_id.
        Raises HTTPException 400 on invalid or expired state (valid for 1 hour).
        """
        if not state or "." not in state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth state parameter.",
            )

        encoded_data, sig = state.split(".", 1)
        expected_sig = hmac.new(
            self.state_secret.encode(),
            encoded_data.encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(sig, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OAuth state verification failed. Tampering detected.",
            )

        try:
            # Re-pad base64
            padded = encoded_data + "=" * (-len(encoded_data) % 4)
            data_bytes = base64.urlsafe_b64decode(padded)
            data = json.loads(data_bytes.decode())
            user_id = data.get("user_id")
            timestamp = data.get("timestamp", 0)

            # Check expiration (1 hour window)
            now = int(datetime.now(timezone.utc).timestamp())
            if now - timestamp > 3600:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OAuth session expired. Please restart the Gmail authorization flow.",
                )

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No user ID associated with OAuth state.",
                )

            return user_id
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error parsing OAuth state: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Malformed OAuth state parameter.",
            )

    def get_authorization_url(self, user_id: str) -> str:
        """
        Constructs the Google OAuth 2.0 authorization URL for server-side code flow with offline access.
        Enforces prompt=consent and access_type=offline to guarantee refresh token generation.
        """
        if not self.client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google Client ID is not configured on the server.",
            )

        state = self.generate_state(user_id)
        from urllib.parse import urlencode

        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(GMAIL_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "include_granted_scopes": "true",
            "state": state,
        }
        return f"{GOOGLE_OAUTH_AUTH_URL}?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str, user_id: str) -> Dict[str, Any]:
        """
        Exchanges authorization code with Google for access & refresh tokens,
        retrieves connected Gmail address, and persists refresh token in database.
        """
        if not self.client_id or not self.client_secret:
            if settings.ENVIRONMENT == "development":
                logger.warning(
                    "GOOGLE_CLIENT_SECRET is not configured in backend/.env. Establishing development Gmail preview session."
                )
                mock_email = "connected.user@gmail.com"
                now_iso = datetime.now(timezone.utc).isoformat()
                expiry_iso = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
                await supabase_service.save_gmail_connection(
                    user_id=user_id,
                    email=mock_email,
                    refresh_token="mock_dev_refresh_token",
                    access_token="mock_dev_access_token",
                    token_expiry=expiry_iso,
                )
                return {
                    "user_id": user_id,
                    "email": mock_email,
                    "expires_at": expiry_iso,
                }
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth credentials (client_id / client_secret) are not configured.",
            )

        token_data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_res = await client.post(GOOGLE_OAUTH_TOKEN_URL, data=token_data)
            if not token_res.is_success:
                err_detail = token_res.text
                try:
                    err_json = token_res.json()
                    err_detail = err_json.get("error_description") or err_json.get("error") or err_detail
                except Exception:
                    pass
                logger.error(f"Google token exchange failed: {err_detail}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to exchange authorization code with Google: {err_detail}",
                )

            token_json = token_res.json()
            access_token = token_json.get("access_token")
            refresh_token = token_json.get("refresh_token")
            expires_in = token_json.get("expires_in", 3600)

            # If user already consented in past, Google might omit refresh_token unless prompt=consent was used
            # If omitted, keep existing refresh token from DB if present
            if not refresh_token:
                existing = await supabase_service.get_gmail_connection(user_id)
                if existing and existing.get("refresh_token"):
                    refresh_token = existing.get("refresh_token")
                else:
                    logger.warning("No refresh token returned by Google and none saved in DB.")

            # Fetch connected Google profile email
            gmail_email = ""
            userinfo_res = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_res.is_success:
                userinfo_json = userinfo_res.json()
                gmail_email = userinfo_json.get("email") or ""

            # Expiry timestamp
            expiry_dt = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            expiry_iso = expiry_dt.isoformat()

            # Store in database associated with Supabase user_id
            await supabase_service.save_gmail_connection(
                user_id=user_id,
                email=gmail_email,
                refresh_token=refresh_token or "",
                access_token=access_token,
                token_expiry=expiry_iso,
            )

            logger.info(f"Successfully connected Gmail ({gmail_email}) for user {user_id}")
            return {
                "user_id": user_id,
                "email": gmail_email,
                "expires_at": expiry_iso,
            }

    async def get_valid_access_token(self, user_id: str) -> str:
        """
        Retrieves valid access token for user.
        If expired or close to expiration (<60s), refreshes token using the securely stored refresh token.
        Gracefully handles expired or revoked tokens (e.g. invalid_grant).
        """
        conn = await supabase_service.get_gmail_connection(user_id)
        if not conn or not conn.get("refresh_token"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No Gmail account connected. Please connect your Gmail account.",
            )

        access_token = conn.get("access_token")
        token_expiry_str = conn.get("token_expiry")
        refresh_token = conn.get("refresh_token")

        # Check if existing access token is still fresh
        if access_token and token_expiry_str:
            try:
                expiry_dt = datetime.fromisoformat(token_expiry_str.replace("Z", "+00:00"))
                # If expires in more than 60 seconds, reuse it
                if expiry_dt > datetime.now(timezone.utc) + timedelta(seconds=60):
                    return access_token
            except Exception:
                pass

        # Needs refresh using stored refresh_token
        if not self.client_id or not self.client_secret:
            # If credentials not set on server but we have an access token (e.g. mock dev), return it
            if access_token:
                return access_token
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth client credentials are not configured on the server.",
            )

        refresh_data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(GOOGLE_OAUTH_TOKEN_URL, data=refresh_data)
            if not res.is_success:
                err_body = res.text
                is_invalid_grant = "invalid_grant" in err_body or res.status_code in (400, 401)
                if is_invalid_grant:
                    # Token revoked by user or expired on Google side -> delete from database
                    await supabase_service.delete_gmail_connection(user_id)
                    logger.warning(f"Gmail token was revoked/expired for user {user_id}. Purged connection.")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Your Gmail authorization has expired or was revoked. Please reconnect your account.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to refresh Gmail access token with Google.",
                )

            token_json = res.json()
            new_access_token = token_json.get("access_token")
            expires_in = token_json.get("expires_in", 3600)
            expiry_dt = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            expiry_iso = expiry_dt.isoformat()

            await supabase_service.update_gmail_access_token(
                user_id=user_id,
                access_token=new_access_token,
                token_expiry=expiry_iso,
            )
            return new_access_token

    def _decode_base64_url(self, data_str: str) -> str:
        """Safely decodes Base64URL-encoded email part data from Gmail API."""
        if not data_str:
            return ""
        try:
            padded = data_str + "=" * (-len(data_str) % 4)
            decoded = base64.urlsafe_b64decode(padded)
            return decoded.decode("utf-8", errors="replace")
        except Exception:
            return data_str

    def _extract_body_from_payload(self, payload: Dict[str, Any]) -> str:
        """Extracts readable text content from Gmail message payload parts."""
        if not payload:
            return ""

        # Direct body data
        body_data = payload.get("body", {}).get("data")
        if body_data:
            return self._decode_base64_url(body_data)

        parts = payload.get("parts", [])
        # Prefer text/plain
        for part in parts:
            if part.get("mimeType") == "text/plain" and part.get("body", {}).get("data"):
                return self._decode_base64_url(part["body"]["data"])

        # Fallback to text/html stripped of tags
        for part in parts:
            if part.get("mimeType") == "text/html" and part.get("body", {}).get("data"):
                html_content = self._decode_base64_url(part["body"]["data"])
                # Strip HTML tags
                clean_text = re.sub(r"<[^>]+>", " ", html_content)
                clean_text = re.sub(r"\s+", " ", clean_text).strip()
                return clean_text

        # Nested parts (multipart/alternative inside multipart/mixed)
        for part in parts:
            nested = part.get("parts")
            if nested:
                nested_res = self._extract_body_from_payload(part)
                if nested_res:
                    return nested_res

        return ""

    async def fetch_recent_emails(self, user_id: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """
        Fetches latest INBOX messages for the authenticated user using their valid access token.
        Returns normalized email records with id, subject, sender, date, snippet, and content.
        """
        conn = await supabase_service.get_gmail_connection(user_id)
        if conn and (conn.get("access_token") == "mock_dev_access_token" or not self.client_secret):
            return [
                {
                    "id": "gmail-inbox-01",
                    "thread_id": "thread-01",
                    "subject": "⚠️ Urgent: SBI Account Verification Required",
                    "sender": "security-alert@sbi-online-alerts.xyz",
                    "date": "Today, 10:45 AM",
                    "snippet": "We detected an unauthorized login attempt from an unknown device. Verify your credentials immediately.",
                    "content": "URGENT NOTICE: We detected an unauthorized login attempt to your NetBanking account. Click http://sbi-verification-secure-portal.xyz/login immediately or call +91-9876543210 to verify your Aadhaar, PAN and PIN within 2 hours or your account will be frozen.",
                },
                {
                    "id": "gmail-inbox-02",
                    "thread_id": "thread-02",
                    "subject": "🎁 Congratulations! You have won $1,000,000 in International Rewards",
                    "sender": "payouts@intl-rewards-claim.com",
                    "date": "Yesterday, 3:12 PM",
                    "snippet": "Your email has won 1st prize in the International Mobile Rewards Draw.",
                    "content": "CONGRATULATIONS! Your mobile number won 1st prize of $1,000,000 in the International Mobile Rewards Draw. Claim immediately by emailing payout@reward-payout-online.com with your full legal name, PAN number, and bank account details.",
                },
                {
                    "id": "gmail-inbox-03",
                    "thread_id": "thread-03",
                    "subject": "Sprint Review Sync Today at 3:00 PM",
                    "sender": "team-lead@company-workspace.com",
                    "date": "Yesterday, 11:30 AM",
                    "snippet": "Reminder for our sprint review sync at 3:00 PM via Google Meet.",
                    "content": "Hi Kalyani, please remember our sprint review sync today at 3:00 PM via Google Meet. The project slides and architecture notes have been shared in the team workspace. See you soon!",
                },
            ][:max_results]

        access_token = await self.get_valid_access_token(user_id)

        async with httpx.AsyncClient(timeout=20.0) as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            list_res = await client.get(
                GMAIL_MESSAGES_URL,
                params={"maxResults": max_results, "q": "label:INBOX"},
                headers=headers,
            )

            if list_res.status_code == 401:
                # Token might have been revoked mid-flight
                await supabase_service.delete_gmail_connection(user_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Gmail session is invalid or revoked. Please reconnect your Gmail account.",
                )

            if not list_res.is_success:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Gmail API error: {list_res.text}",
                )

            list_data = list_res.json()
            messages = list_data.get("messages", [])
            if not messages:
                return []

            results = []
            for item in messages:
                msg_id = item.get("id")
                try:
                    detail_res = await client.get(
                        f"{GMAIL_MESSAGES_URL}/{msg_id}",
                        params={"format": "full"},
                        headers=headers,
                    )
                    if not detail_res.is_success:
                        continue
                    msg = detail_res.json()
                    headers_list = msg.get("payload", {}).get("headers", [])
                    header_map = {h.get("name", "").lower(): h.get("value", "") for h in headers_list}

                    subject = header_map.get("subject", "(No Subject)")
                    sender = header_map.get("from", "Unknown Sender")
                    date = header_map.get("date", "")
                    snippet = msg.get("snippet", "")
                    content = self._extract_body_from_payload(msg.get("payload", {})) or snippet

                    results.append({
                        "id": msg_id,
                        "thread_id": msg.get("threadId", ""),
                        "subject": subject,
                        "sender": sender,
                        "date": date,
                        "snippet": snippet,
                        "content": content,
                    })
                except Exception as e:
                    logger.warning(f"Failed to fetch detail for email {msg_id}: {e}")

            return results

    async def disconnect(self, user_id: str) -> bool:
        """
        Disconnects Gmail account for user, revokes token at Google if possible,
        and purges connection records from database.
        """
        conn = await supabase_service.get_gmail_connection(user_id)
        if conn and conn.get("refresh_token"):
            token_to_revoke = conn.get("refresh_token") or conn.get("access_token")
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(
                        GOOGLE_OAUTH_REVOKE_URL,
                        params={"token": token_to_revoke},
                        headers={"Content-Type": "application/x-www-form-urlencoded"},
                    )
            except Exception as e:
                logger.warning(f"Token revocation request to Google failed: {e}")

        return await supabase_service.delete_gmail_connection(user_id)


gmail_service = GmailService()
