"""Strichcode → Produktname. Gemerkte Codes kommen aus dem eigenen Speicher (extras.barcodes), sonst wird
Open Food Facts gefragt – gesendet wird nur der Code, ohne Konto. Abschaltbar: Haushalt-Einstellung
automation["barcode_lookup"] = False (dann nur eigene Codes)."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN

OFF_URL = "https://world.openfoodfacts.org/api/v2/product/{code}.json?fields=product_name,product_name_de,product_name_en,brands,quantity,generic_name"
USER_AGENT = "SmartLists-HomeAssistant/1.0 (https://github.com/m3m0rex/ha_smartlists)"


async def async_lookup(hass: HomeAssistant, code: str) -> dict[str, Any]:
    extras = hass.data[DOMAIN]["extras"]
    learning = hass.data[DOMAIN]["learning"]
    if code in extras.barcodes:
        hit = extras.barcodes[code]
        return {"code": code, "found": True, "source": "memory", **{k: hit.get(k) for k in ("name", "brand", "quantity")}}
    if learning.automation.get("barcode_lookup") is False:
        return {"code": code, "found": False, "source": "off"}
    try:
        session = async_get_clientsession(hass)
        async with session.get(OFF_URL.format(code=code), headers={"User-Agent": USER_AGENT}, timeout=8) as resp:
            data = await resp.json(content_type=None) if resp.status == 200 else {}
    except Exception:  # noqa: BLE001 – offline / Zeitüberschreitung
        return {"code": code, "found": False, "source": "error"}
    product = (data or {}).get("product") or {}
    lang = (hass.config.language or "en").split("-")[0]
    name = (product.get(f"product_name_{lang}") or product.get("product_name") or product.get("generic_name") or "").strip()
    if not name:
        return {"code": code, "found": False, "source": "openfoodfacts"}
    info = {"name": name[:80], "brand": (product.get("brands") or "").split(",")[0].strip()[:40] or None,
            "quantity": (product.get("quantity") or "").strip()[:20] or None}
    extras.remember_barcode(code, info)
    return {"code": code, "found": True, "source": "openfoodfacts", **info}
