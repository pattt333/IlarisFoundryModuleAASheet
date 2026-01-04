# Feature-Spezifikation: Initiative-Aktions-Dialog für Foundry VTT v12 (Ilaris-System)

## Überblick
Ein Dialog-System zur Erfassung von Initiativmodifikatoren, Aktionen und Kampfmodifikatoren vor dem Initiativewurf im Foundry VTT Encounter-Screen für das Ilaris-System.

## Funktionale Anforderungen

### 1. Dialog-Öffnung und -Verwaltung
- **Auslöser**: Klick auf Würfelbutton im Encounter-Screen
- **Ziel**:
  - PC-Token → Einzeldialog für diesen Charakter
  - NPC-Token (GM) → Massen-Dialog für alle NPCs
- **Automatisches Öffnen**: 
  - Bei jeder neuen Kampfrunde für alle Kampfteilnehmer
  - Beim ersten Kampfstart (Runde 1)
  - Bei Combatants, die mitten im Kampf beitreten (über normalen INI-Button)
- **Dialog-Persistenz**: 
  - Eingaben werden im `actor.flags.nenneke` gespeichert bis "INI ansagen" gedrückt wird
  - Bei Abbruch/Schließen (ohne "INI ansagen") bleibt Dialog-Zustand erhalten
  - Zurücksetzung nur beim Klick auf "INI ansagen"
- **Nachträgliches Öffnen**: 
  - Dialog kann über normalen INI-Button im Encounter erneut geöffnet werden
  - Nur möglich wenn "INI ansagen" noch nicht gedrückt wurde
  - Prüfung via `combatant.initiative !== null` (wenn null = noch nicht bestätigt)
  - Workaround: INI-Wert im Encounter löschen reaktiviert den Button

### 2. Dialog-Felder und Elemente (Deutsch)

#### 2.1 Dialog-Buttons
- **"INI ansagen"**: Hauptbutton im Dialog
  - Schließt den Dialog
  - Wendet Active Effect auf Actor an
  - Setzt Initiative im Combat Tracker (via `combat.rollInitiative()` oder `combat.setInitiative()`)
  - Postet Chat-Message mit allen Infos
  - Löscht persistierten Dialog-Zustand
  - **Warnung bei Spielern**: Roter Warntext beim Button "Bitte erst würfeln!" wenn noch nicht gewürfelt wurde

#### 2.2 Eingabefelder
- **INI-Modifikator**: Numerisches Eingabefeld (Standard: 0)
- **AT-Modifikator** (`system.modifikatoren.nahkampfmod`): Numerisches Eingabefeld (Standard: 0)
- **VT-Modifikator** (`system.modifikatoren.verteidigungmod`): Numerisches Eingabefeld (Standard: 0)
- **Bei negativer Initiative**: Alle Eingabefelder (INI, AT, VT, Aktionen-Dropdown) werden disabled

#### 2.3 Checkbox
- **Kombinierte Aktion (-4 AT/VT)**:
  - Aktivierung reduziert AT- und VT-Modifikator um jeweils 4
  - Tooltip: "Bei kombinierten Aktionen sind AT und VT um 4 erschwert"

#### 2.4 Aktions-Dropdown
- **Beschriftung**: "Aktionen auswählen (max. 2)"
- **Datenquelle**:
  - PC-Dialog: Effect-Items aus Character-Inventory (Typ `effect-item`) UND Kompendium `nenneke.nenneke-aktionen`
  - NPC-Massen-Dialog: Nur aus Kompendium `nenneke.nenneke-aktionen`
- **Mehrfachauswahl**: 0-2 Aktionen gleichzeitig auswählbar
- **Hinweis-Anzeige**: Bei Auswahl wird `item.system.description` unter Dropdown angezeigt
- **INI-Berechnung**: Bei Mehrfachauswahl gilt nur der niedrigste INI-Mod aus den Active Effects der Items
- **AT/VT-Berechnung**: Summe aller AT/VT-Mods aus den Active Effects der ausgewählten Items
- **Tooltip**: "Wählen Sie bis zu 2 Aktionen aus Ihrem Charakterbogen oder Kompendium"

