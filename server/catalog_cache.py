"""In-process cache for the public catalog response."""
import threading
import time

TTL = 60
_lock = threading.RLock()
_entry = None


def invalidate():
    global _entry
    with _lock:
        _entry = None


def get(build, source=None):
    global _entry
    with _lock:
        if _entry is None or _entry[3] is not source or time.monotonic() - _entry[0] >= TTL:
            version, payload = build()
            _entry = (time.monotonic(), version, payload, source)
        return _entry[1], _entry[2]
