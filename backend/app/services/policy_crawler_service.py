import ipaddress
import logging
import re
import socket
from typing import Dict, Any, Optional
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup
from app.core.exceptions import InvalidInputException, InvalidURLException

logger = logging.getLogger(__name__)

# Common private and loopback networks to prevent SSRF
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

# Browser-like headers to avoid being blocked by anti-bot filters on legitimate policy pages
DEFAULT_REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

MAX_POLICY_CHARS = 16000


class PolicyCrawlerService:
    """Safely validates, fetches, and extracts readable privacy policy text from web URLs."""

    @staticmethod
    def is_url(text: str) -> bool:
        """Determines whether the provided input string is a web URL rather than raw policy text."""
        if not text:
            return False
        clean = text.strip()
        # If text contains newlines, multiple lines, or excessive spaces, it's pasted text
        if "\n" in clean or "\r" in clean:
            return False

        # Explicit scheme check
        if re.match(r"^https?://[^\s]+$", clean, re.IGNORECASE):
            return True

        # Common domain patterns without scheme, e.g. "policies.google.com/privacy", "example.org/privacy-policy"
        # Must not contain spaces and must have a valid domain structure
        if not re.search(r"\s", clean) and re.match(
            r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)+(/[^\s]*)?$",
            clean,
        ):
            return True

        return False

    @staticmethod
    def normalize_url(raw_url: str) -> str:
        """Ensures the URL has a valid http/https scheme and is trimmed."""
        clean = (raw_url or "").strip()
        if not clean:
            raise InvalidInputException("Please enter a website URL or policy text to evaluate.")
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+\-.]*://", clean):
            clean = f"https://{clean}"
        return clean

    @classmethod
    def validate_safe_url(cls, raw_url: str) -> str:
        """
        Validates URL structure and performs SSRF protection:
        Ensures scheme is http/https and destination host is not a private, loopback, or metadata address.
        """
        normalized = cls.normalize_url(raw_url)
        try:
            parsed = urlparse(normalized)
        except Exception:
            raise InvalidURLException("Please enter a valid web address (e.g., https://example.com/privacy).")

        if parsed.scheme not in ("http", "https"):
            raise InvalidURLException("Only HTTP and HTTPS web addresses are supported.")

        hostname = (parsed.hostname or "").strip().lower()
        if not hostname or "." not in hostname:
            raise InvalidURLException("Please enter a valid web address with a complete domain name.")

        # Prohibit localhost or single-word hosts
        if hostname in ("localhost", "127.0.0.1", "::1", "metadata.google.internal"):
            raise InvalidInputException("Requests to internal or local network addresses are prohibited for security.")

        # Check for direct IP addresses
        try:
            ip = ipaddress.ip_address(hostname)
            for network in PRIVATE_NETWORKS:
                if ip in network:
                    raise InvalidInputException("Requests to internal or private network addresses are prohibited for security.")
        except ValueError:
            # It is a domain name; resolve DNS to check resolved IPs against SSRF
            try:
                addr_info = socket.getaddrinfo(hostname, None)
                for entry in addr_info:
                    ip_str = entry[4][0]
                    resolved_ip = ipaddress.ip_address(ip_str)
                    for network in PRIVATE_NETWORKS:
                        if resolved_ip in network:
                            raise InvalidInputException(
                                "The specified domain resolves to a private or restricted network address."
                            )
            except socket.gaierror:
                raise InvalidInputException(
                    f"Could not connect to '{hostname}'. Please check the web address or paste the policy text manually."
                )
            except InvalidInputException:
                raise
            except Exception as e:
                logger.warning(f"DNS check warning for {hostname}: {e}")

        return normalized

    @classmethod
    async def fetch_and_extract_policy(cls, target_url: str) -> Dict[str, Any]:
        """
        Safely fetches the HTML content of the target URL and extracts readable privacy policy text.
        Handles automated request blocks, unreachable hosts, and invalid content with clear user-facing messages.
        """
        safe_url = cls.validate_safe_url(target_url)

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(12.0, connect=6.0),
                follow_redirects=True,
                max_redirects=5,
                headers=DEFAULT_REQUEST_HEADERS,
            ) as client:
                response = await client.get(safe_url)
        except httpx.ConnectTimeout:
            raise InvalidInputException(
                "Connection timed out while reaching the website. The server may be slow or blocking automated access. "
                "Please copy and paste the policy text manually."
            )
        except httpx.ReadTimeout:
            raise InvalidInputException(
                "The website took too long to return content. Please copy and paste the privacy policy text manually."
            )
        except (httpx.ConnectError, httpx.NetworkError):
            raise InvalidInputException(
                f"Could not connect to the website at '{safe_url}'. The domain might be unreachable or down. "
                "Please verify the web address or paste the policy text manually."
            )
        except httpx.RequestError as exc:
            raise InvalidInputException(
                f"Failed to fetch webpage ({type(exc).__name__}). Please copy and paste the privacy policy text manually."
            )

        # Handle HTTP error status codes
        if response.status_code in (401, 403):
            raise InvalidInputException(
                "This website blocked automated access (HTTP 403 Forbidden). "
                "Please open the page in your browser, copy the privacy terms, and paste them manually below."
            )
        elif response.status_code == 429:
            raise InvalidInputException(
                "This website rate-limited automated requests (HTTP 429). "
                "Please copy and paste the privacy policy text manually below."
            )
        elif response.status_code in (404, 410):
            raise InvalidInputException(
                f"Privacy policy page was not found at this URL (HTTP {response.status_code}). "
                "Please verify the exact web address or paste the policy text manually."
            )
        elif response.status_code >= 500:
            raise InvalidInputException(
                f"The target website returned a server error (HTTP {response.status_code}). "
                "Please copy and paste the privacy policy text manually."
            )
        elif response.status_code != 200:
            raise InvalidInputException(
                f"Received unexpected response (HTTP {response.status_code}) from website. "
                "Please copy and paste the policy text manually."
            )

        # Validate content type (must be HTML or plain text)
        content_type = response.headers.get("content-type", "").lower()
        if content_type and not any(ct in content_type for ct in ("text/html", "application/xhtml", "text/plain")):
            raise InvalidInputException(
                f"The URL returned non-webpage content ({content_type.split(';')[0]}). "
                "Please provide a webpage link or paste the policy text manually."
            )

        html_content = response.text
        if not html_content or len(html_content.strip()) < 50:
            raise InvalidInputException(
                "The website returned an empty page. Please copy and paste the privacy policy text manually."
            )

        # Parse with BeautifulSoup and extract readable text
        extracted_text, page_title = cls._extract_policy_text_from_html(html_content)

        if not extracted_text or len(extracted_text) < 100 or len(extracted_text.split()) < 20:
            raise InvalidInputException(
                "Could not extract readable privacy policy terms from this page. "
                "The page may rely on dynamic JavaScript or require login. "
                "Please copy the policy terms from your browser and paste them directly into the box below."
            )

        return {
            "policy_text": extracted_text[:MAX_POLICY_CHARS],
            "source_url": str(response.url),
            "page_title": page_title,
            "char_count": len(extracted_text),
        }

    @staticmethod
    def _extract_policy_text_from_html(html: str) -> tuple[str, str]:
        """Cleans and isolates readable textual content from an HTML document."""
        soup = BeautifulSoup(html, "html.parser")

        # Extract title
        page_title = ""
        if soup.title and soup.title.string:
            page_title = soup.title.string.strip()

        # Remove irrelevant, structural, or interactive tags
        unwanted_tags = [
            "script", "style", "noscript", "header", "footer", "nav", "aside",
            "svg", "form", "iframe", "button", "input", "select", "textarea",
            "dialog", "menu", "canvas", "video", "audio", "map", "track"
        ]
        for tag in soup.find_all(unwanted_tags):
            tag.decompose()

        # Try to locate specific content/policy containers first
        content_container = None
        selectors = [
            "main", "article", "[role='main']",
            ".privacy-policy", ".privacy", ".policy-content", "#privacy-policy",
            "#policy", ".legal-content", ".legal", ".terms-content", ".entry-content",
            ".content-area", "#content", ".container"
        ]
        for sel in selectors:
            candidate = soup.select_one(sel)
            if candidate and len(candidate.get_text(strip=True)) >= 300:
                content_container = candidate
                break

        target_element = content_container or soup.body or soup

        # Extract text separated by newlines
        raw_text = target_element.get_text(separator="\n", strip=True)

        # Post-process: clean up excessive spacing and blank lines
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in raw_text.splitlines()]
        # Filter out empty or trivially short UI noise lines (e.g., cookie banners, single punctuation)
        filtered_lines = [l for l in lines if l]
        cleaned_text = "\n\n".join(filtered_lines)

        return cleaned_text, page_title


policy_crawler_service = PolicyCrawlerService()