#### 2.5 Würfel-Sektion
- **Position**: Als eigene Sektion unter den Eingabefeldern
- **Würfel-Optionen** (nur bei automatischem Würfeln):
  - **Beschriftung**: "Würfelanzahl"
  - **Auswahlmöglichkeiten**:
    - "1 Würfel"
    - "2 Würfel (Auswahl nach Wurf)"
  - **Tooltip**: "Man kann irgendein Ergebnis von den beiden wählen"
  - **Ausnahme**: Bei Foundry Core-Setting "Manuelles Würfeln" wird diese Auswahl nicht angezeigt
- **Würfel-Button**: "Würfeln" - löst Würfelwurf aus
- **Würfel-Anzeige**: 
  - Visuelle Darstellung der W6-Würfel (6-seitig)
  - Bei 1 Würfel: Ein Würfel wird angezeigt
  - Bei 2 Würfeln: Beide Würfel werden angezeigt, ausgewählter wird highlighted
  - Klick auf Würfel wählt diesen aus (nur bei 2-Würfel-Option)
- **Würfel-Ergebnis**: Nach Auswahl wird Ergebnis in Active Effect als Change umgewandelt

#### 2.6 Status-Anzeige
- **Für Massen-Dialog**: "X von Y NPCs bearbeitet" (nur im GM-Dialog sichtbar)
- **Für Spieler-Dialog**: Warntext beim "INI ansagen"-Button falls nicht gewürfelt

### 3. Ilaris-spezifische System-Pfade
- **Initiative**: `system.abgeleitete.ini`
- **Angriffswert-Modifikator**: `system.modifikatoren.nahkampfmod`
- **Verteidigungswert-Modifikator**: `system.modifikatoren.verteidigungmod`
- **Effect-Item Description**: `item.system.description`

### 4. Berechnungslogik
- **INI-Gesamtmodifikator**: Manueller INI-Mod + niedrigster INI-Mod ausgewählter Aktionen + Würfelergebnis
- **AT-Gesamtmodifikator**: Manueller AT-Mod + Summe AT-Mods aus Aktionen + (kombinierte Aktion ? -4 : 0)
- **VT-Gesamtmodifikator**: Manueller VT-Mod + Summe VT-Mods aus Aktionen + (kombinierte Aktion ? -4 : 0)
- **Effekt-Merging**: Alle Changes werden in einen einzigen Active Effect gemerged
  - **Name**: "Kampf-Modifikatoren Runde X"
  - **Icon**: `icons/svg/dice-target.svg`
  - **Flags**: Keine erforderlich
- **Effekt-Dauer**: 
  - Standard: `duration.turns = 1`
  - Bei negativer Initiative: `duration.turns = 2`

### 5. Würfel-Mechanik
- **Würfel-Typ**: 1d6 (6-seitiger Würfel)
- **Würfel-Timing**: Würfel werden vor Dialog-Schließen ("INI ansagen") geworfen
- **1-Würfel-Option**: Ein Wurf, Ergebnis wird direkt verwendet
- **2-Würfel-Option**: 
  - Zwei Würfe werden geworfen
  - Spieler/GM klickt auf einen der beiden Würfel zur Auswahl
  - Gewähltes Ergebnis wird highlighted
  - Dann erst "INI ansagen" klickbar
- **Manuelles Würfeln**: Foundry Core-Dialog übernimmt Würfelmechanik (keine Änderung erforderlich)
- **Ergebnis-Verarbeitung**: Würfelergebnis wird als Change in Active Effect hinzugefügt

### 6. Rundenstart-Verhalten
- **Trigger**: `Hooks.on("combatRound", ...)` oder `Hooks.on("updateCombat", ...)` mit Prüfung auf `updateData.round`
- **Für PCs**: 
  - Einzeldialoge pro Spieler
  - Jeder Spieler sieht nur seinen eigenen Dialog auf seinem Client
- **Für NPCs**: 
  - Ein Massen-Dialog für GM
  - GM sieht nur den NPC-Massen-Dialog auf seinem Client
  - Fortschrittsanzeige: "X von Y NPCs bearbeitet"

### 7. GM-Massen-Dialog für NPCs
- **UI-Struktur**: Tab-basiertes Interface
  - Ein Tab pro NPC
  - Tab-Name: Actor-Name
  - Jeder NPC hat eigene Eingabefelder in seinem Tab
