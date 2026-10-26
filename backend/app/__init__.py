"""DataRaksha AI Backend Application Package"""
__version__ = "1.0.0"


def __getattr__(name: str):
    if name == "app":
        from main import app as _fastapi_app
        return _fastapi_app
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
