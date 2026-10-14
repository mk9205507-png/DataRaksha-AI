from fastapi import HTTPException, status


class DataRakshaException(HTTPException):
    """Base exception for DataRaksha AI application errors."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class InvalidInputException(DataRakshaException):
    """Raised when input text is empty or whitespace only (HTTP 400)."""

    def __init__(self, detail: str = "Please enter text or a URL to analyze."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class InvalidURLException(DataRakshaException):
    """Raised when URL structure is invalid or unparseable (HTTP 422)."""

    def __init__(self, detail: str = "Please enter a valid web address (e.g., https://example.com)."):
        super().__init__(status_code=422, detail=detail)


class PayloadTooLargeException(DataRakshaException):
    """Raised when input length exceeds 20,000 characters (HTTP 413)."""

    def __init__(self, detail: str = "Payload exceeds maximum character limit of 20,000."):
        super().__init__(status_code=413, detail=detail)


class RateLimitException(DataRakshaException):
    """Raised when client exceeds request rate threshold (HTTP 429)."""

    def __init__(self, detail: str = "Request limit reached. Please wait a moment."):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


class ServiceUnavailableException(DataRakshaException):
    """Raised when external AI or threat intelligence services are unreachable (HTTP 503)."""

    def __init__(self, detail: str = "Analysis service is temporarily unavailable. Please try again shortly."):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


class ThreatScanException(DataRakshaException):
    """Raised when scan engine fails during analysis."""

    def __init__(self, detail: str = "Threat scan processing failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class ExternalServiceException(DataRakshaException):
    """Raised when an external API (Gemini, Safe Browsing, Supabase) fails."""

    def __init__(self, service: str, detail: str = "External service unavailable"):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"[{service}] {detail}",
        )


class AuthenticationException(DataRakshaException):
    """Raised when authentication credentials or JWT tokens are invalid."""

    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)