- **"Würfel alle"-Button**:
  - Würfelt automatisch für alle NPCs in deren Tabs
  - Berücksichtigt die Würfelanzahl-Einstellung (1 oder 2 Würfel)
  - Bei 2-Würfel-Option: Tabs mit 2 Würfeln werden visuell markiert
  - GM muss dann jeden markierten Tab besuchen und einen Würfel auswählen
- **Teilbearbeitung**:
  - GM kann einzelne NPCs bearbeiten
  - NPCs die nicht bearbeitet wurden: Bekommen nur ihren Standard-INI-Wert (via `actor.system.abgeleitete.ini`), **kein Active Effect**
  - Kein Zwang zur Vollständigkeit
- **Batch-Operation**: "INI ansagen" wendet alle Änderungen auf einmal an

### 8. Besondere Ilaris-Regeln

#### 8.1 Negative Initiative (< 0)
- **Aktuelle Runde**: Charakter wird übersprungen
- **Dialog-Verhalten**:
  - Alle Eingabefelder (INI-Mod, AT-Mod, VT-Mod, Aktionen-Dropdown, Kombinierte Aktion) werden disabled
  - Nur Würfel-Sektion bleibt aktiv
  - Würfelergebnis wird auf Active Effect gerechnet
- **Effect-Duration**: `duration.turns = 2` statt 1
- **Rundenende-Dialog**:
  - **Trigger**: Am Ende der Runde, in der der Actor regulär dran wäre
  - **Empfänger**: Nur der Owner des Actors sieht den Dialog
  - **Frage**: "Aktion fortsetzen?" (Ja/Nein)
  - **Bei "Ja"**: 
    - Actor wird übersprungen (nächster Combatant/nächste Runde)
    - Effect bleibt bestehen
    - Nächste Runde: Dialog verhält sich wieder normal
  - **Bei "Nein"**:
    - Active Effect wird sofort entfernt
    - Nächste Runde: Dialog öffnet sich ganz normal ohne Einschränkungen

### 9. Kompendium
- **Name**: `nenneke.nenneke-aktionen`
- **Typ**: Teil dieses Moduls (`ilaris-alternative-actor-sheet`)
- **Erstellung**: Kompendium muss in `module.json` definiert werden
- **Item-Typ**: `effect-item` (Ilaris-System)
- **Keine automatische Erstellung**: Keine Standardaktionen werden automatisch erstellt

### 10. Persistenz
- **Speicherort**: `actor.flags.nenneke.dialogState`
- **Gespeicherte Daten**:
  - INI-Mod, AT-Mod, VT-Mod
  - Gewählte Aktionen (Item-IDs)
  - Kombinierte Aktion (ja/nein)
  - Würfelanzahl-Auswahl
  - Gewürfeltes Ergebnis (falls vorhanden)
- **Reset-Trigger**: Klick auf "INI ansagen"
- **Persistenz-Check**: `combatant.initiative !== null` zeigt an, ob bereits bestätigt wurde

### 11. Chat-Integration
- **Message-Typ**: Einfache Text-Chat-Message (kein Roll-Message-Template)
- **Inhalt**: `[Charaktername] Initiative: 15 (Basis: 12, Mod: +1, Würfel: 2)
Aktionen: Sturmangriff, Verteidigungshaltung
Modifikatoren: AT -2, VT +3`
- **Format**:
- **Zeile 1**: Initiative-Gesamtwert mit Aufschlüsselung (Basis-INI + Mod + Würfel)
- **Zeile 2**: Namen der gewählten Aktionen (falls vorhanden)
- **Zeile 3**: AT/VT-Modifikatoren (nur wenn != 0)
- **Posting**: Via `ChatMessage.create()`
- **Sichtbarkeit**: Öffentlich für alle Spieler

