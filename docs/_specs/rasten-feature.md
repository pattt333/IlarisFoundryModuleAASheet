# Feature-Spezifikation: Regenerations-Dialog

## 1. Übersicht
**Ziel:** Dialog zur Regeneration von Astralpunkten (ASP), Karmalpunkten (KAP) und Lebenspunkten (Wunden) während einer Rast.

**Trigger:** Bestehender "Rasten"-Button in ```ilaris-alternative-actor-sheet.hbs``` mit class="rest-button" → öffnet Dialog.

## 2. Anzeigelogik
- **Nur ASP-Regeneration:** Wenn `system.abgeleitete.zauberer = true`
- **Nur KAP-Regeneration:** Wenn `system.abgeleitete.geweihter = true`  
- **Nur Lebenspunkte:** Wenn weder Zauberer noch Geweihter
- Niemals beides gleichzeitig anzeigen

## 3. Berechnungen & Formeln

### Energie-Regeneration:
```
Basis = ceil(aktueller_wert / divisor)
Zauberer: divisor = 8, aktueller_wert = system.abgeleitete.asp_stern
Geweihter: divisor = 4, aktueller_wert = system.abgeleitete.kap_stern

Gesamt = min(Basis + manuelle_eingabe, maximalwert)
Zauberer Max: system.abgeleitete.asp
Geweihter Max: system.abgeleitete.kap
```

### Lebenspunkte-Regeneration:
```
law_wert = system.abgeleitete.law (fester Wert)
neue_wunden = max(system.abgeleitete.ws, system.gesundheit.wunden + law_wert)
Hinweis: "negativ" bedeutet wenn system.gesundheit.wunden > system.abgeleitete.ws
Maximum ist system.abgeleitete.ws (Wundschwelle)
Beispiel: 18 Wunden + 6 law = 24 Wunden → aber max ws (z.B. 30)
```

## 4. Dialog-UI

### Header:
"Regeneration während Rast"

### Energie-Bereich (nur einer sichtbar):
```
Für Zauberer:
  "Aktuelle ASP: [X] / [max_asp]"
  "Basis-Regeneration (1/8 aufgerundet): [Y]"
  "Zusätzliche ASP: [0]" ← Input-Feld (nur dieser Wert wird eingegeben)
  "Gesamt nach Rast: [berechnet] / [max_asp]"

Für Geweihte:
  "Aktuelle KAP: [X] / [max_kap]"
  "Basis-Regeneration (1/4 aufgerundet): [Y]"
  "Zusätzliche KAP: [0]" ← Input-Feld (nur dieser Wert wird eingegeben)
  "Gesamt nach Rast: [berechnet] / [max_kap]"
```

### Lebenspunkte-Bereich (immer sichtbar):
```
"Aktuelle Wunden: [Z]"
"Regeneration durch 1 Law: [law_wert]"
"Neue Wunden nach Rast: [berechnet]"
```

### Buttons:
- "Rast durchführen" (Bestätigung)
- "Abbrechen"

## 5. Datenpfade
- `system.abgeleitete.zauberer` (boolean)
- `system.abgeleitete.geweihter` (boolean)
- `system.abgeleitete.asp_stern` (aktuell)
- `system.abgeleitete.kap_stern` (aktuell)
- `system.abgeleitete.asp` (maximal)
- `system.abgeleitete.kap` (maximal)
- `system.abgeleitete.law` (fester Wert)
- `system.gesundheit.wunden`

## 6. Validierungsregeln
- **Manuelle Eingabe:** Nur Zahlen, Minimum 0, kein Maximum
- **Negative Wunden:** Erlaubt (keine Validierung)
- **Maximalwerte:** Nie überschreiten (`min()` Funktion verwenden)
- **Fehlende Daten:** Warnung in Konsole, Dialog bleibt offen

## 7. Rundung & Mathematik
- **Immer aufrunden:** `Math.ceil()`
- **Keine temporären Modifikatoren:** Nur Basiswerte verwenden
- **Division:** Immer mit aktuellen Werten (`_stern`)

## 8. Implementierungshinweise
1. **Vor Bedingungen prüfen:** Existieren alle benötigten Felder?
2. **Dialog dynamisch aufbauen:** Nur relevante Bereiche anzeigen
3. **Berechnungen live aktualisieren:** Bei Eingabeänderungen
4. **Speicherung:** Direkt in `_stern` Werte und `system.gesundheit.wunden`
5. **Keine zusätzliche Logik:** Einfache Umsetzung wie spezifiziert

