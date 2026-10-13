from fastapi import HTTPException, status


class DataRakshaException(HTTPException):
    """Base exception for DataRaksha AI application errors."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


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
