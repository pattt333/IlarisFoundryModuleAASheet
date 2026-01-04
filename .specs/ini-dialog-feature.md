# Feature-Spezifikation: Initiative-Aktions-Dialog für Foundry VTT v12 (Ilaris-System)

## Überblick
Ein Dialog-System zur Erfassung von Initiativmodifikatoren, Aktionen und Kampfmodifikatoren vor dem Initiativewurf im Foundry VTT Encounter-Screen für das Ilaris-System.

## Funktionale Anforderungen

### 1. Dialog-Öffnung und -Verwaltung
- **Auslöser**: Klick auf Würfelbutton im Encounter-Screen
- **Ziel**:
  - PC-Token → Einzeldialog für diesen Charakter
  - NPC-Token (GM) → Massen-Dialog für alle NPCs
- **Automatisches Öffnen**: Bei Rundenstart für alle Kampfteilnehmer
- **Dialog-Persistenz**: Eingaben werden gespeichert bis "INI ansagen" gedrückt wird
- **Nachträgliches Öffnen**: Möglichkeit, Dialog für bereits gewürfelte Teilnehmer erneut zu öffnen, aber nur wenn "INI ansagen" noch nicht gedrückt wurde

### 2. Dialog-Felder und Elemente (Deutsch)

#### 2.1 Eingabefelder
- **INI-Modifikator**: Numerisches Eingabefeld (Standard: 0)
- **AT-Modifikator** (`system.modifikatoren.nahkampfmod`): Numerisches Eingabefeld (Standard: 0)
- **VT-Modifikator** (`system.modifikatoren.verteidigungmod`): Numerisches Eingabefeld (Standard: 0)

#### 2.2 Checkbox
- **Kombinierte Aktion (-4 AT/VT)**:
  - Aktivierung reduziert AT- und VT-Modifikator um jeweils 4
  - Tooltip: "Bei kombinierten Aktionen sind AT und VT um 4 erschwert"

#### 2.3 Aktions-Dropdown
- **Beschriftung**: "Aktionen auswählen (max. 2)"
- **Datenquelle**:
  - PC-Dialog: Aktionen aus Character-Inventory UND Kompendium
  - NPC-Massen-Dialog: Aktionen aus Kompendium
- **Mehrfachauswahl**: 0-2 Aktionen gleichzeitig auswählbar
- **Hinweis-Anzeige**: Bei Auswahl wird Beschreibung unter Dropdown angezeigt
- **INI-Berechnung**: Bei Mehrfachauswahl gilt nur der niedrigste INI-Mod
- **Tooltip**: "Wählen Sie bis zu 2 Aktionen aus Ihrem Charakterbogen oder Kompendium"

#### 2.4 Würfel-Optionen (nur bei automatischem Würfeln)
- **Beschriftung**: "Würfelanzahl"
- **Auswahlmöglichkeiten**:
  - "1 Würfel"
  - "2 Würfel (Auswahl nach Wurf)"
- **Tooltip**: "Man kann irgendein Ergebnis von den beiden wählen"
- **Ausnahme**: Bei Client-Einstellung "Manuelles Würfeln" wird diese Auswahl nicht angezeigt

#### 2.5 Status-Anzeige
- **Würfel-Ergebnis**: Anzeige des gewählten Würfelergebnisses
- **Bearbeitungsstatus**: Für Massen-Dialog: "X von Y NPCs bearbeitet"

### 3. Ilaris-spezifische System-Pfade
- **Initiative**: `system.abgeleitete.ini`
- **Angriffswert-Modifikator**: `system.modifikatoren.nahkampfmod`
- **Verteidigungswert-Modifikator**: `system.modifikatoren.verteidigungmod`

### 4. Berechnungslogik
- **INI-Gesamtmodifikator**: Manueller INI-Mod + niedrigster INI-Mod ausgewählter Aktionen
- **AT-Gesamtmodifikator**: Manueller AT-Mod + Summe AT-Mods aus Aktionen + (kombinierte Aktion ? -4 : 0)
- **VT-Gesamtmodifikator**: Manueller VT-Mod + Summe VT-Mods aus Aktionen + (kombinierte Aktion ? -4 : 0)
- **Effekt-Merging**: Alle Changes werden in einen einzigen Active Effect gemerged
- **Effekt-Dauer**: `duration.turns = 1` (automatische Entfernung nach Rundenende)

### 5. Würfel-Mechanik
- **Synchrones Würfeln**: Würfel werden vor Dialog-Schließen geworfen
- **2-Würfel-Option**: Zwei Würfe, dann Auswahl eines der Ergebnisse
- **Manuelles Würfeln**: Standard Foundry-Würfelmechanik (keine automatischen Würfe)

### 6. Rundenstart-Verhalten
- **Trigger**: Beginn einer neuen Kampfrunde
- **Für PCs**: Einzeldialoge pro Spieler
- **Für NPCs**: Ein Massen-Dialog für GM (nie Einzeldialoge)
- **Fortschrittsanzeige**: "X von Y Teilnehmern bearbeitet"

