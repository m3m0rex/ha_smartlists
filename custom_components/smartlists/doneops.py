"""Schon verarbeitete Änderungen der Karte merken.

Die Karte gibt jeder Änderung (Artikel anlegen, ändern, löschen) eine Kennung mit. Reißt die Verbindung ab, nachdem
Home Assistant die Änderung ausgeführt hat, aber bevor die Antwort ankam, sendet die Karte sie später noch einmal –
ohne diesen Merker gäbe es den Artikel dann doppelt. Mit Merker bekommt die Wiederholung einfach die Antwort von
damals. Nur im Arbeitsspeicher: nach einem Neustart von Home Assistant ist er leer.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Awaitable, Callable
from typing import Any

_FAILED = object()


class DoneOps:
    """Merker je (Benutzer, Kennung) → Ergebnis; läuft dieselbe Änderung gerade, wartet die Wiederholung darauf."""

    def __init__(self, ttl: float = 24 * 3600, limit: int = 500) -> None:
        self.ttl, self.limit = ttl, limit
        self._ops: dict[Any, tuple[float, asyncio.Future[Any]]] = {}

    def __len__(self) -> int:
        return len(self._ops)

    async def run(self, key: Any, call: Callable[[], Awaitable[Any]]) -> Any:
        now = time.monotonic()
        hit = self._ops.get(key)
        if hit is not None and now - hit[0] < self.ttl:
            previous = await hit[1]
            if previous is not _FAILED:
                return previous
        future: asyncio.Future[Any] = asyncio.get_running_loop().create_future()
        self._ops[key] = (now, future)
        self._prune(now)
        try:
            result = await call()
        except BaseException:
            # fehlgeschlagen: nicht merken, damit ein neuer Versuch wirklich ausgeführt wird
            if self._ops.get(key, (0, None))[1] is future:
                del self._ops[key]
            future.set_result(_FAILED)
            raise
        future.set_result(result)
        return result

    def _prune(self, now: float) -> None:
        for key in [k for k, (at, _) in self._ops.items() if now - at >= self.ttl]:
            del self._ops[key]
        while len(self._ops) > self.limit:
            del self._ops[next(iter(self._ops))]