### 12. Kampf-Tab Integration
- **Tab-Umbenennung**: 
- Datei: `weapons-tab.hbs` → `kampf-tab.hbs`
- Data-Attribut: `data-tab="weapons"` → `data-tab="kampf"`
- Navigation-Link: Bleibt "Kampf"
- **Aktionen-Sektion**:
- **Anzeige**: Alle effect-items vom Typ `effect-item` aus Actor-Inventory
- **Nur im Kampf-Tab**: Nicht in anderen Tabs (Items-Tab, Effects-Tab)
- **Darstellung**: Liste mit:
  - Icon des Items
  - Name des Items
  - Edit-Button (öffnet Item-Sheet)
  - Delete-Button (löscht Item)
- **Position**: Unterhalb der Waffen-Sektion oder als separate Accordion

## Technische Hinweise

### Foundry VTT API-Referenzen
- **Dialog-System**: `Dialog` Klasse, `Application` Klasse
- **Active Effects**: `ActiveEffect` Klasse, `CONST.ACTIVE_EFFECT_MODES.ADD`
- **Combat System**: 
- `Combat` Klasse
- `Combatant` Klasse
- `combat.rollInitiative(ids, options)` - Würfelt und setzt Initiative
- `combat.setInitiative(id, value)` - Setzt Initiative manuell
- `combatant.initiative` - Prüfung auf `null` für Bestätigungsstatus
- **Hooks**: 
- `combatRound` - Rundenstart-Erkennung
- `updateCombat` - Kampf-Updates (inkl. Rundenende)
- `combatTurn` - Turn-Wechsel
- **Items & Actors**: `Actor` Klasse, `Item` Klasse, `actor.items.filter(i => i.type === "effect-item")`
- **Flags**: `actor.flags.nenneke.dialogState` für Persistenz
- **Chat**: `ChatMessage.create()` für Message-Posting
- **Localization**: Keine Übersetzungs-Keys (direkt deutsche Strings verwenden)

### Implementierungs-Strategien
1. **Dialog-Klassen**: 
 - `InitiativeDialog` (Einzeldialog für PCs)
 - `MassInitiativeDialog` (Massen-Dialog für NPCs)
 - Beide erben von `Application` oder `FormApplication`
2. **State Management**: 
 - `actor.flags.nenneke.dialogState` für temporäre Persistenz
 - Cleanup nach "INI ansagen"
3. **Effect-Merging**: 
 - Alle Changes (INI, AT, VT) in einen Active Effect
 - Effect-Name: "Kampf-Modifikatoren Runde X"
 - Icon: `icons/svg/dice-target.svg`
4. **Würfel-Logik**: 
 - `new Roll("1d6")` für einzelne Würfel
 - Bei 2 Würfeln: Zwei separate Rolls, dann UI-Auswahl
5. **Rundenstart-Erkennung**: 
 ```javascript
 Hooks.on("combatRound", (combat, updateData) => {
   // Dialog für alle Combatants öffnen
 });
 ```
 6. **Negative INI Rundenende-Check:**
```javascript
Hooks.on("updateCombat", (combat, updateData) => {
  // Prüfe ob Runde endet und Actor negative INI hat
  // Zeige Ja/Nein-Dialog
});
```

## Performance-Considerations
-   Massen-Operationen: Batch-Create für Active Effects (Promise.all)
-   Effect-Cleanup: Alte "Kampf-Modifikatoren"-Effects automatisch löschen vor neuem Erstellen
-   Lazy Loading: Kompendium-Aktionen nur bei Dialog-Öffnung laden
-   Tab-Rendering: Nur aktiven NPC-Tab rendern im Massen-Dialog

## Akzeptanzkriterien
### Kernfunktionalität
-   Ilaris-spezifische System-Pfade korrekt verwendet
-   Merged Effect pro Charakter mit allen Modifikatoren
-   Effect-Name: "Kampf-Modifikatoren Runde X"
-   Effect-Icon: icons/svg/dice-target.svg
-   INI-Berechnung mit niedrigstem Aktions-Mod korrekt
-   AT/VT-Mods summieren sich korrekt
-   Negative Initiative wird korrekt behandelt (duration.turns = 2)
-   Dialog-Persistenz in actor.flags.nenneke.dialogState bis "INI ansagen"