### 7. GM-Massen-Dialog für NPCs
- **Nur Massen-Dialog**: Bei NPCs nie Einzeldialoge
- **Batch-Operation**: Alle Änderungen werden auf einmal angewendet
- **Individuelle Overrides**: Möglichkeit für individuelle NPC-Einstellungen

### 8. Besondere Ilaris-Regeln
- **Negative Initiative** (< 0):
  - Charakter wird in aktueller Runde übersprungen
  - Nächste Runde: Startet mit negativem Wert, kann nur Würfeln um Wert zu erhöhen
- **Schwarm-Tokens**: Werden als einzelne Einheit behandelt (gemeinsame Initiative)

### 9. Kompendium
- **Datenquelle**: Aktionen werden aus Kompendium geladen
- **Keine automatische Erstellung**: Keine automatische Erstellung von Standardaktionen

### 10. Persistenz
- **Dialog-Zustand**: Wird gespeichert bis "INI ansagen" gedrückt wird
- **Nachträgliches Öffnen**: Dialog kann erneut geöffnet werden, solange nicht bestätigt

## Technische Hinweise

### Foundry VTT API-Referenzen
- **Dialog-System**: `Dialog` Klasse, `Application` Klasse
- **Active Effects**: `ActiveEffect` Klasse, `CONST.ACTIVE_EFFECT_MODES`
- **Combat System**: `Combat` Klasse, `Combatant` Klasse, `updateCombat` Hook
- **Items & Actors**: `Actor` Klasse, `Item` Klasse, Inventory-Management
- **Hooks**: `renderTokenHUD`, `updateCombat`, `updateCombatant`
- **Game Settings**: `game.settings` für Persistenz
- **Localization**: Keine Übersetzungs-Keys (direkt deutsche Strings verwenden)

### Implementierungs-Strategien
1. **Dialog-Klassen**: Separate Klassen für Einzel- und Massen-Dialog
2. **State Management**: Dialog-Zustand pro Combatant speichern
3. **Effect-Merging**: Alle Changes in einem Active Effect zusammenfassen
4. **Würfel-Logik**: Foundry's `Roll` Klasse für Würfelmechanik
5. **Rundenstart-Erkennung**: `updateCombat` Hook mit Round-Increment prüfen

### Performance-Considerations
- **Massen-Operationen**: Effiziente Batch-Processing für NPCs
- **Effect-Cleanup**: Alte Effekte automatisch entfernen
- **Lazy Loading**: Aktionen-Liste bei Bedarf laden

## Akzeptanzkriterien

### Kernfunktionalität
- [ ] Ilaris-spezifische System-Pfade korrekt verwendet
- [ ] Merged Effect pro Charakter mit allen Modifikatoren
- [ ] INI-Berechnung mit niedrigstem Aktions-Mod korrekt
- [ ] AT/VT-Mods summieren sich korrekt
- [ ] Negative Initiative wird korrekt behandelt
- [ ] Dialog-Persistenz bis "INI ansagen" gedrückt wird

### Dialog-Verhalten
- [ ] Einzeldialog für PCs mit Aktionen aus Inventory UND Kompendium
- [ ] Massen-Dialog für NPCs (nie Einzeldialoge)
- [ ] Automatisches Öffnen bei Rundenstart
- [ ] Nachträgliches Öffnen möglich (wenn nicht bestätigt)
- [ ] Fortschrittsanzeige im Massen-Dialog

### Würfel-Mechanik
- [ ] 1-Würfel-Option funktioniert
- [ ] 2-Würfel-Option mit Auswahl-Dialog funktioniert
- [ ] Tooltip: "Man kann irgendein Ergebnis von den beiden wählen"
- [ ] Synchrone Würfelung vor Dialog-Schließen

### Ilaris-spezifische Features
- [ ] Schwarm-Tokens werden korrekt behandelt
- [ ] Keine automatische Kompendium-Erstellung
- [ ] Tooltips und Hilfetexte auf Deutsch
- [ ] Alle Texte auf Deutsch ohne Übersetzungs-Keys

### Performance und Robustheit
- [ ] Keine Performance-Probleme bei bis zu 10 NPCs
- [ ] Fehlerbehandlung bei fehlenden Pfaden/Items
- [ ] Validierung aller Eingabefelder
- [ ] Kompatibel mit Foundry v12

---

**Dokumentversion**: Final 1.0  
**System**: Exklusiv für Ilaris  
**Foundry Version**: v12  
**Sprache**: Deutsch  
**Besondere Anforderungen**:
- Dialog-Persistenz bis Bestätigung
- Nachträgliches Öffnen nur vor Bestätigung
- PC-Dialog: Aktionen aus Inventory UND Kompendium
- Keine automatische Kompendium-Erstellung
- 2-Würfel-Tooltip: "Man kann irgendein Ergebnis von den beiden wählen"

*Diese Spezifikation dient als Grundlage für die Implementierung durch einen Coding-Agent. Alle Anforderungen sind auf Deutsch und für Foundry VTT v12 mit Ilaris-System spezifiziert.*