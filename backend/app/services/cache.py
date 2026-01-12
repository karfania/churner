import time
from typing import Any, Optional


class SimpleCache:
    def __init__(self):
        # key -> (value, expire_ts)
        self._store = {}

    def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if not item:
            return None
        value, expire_ts = item
        if expire_ts is not None and time.time() > expire_ts:
            try:
                del self._store[key]
            except KeyError:
                pass
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        expire_ts = time.time() + ttl if ttl is not None else None
        self._store[key] = (value, expire_ts)

    def invalidate(self, key: str):
        try:
            del self._store[key]
        except KeyError:
            pass