## 9. Edge Cases & Besonderheiten
- **0 ASP/KAP:** `ceil(0 / divisor) = 0` → korrekt
- **Charakter ohne Klasse:** Nur Lebenspunkte regenerieren
- **Fehlende Werte:** Warnung ausgeben, keine Aktion
- **Manuelle Eingabe 0:** Nur Basisregeneration anwenden

## 10. Erweiterbarkeit (für später)
- Platzhalter für spätere Modifikatoren einplanen
- Dialog-Struktur modular halten
- Keine i18n, kein Accessibility, keine Tests (wie spezifiziert)

## 11. Implementierungs-Klärungen
**Frage 1:** Rest-Button Location?
- **Antwort:** In `ilaris-alternative-actor-sheet.hbs` mit `class="rest-button"`

**Frage 2:** Zusätzliche Punkte - Addon oder Ersatz?
- **Antwort:** Addon - `Gesamt = Basis + manuelle_eingabe` (mit max cap)

**Frage 3:** Wunden-Logik?
- **Antwort:** Maximum ist `system.abgeleitete.ws` (Wundschwelle), nicht 0
- "Negativ" bedeutet: wenn `system.gesundheit.wunden > system.abgeleitete.ws`
- Formel: `max(system.abgeleitete.ws, wunden + law)`

**Frage 4:** Dialog-Typ?
- **Antwort:** Foundry Standard `Dialog`-Klasse verwenden

**Frage 5:** Live-Berechnung?
- **Antwort:** Nur bei Bestätigung der Rast im Dialog, keine live-updates

**Frage 6:** Speicherung?
- **Antwort:** `actor.update()` mit neuen Werten für `asp_stern`, `kap_stern` und `wunden`

## 12. Manuelle Anpassungen nach Implementierung

Die initiale Implementierung wurde manuell angepasst, um das tatsächliche Datenmodell des Ilaris-Systems korrekt abzubilden:

### ASP-Regeneration (Zeile 721):
**Original:** `const basisRegen = Math.ceil(currentASP / 8);`  
**Angepasst:** `const basisRegen = Math.ceil(maxASP / 8);`  
**Grund:** Die Basis-Regeneration basiert auf dem **maximalen** ASP-Wert, nicht dem aktuellen

### KAP-Regeneration (Zeile 735):
**Original:** `const basisRegen = Math.ceil(currentKAP / 4);`  
**Angepasst:** `const basisRegen = Math.ceil(maxKAP / 16);`  
**Grund:** 
- Die Basis-Regeneration basiert auf dem **maximalen** KAP-Wert
- Der Divisor ist **16** statt 4 (1/16 statt 1/4)

### Lebenspunkte-Datenstruktur (Zeile 751-752):
**Original:** `const currentWunden = gesundheit.wunden || 0;`  
**Angepasst:** `const currentHP = gesundheit.hp.value || 0;`  
**Grund:** Ilaris verwendet ein **hp-Objekt** mit `.value` Property statt direktem `wunden`-Feld

### Lebenspunkte-Berechnung (Zeile 754):
**Original:** `const neueWunden = Math.max(ws, currentWunden + lawWert);`  
**Angepasst:** `const neueWunden = Math.min(ws, currentHP + lawWert);`  
**Grund:** 
- **`Math.min`** statt `Math.max` - verhindert Überschreitung der Wundschwelle
- Heilung **addiert** law zu HP (HP steigen)

### Wunden-Update in Callback (Zeile 804):
**Original:** `const newWunden = Math.max(ws, currentWunden + lawWert);`  
**Angepasst:** `const newWunden = Math.max(0, (gesundheit.wunden || 0) - lawWert);`  
**Grund:** 
- Wunden werden **reduziert** (subtrahiert), nicht addiert
- Minimum ist **0** (keine negativen Wunden)
- Verwendet `gesundheit.wunden` für das Update

### Zusätzliches UI-Element (Zeile 761):
**Hinzugefügt:** `<input type="number" name="law-times" value="0" min="0" />`  
**Grund:** Eingabefeld für manuelle Law-Multiplikation (z.B. mehrere Tage Rast)

---

**Version:** 1.2  
**Letzte Aktualisierung:** 2026-01-16  
**Status:** Implementiert und angepasst

---
*Diese Spezifikation dokumentiert die finale Implementierung nach manuellen Korrekturen.*