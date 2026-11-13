"""Strichcode → Produktname.

Reihenfolge: zuerst der eigene Speicher (schon einmal gefundene Codes), dann die im Haushalt gewählten
Dienste nacheinander (Einstellung automation["barcode_providers"], Standard: Open Food Facts). Gesendet wird
immer nur der Code, ohne Konto. barcode_lookup = False → nur eigener Speicher.

Eigener Dienst: automation["barcode_custom_url"] mit {code}, z. B. https://example.org/api/{code}, und
automation["barcode_custom_field"] = Pfad zum Namen in der JSON-Antwort, z. B. "product.title" oder
"items.0.title".
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN

USER_AGENT = "SmartLists-HomeAssistant/1.0 (https://github.com/m3m0rex/ha_smartlists)"
_OFF_FIELDS = "product_name,product_name_{lang},generic_name,brands,quantity"
PROVIDERS: dict[str, dict[str, str]] = {
    # Familie Open Food Facts: gleiche Schnittstelle, verschiedene Datenbanken
    "off": {"name": "Open Food Facts", "url": "https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=" + _OFF_FIELDS},
    "obf": {"name": "Open Beauty Facts", "url": "https://world.openbeautyfacts.org/api/v2/product/{code}.json?fields=" + _OFF_FIELDS},
    "opff": {"name": "Open Pet Food Facts", "url": "https://world.openpetfoodfacts.org/api/v2/product/{code}.json?fields=" + _OFF_FIELDS},
    "opf": {"name": "Open Products Facts", "url": "https://world.openproductsfacts.org/api/v2/product/{code}.json?fields=" + _OFF_FIELDS},
    # UPCitemdb: frei ohne Konto, begrenzt auf ca. 100 Abfragen am Tag
    "upcitemdb": {"name": "UPCitemdb", "url": "https://api.upcitemdb.com/prod/trial/lookup?upc={code}"},
    "custom": {"name": "custom", "url": ""},
}
DEFAULT_PROVIDERS = ["off"]


def _path(data: Any, path: str) -> Any:
    for part in [p for p in path.split(".") if p]:
        if isinstance(data, list) and part.isdigit():
            data = data[int(part)] if int(part) < len(data) else None
        elif isinstance(data, dict):
            data = data.get(part)
        else:
            return None
    return data


def _parse(provider: str, data: Any, lang: str, custom_field: str = "") -> dict[str, Any] | None:
    if provider == "upcitemdb":
        item = (_path(data, "items.0") or {}) if isinstance(data, dict) else {}
        name = str(item.get("title") or "").strip()
        return {"name": name[:80], "brand": (item.get("brand") or "")[:40] or None, "quantity": None} if name else None
    if provider == "custom":
        name = _path(data, custom_field or "name")
        return {"name": str(name).strip()[:80], "brand": None, "quantity": None} if name else None
    product = (data or {}).get("product") or {}
    name = (product.get(f"product_name_{lang}") or product.get("product_name") or product.get("generic_name") or "").strip()
    if not name:
        return None
    return {"name": name[:80], "brand": (product.get("brands") or "").split(",")[0].strip()[:40] or None,
            "quantity": (product.get("quantity") or "").strip()[:20] or None}


def providers_info() -> list[dict[str, str]]:
    return [{"id": k, "name": v["name"]} for k, v in PROVIDERS.items()]


async def async_lookup(hass: HomeAssistant, code: str) -> dict[str, Any]:
    extras = hass.data[DOMAIN]["extras"]
    settings = hass.data[DOMAIN]["learning"].automation
    if code in extras.barcodes:
        hit = extras.barcodes[code]
        return {"code": code, "found": True, "source": "memory", **{k: hit.get(k) for k in ("name", "brand", "quantity")}}
    if settings.get("barcode_lookup") is False:
        return {"code": code, "found": False, "source": "off"}
    lang = (hass.config.language or "en").split("-")[0]
    order = [p for p in (settings.get("barcode_providers") or DEFAULT_PROVIDERS) if p in PROVIDERS]
    session = async_get_clientsession(hass)
    for provider in order:
        url = settings.get("barcode_custom_url", "") if provider == "custom" else PROVIDERS[provider]["url"]
        if not url or "{code}" not in url or not url.startswith("https://"):
            continue
        try:
            async with session.get(url.replace("{lang}", lang).replace("{code}", code), headers={"User-Agent": USER_AGENT, "Accept": "application/json"}, timeout=8) as resp:
                data = await resp.json(content_type=None) if resp.status == 200 else None
        except Exception:  # noqa: BLE001 – offline, Zeitüberschreitung, kein JSON
            continue
        info = _parse(provider, data, lang, settings.get("barcode_custom_field", ""))
        if info:
            extras.remember_barcode(code, info)
            return {"code": code, "found": True, "source": provider, **info}
    return {"code": code, "found": False, "source": ",".join(order)}
