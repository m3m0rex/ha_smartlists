"""Konstanten für SmartLists."""

from __future__ import annotations

DOMAIN = "smartlists"

# Unter-Eintrag-Typ für kombinierte Listen
SUBENTRY_COMBINED = "combined_list"
# Unter-Eintrag-Typ für eigene Listen (mit Besitzer und Freigaben, siehe own.py)
SUBENTRY_OWN = "own_list"
# Aus der Migration: unique_id der Entität vor 1.2 (damit entity_id gleich bleibt)
LEGACY_UNIQUE_ID = "legacy_unique_id"

CONF_SOURCES = "sources"
CONF_DEFAULT_ADD = "default_add_entity"
CONF_MODE = "mode"
CONF_SOURCE_LABEL = "source_label"
CONF_SORT = "sort"
CONF_FOREIGN = "foreign_entities"
# Herkunft als Person werten: Artikel aus todo.peter bekommen das Badge 👤 Peter (wie *Peter)
CONF_SOURCE_AS_PERSON = "source_as_person"
# Kombinierte Liste, die aus der App übernommen wurde: Gerät + Listen-Id der App (Entität hängt am Handy-Gerät)
CONF_APP_DEVICE = "app_device"
CONF_APP_LIST = "app_list"

# Abhaken wirkt sich aus auf …
MODE_BIDIRECTIONAL = "bidirectional"  # … die Ursprungsliste (Standard)
MODE_LOCAL = "local"  # … nur diese kombinierte Liste

# Herkunft im Artikelnamen anzeigen
LABEL_NONE = "none"
LABEL_SUFFIX = "suffix"
LABEL_PREFIX = "prefix"

# Sortierung
SORT_SOURCE = "source"  # Reihenfolge der Quell-Listen, innerhalb wie in der Quelle
SORT_ALPHABETICAL = "alphabetical"
SORT_STATUS = "status"  # offene zuerst, dann alphabetisch
SORT_CATEGORY = "category"  # nach Einkaufs-Kategorie (Obst & Gemüse, Kühlung, …)

UID_SEPARATOR = "::"
STORAGE_VERSION = 1

# Gemerkte Kategorien / Tag-Regeln haben sich geändert → Listen neu sortieren
SIGNAL_LEARNING_CHANGED = f"{DOMAIN}_learning_changed"
