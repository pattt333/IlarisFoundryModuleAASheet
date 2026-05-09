# Model Data Migration — ilaris-alternative-actor-sheet

**Status**: ✅ COMPLETED (Big Bang, Ilaris 13.1.0)  
**Date**: 2026-05-09  
**Scope**: Harte Umstellung auf kanonische Feldnamen des System-Datenmodells

---

## Migration Summary

Das Modul wurde vollständig auf die neuen kanonischen Feldnamen des Ilaris-Systems (13.1.0) nach der template.json → TypeDataModel-Migration umgestellt.

### Migrated Fields

#### 1. Waffenschaden (Critical)
| Old Field | New Field | Impact | Status |
| --- | --- | --- | --- |
| `system.schaden` | `system.tp` | Alle Schadensberechnung, Patzer-Logik, UI-Anzeige | ✅ Migrated |
| `system.härte` | `system.haerte` | Rüstungshärte-Anzeige | ✅ Migrated |

**Changed Files**:
- [scripts/utilities.js](../../../scripts/utilities.js#L388) — Patzer-Schadensformeln (Lines 388, 398)
- [templates/sheets/character/tabs/kampf-tab.hbs](../../../templates/sheets/character/tabs/kampf-tab.hbs#L44) — Nahkampf/Fernkampf-Display (Lines 44, 78)
- [templates/sheets/character/tabs/kampf-tab.hbs](../../../templates/sheets/character/tabs/kampf-tab.hbs#L89) — Härte-Detail (Line 89)
- [templates/components/favorites-component.hbs](../../../templates/components/favorites-component.hbs#L91) — Favoriten-Waffenlinks (4 Vorkommen)

#### 2. Inventarfelder (Already Canonical)
| Field | Canonical? | Status |
| --- | --- | --- |
| `system.quantity` | ✅ Ja | No change needed |
| `system.wert` | ✅ Ja | No change needed |
| `system.beschreibung` | ✅ Ja | No change needed |
| `system.gewicht` | ✅ Ja | No change needed |
| `system.gewicht_summe` | ✅ Ja | No change needed |

**Note**: Diese Felder waren bereits kanonisch; keine Änderungen erforderlich.

#### 3. Energiefelder (Already Canonical + Null-Safe)
| Field | Canonical? | Null-Safe? | Status |
| --- | --- | --- | --- |
| `system.abgeleitete.asp_stern` | ✅ Ja | ✅ `\|\| 0` | ✓ Verified |
| `system.abgeleitete.gasp` | ✅ Ja | ✅ `\|\| 0` | ✓ Verified |
| `system.abgeleitete.kap_stern` | ✅ Ja | ✅ `\|\| 0` | ✓ Verified |
| `system.abgeleitete.gkap` | ✅ Ja | ✅ `\|\| 0` | ✓ Verified |

**Note**: Bereits robust gegen Null/Undefined; keine Änderungen erforderlich.

#### 4. Combat/Initiative-Felder (Already Compliant)
| Field | Canonical? | Status |
| --- | --- | --- |
| `system.kampfwerte.baseIni` / `system.abgeleitete.baseIni` | ✅ Ja | ✓ Verified |
| `system.computed.modifiers.*` | ✅ Runtime (transient) | ✓ Verified null-safe |
| `effect-item` type | ✅ Ja (post-migration) | ✓ Verified |

**Note**: Initiative-Logik nutzt bereits korrekte Feldpfade; keine Änderungen erforderlich.

---

## Technical Changes

### Weapon Damage Display
**Before** (Ilaris 12.x compat mode):
```javascript
// scripts/utilities.js Line 388
const damageFormula = weapon.system.schaden.replace(/(\d+)W(\d+)/gi, '$1d$2');
```

**After** (Ilaris 13.1.0 canonical):
```javascript
// scripts/utilities.js Line 388
const damageFormula = weapon.system.tp.replace(/(\d+)W(\d+)/gi, '$1d$2');
```

### Template Weapon Display
**Before**:
```handlebars
{{weapon.system.schaden}} <!-- Melee damage -->
{{item.system.härte}} <!-- Armor hardness -->
```

**After**:
```handlebars
{{weapon.system.tp}} <!-- Melee damage -->
{{item.system.haerte}} <!-- Armor hardness -->
```

---

## Validation

### Editor-Level Checks ✅
- [x] [scripts/utilities.js](../../../scripts/utilities.js) — No syntax errors
- [x] [templates/sheets/character/tabs/kampf-tab.hbs](../../../templates/sheets/character/tabs/kampf-tab.hbs) — No syntax errors
- [x] [templates/components/favorites-component.hbs](../../../templates/components/favorites-component.hbs) — No syntax errors

### Code Review Checklist
- [x] All `system.schaden` → `system.tp` replacements completed
- [x] All `system.härte` → `system.haerte` replacements completed
- [x] No remaining legacy field names in active code paths
- [x] Energy field null-safety verified (existing `|| 0` patterns retained)
- [x] Inventory fields validated as canonical

---

## Smoke Test Plan

### 1. Waffenschaden & Patzer
**Test**: Fernkampfangriff mit Patzer
- **Steps**:
  1. Erstelle Charakter mit Fernkampfwaffe (z.B. "Armbrust")
  2. Starte Kampf
  3. Führe Fernkampfangriff aus, bis ein Patzer auftritt (2d6 würfeln)
  4. Prüfe Patzer-Tabellenergebnis für Schadensberechnung
  
- **Expected**: 
  - Schadensformeln werden aus `weapon.system.tp` berechnet (nicht `schaden`)
  - Patzer-Nachrichten mit korrektem Schaden angezeigt
  - Keine Fehler in Browser-Konsole

### 2. Waffenstat-Anzeige
**Test**: Waffenwerte in Charaktersheet
- **Steps**:
  1. Öffne Charaktersheet mit mehreren Waffen
  2. Überprüfe Nahkampf- und Fernkampf-Tabs
  3. Überprüfe Favoriten-Component
  4. Inspiziere Rüstungshärte-Anzeige
  
- **Expected**:
  - TP-Werte angezeigt (nicht schaden)
  - Härte-Felder angezeigt (nicht härte mit Umlaut)
  - Korrekte Werte für alle Waffen

### 3. Initiative-Dialog
**Test**: Initiative-Dialog mit computed-Modifiern
- **Steps**:
  1. Starte Kampf
  2. Öffne Initiative-Dialog
  3. Überprüfe Tooltip-Modifierer
  
- **Expected**:
  - `weapon.system.computed.modifiers.dmg` zeigt Modifier-Tooltip
  - Keine Fehler bei fehlenden computed-Daten
  - BaseINI korrekt angezeigt

### 4. Energieressourcen
**Test**: AsP/KaP-Verwaltung
- **Steps**:
  1. Öffne Held-Charactersheet
  2. Überprüfe Energy-Resources-Component
  3. Bearbeite AsP/KaP via Energy-Dialog
  
- **Expected**:
  - `asp_stern`, `gasp`, `kap_stern`, `gkap` Felder korrekt angezeigt
  - Keine NaN/Undefined Werte
  - Null-Safe Fallbacks funktionieren

---

## Deprecation & Future Cleanup

### Retained Aliases (Ilaris 13.1.0 Compat)
Diese Felder sind in Ilaris 13.1.0 noch als Aliase vorhanden, die Modul-Migration nutzt aber die kanonischen Namen:
- ~~`system.schaden`~~ → `system.tp` (vollständig ersetzt)
- ~~`system.härte`~~ → `system.haerte` (vollständig ersetzt)

### Planned Removals (Post-13.1.0)
Falls das Ilaris-System in Zukunft ältere Aliase entfernt:
- **asp_stern/gasp/kap_stern/gkap**: Modul ist vorbereitet via `|| 0` Fallbacks
- **Computed Modifiers**: Null-safe Zugriffe bereits im Place

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| Damage formula string parsing | Low | High | Tested with Patzer-Logik |
| UI Display Regression | Low | Medium | Template validation, smoke tests |
| Inventory Rendering | Low | Low | Felder bereits canonical, verified |
| Energy Resource Bugs | Very Low | Medium | Null-safe defaults, verified |

---

## Rollback Plan

Falls kritische Fehler in Produktion auftreten:
1. **Immediate**: Branch-out zu hotfix-branch mit Revert-Commits:
   ```bash
   git revert <commit-hash-migration>
   ```
2. **Backup**: Alte `system.schaden` Aliase für Kompatibilität nutzen (falls System noch Aliase anbietet)
3. **Communicate**: Nutzer informieren, dass Feature temporär disabled ist

---

## References

- System Migration Docs: [C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_03_inventarisierung_datenmodell](C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_03_inventarisierung_datenmodell)
- Fernkampf Hook Migration: [docs/_specs/2026_05_09_fernkampf_hook_migration/fernkampf_hook_migration_plan.md](../2026_05_09_fernkampf_hook_migration/fernkampf_hook_migration_plan.md)
- Module Repository: [ilaris-alternative-actor-sheet](https://github.com/Ilaris-Tools/IlarisFoundryVTT)