### Dialog-Verhalten
-   Einzeldialog für PCs mit Aktionen aus Inventory UND Kompendium
-   Massen-Dialog für NPCs mit Tab-Interface (nie Einzeldialoge)
-   "Würfel alle"-Button im NPC-Dialog funktioniert
-   Automatisches Öffnen bei jeder neuen Runde
-   Nachträgliches Öffnen über normalen INI-Button möglich (wenn combatant.initiative === null)
-   Fortschrittsanzeige im Massen-Dialog
-   "INI ansagen"-Button mit Warntext "Bitte erst würfeln!" bei PCs

### Würfel-Mechanik
-   1-Würfel-Option funktioniert (1d6)
-   2-Würfel-Option mit Auswahl-UI funktioniert
-   Würfel werden visuell dargestellt (W6)
-   Ausgewählter Würfel wird highlighted
-   Tooltip: "Man kann irgendein Ergebnis von den beiden wählen"
-   Synchrone Würfelung vor Dialog-Schließen
-   Foundry Core "Manuelles Würfeln" wird respektiert

### Chat-Integration
-   Chat-Message wird beim "INI ansagen" gepostet
-   Format: Initiative-Wert (Basis + Mod + Würfel)
-   Aktionen-Namen werden angezeigt
-   AT/VT-Modifikatoren werden angezeigt
-   Message ist öffentlich sichtbar

### Negative Initiative
-   Eingabefelder werden bei negativer INI disabled
-   Nur Würfel-Sektion bleibt aktiv
-   duration.turns = 2 wird gesetzt
-   Rundenende-Dialog erscheint am richtigen Zeitpunkt
-   "Ja"-Option: Actor wird übersprungen
-   "Nein"-Option: Effect wird entfernt, Dialog nächste Runde normal

### Kampf-Tab
-   Tab umbenannt zu "kampf-tab"
-   Aktionen-Sektion zeigt alle effect-items
-   Liste mit Icon, Name, Edit- und Delete-Button
-   Nur im Kampf-Tab sichtbar
### GM-Massen-Dialog
-   Tab pro NPC mit Actor-Name
-   Jeder Tab hat eigene Eingabefelder
-   "Würfel alle" würfelt für alle NPCs
-   Bei 2 Würfeln werden Tabs markiert
-   NPCs ohne Bearbeitung bekommen nur Standard-INI (kein Effect)
-   Fortschrittsanzeige "X von Y NPCs bearbeitet"

### Kompendium
-   Kompendium nenneke.nenneke-aktionen in module.json definiert
-   Aktionen werden korrekt geladen
-   item.system.description wird unter Dropdown angezeigt
-   Keine automatische Erstellung von Standardaktionen

### Performance und Robustheit
-   Keine Performance-Probleme bei bis zu 10 NPCs
-   Fehlerbehandlung bei fehlenden Pfaden/Items
-   Validierung aller Eingabefelder
-   Alte Effects werden vor neuen entfernt
-   Kompatibel mit Foundry v12

------------------------------------------------------------

**Dokumentversion**: Final 2.0
**System**: Exklusiv für Ilaris
**Foundry Version**: v12
**Sprache**: Deutsch
**Modul-Namespace**: nenneke

## Besondere Anforderungen:

-   Dialog-Persistenz in actor.flags.nenneke.dialogState bis Bestätigung
-   Nachträgliches Öffnen via normaler INI-Button (Check: combatant.initiative === null)
-   PC-Dialog: Aktionen aus Inventory UND Kompendium nenneke.nenneke-aktionen
-   NPC-Dialog: Nur aus Kompendium, Tab-Interface, "Würfel alle"-Button
-   Negative INI: Duration 2 Runden, Rundenende-Dialog, Eingabefelder disabled
-   Chat-Message: Einfache Text-Message mit Initiative-Aufschlüsselung, Aktionen, Modifikatoren
-   Kampf-Tab: Umbenennung, Aktionen-Liste mit effect-items
-   2-Würfel-Tooltip: "Man kann irgendein Ergebnis von den beiden wählen"
-   Effect: "Kampf-Modifikatoren Runde X", Icon: icons/svg/dice-target.svg

Diese Spezifikation dient als Grundlage für die Implementierung durch einen Coding-Agent. Alle Anforderungen sind vollständig spezifiziert, eindeutig und auf Deutsch für Foundry VTT v12 mit Ilaris-System