# Plan: Vollständige Foundry-v13-Migration der Alternative Sheets

## 1. Objective

Einen belastbaren Abschlussplan für die vollständige Foundry-v13-Migration der Alternative Sheets erstellen, der offene Punkte prüft, dokumentiert und anschließend in sinnvoller Reihenfolge behebt.

## 1.1 Ausführungsstatus (2026-03-31)

- [x] Step 1 ausgeführt (Ist-Zustand gegen Code geprüft)
- [x] Step 2 ausgeführt (Restpunktliste konsolidiert)
- [x] Step 3 ausgeführt (statische Inkonsistenzen in Metadaten behoben)
- [x] Step 4 vorbereitet und per statischer Prüfung abgearbeitet, ohne neue fixbare Sheet-Defekte
- [x] Step 5 ausgeführt (Dokumentation mit aktuellem Stand synchronisiert)
- [ ] Step 6 offen (manueller Abschlusscheck durch Maintainer)

### Verifizierte Ergebnisse aus Step 1-4

- Die Alternativ-Sheets nutzen AppV2-Strukturen (`DEFAULT_OPTIONS`, `PARTS`, `TABS`, `_prepareContext`, `_onRender`, Actions).
- Die Sheet-Registrierung in `module.js` verwendet weiterhin die in Foundry v13 dokumentierte API über `foundry.documents.collections.Actors.registerSheet(...)`.
- Im direkten Sheet-/Komponenten-Scope wurden keine verbleibenden jQuery- oder V1-Dialog-Aufrufe als aktive Implementierung gefunden.

### Umgesetzter Fix aus Step 3

- `package.json` harmonisiert:
   - `version` von `1.0.0` auf `1.0.12` angehoben (konsistent zu `module.json`)
   - `foundry.version` auf `13.0.0`
   - `foundry.minimumCoreVersion` auf `13`
   - `foundry.compatibleCoreVersion` auf `13`

### Aktuelle Restpunkte

- Manueller End-to-End-Lauf in Foundry v13 (Step 6) steht aus.
- Repository-weites Linting ist derzeit nicht grün wegen bestehender Altprobleme in `scripts/utilities.js` (Formatierung/Struktur), die außerhalb dieses gezielten Migrationsdurchlaufs liegen.

## 2. Assumptions

- Im Fokus stehen die beiden Alternativ-Sheets in `scripts/sheets/alternative-actor-sheet.js` und `scripts/sheets/alternative-creature-sheet.js`.
- Die bisherigen Migrationsdokumente beschreiben bereits einen weit fortgeschrittenen AppV2-Stand, müssen aber gegen den echten Code- und Laufzeitstatus verifiziert werden.
- Die Basisklassen aus dem Ilaris-System sind externe Abhängigkeiten und können in diesem Modul nur geprüft, nicht vollständig hier migriert werden.
- Der manuelle Abschlusscheck in Foundry v13 wird vom Maintainer selbst durchgeführt.
- Für die Freigabe als „vollständig migriert“ reichen Code-Claims in Specs nicht aus; maßgeblich sind konsistente Metadaten, ein widerspruchsfreier Codepfad und ein erfolgreich durchgeführter manueller Laufzeittest.

## 3. Steps

1. **What**: Den Ist-Zustand der Migration gegen die aktuelle Codebasis verifizieren und alle vorhandenen Migrationsdokumente auf veraltete oder widersprüchliche Aussagen prüfen.
   **Where**: `scripts/sheets/`, `scripts/components/`, `module.js`, `module.json`, `package.json`, `docs/_specs/MIGRATION_FINDINGS_APPV2.md`, `docs/_specs/MIGRATION_PROGRESS_APPV2.md`, `docs/_specs/MIGRATION_SESSION_2_PROGRESS.md`
   **Who**: code
   **Depends on**: none

2. **What**: Eine konsolidierte Restpunktliste pflegen, die nur echte, noch nicht abgeschlossene v13-Themen enthält. Dabei zwischen technischen Blockern, funktionalen Risiken und reinen Dokumentationspunkten unterscheiden.
   **Where**: `docs/_specs/MIGRATION_V13_COMPLETION_PLAN.md`
   **Who**: docs
   **Depends on**: 1

3. **What**: Statische und deklarative Inkonsistenzen zuerst beheben. Dazu gehören insbesondere Versions- und Kompatibilitätsangaben sowie Registrierungs- und Initialisierungspfade, die nicht sauber zum deklarierten v13-Stand passen.
   **Where**: `package.json`, `module.json`, `module.js`
   **Who**: code
   **Depends on**: 2

4. **What**: Danach die Sheet-spezifischen Restpunkte in fachlicher Reihenfolge beheben: zuerst Render-/Öffnungsprobleme, dann Actions und Dialoge, danach Tabs, DragDrop, Effekte, State-Persistenz und sonstige Interaktionen.
   **Where**: `scripts/sheets/`, `scripts/components/`, `templates/sheets/`, `templates/components/`
   **Who**: code
   **Depends on**: 3

5. **What**: Nach jedem Fix die Restpunktliste aktualisieren und den betroffenen Bereich erneut gegen die vorhandenen Migrationsnotizen spiegeln, damit die Dokumentation nicht wieder vom Code wegdriftet.
   **Where**: `docs/_specs/MIGRATION_V13_COMPLETION_PLAN.md`
   **Who**: docs
   **Depends on**: 4

6. **What**: Den abschließenden manuellen v13-Check in Foundry durchführen und das Ergebnis dokumentieren. Dieser Schritt wird nicht automatisiert, sondern vom Maintainer selbst ausgeführt.
   **Where**: Laufende Foundry-v13-Instanz plus `docs/_specs/MIGRATION_V13_COMPLETION_PLAN.md`
   **Who**: user
   **Depends on**: 5

## 4. Validation Plan

### Für Step 1

- Codevergleich zwischen aktuellen Sheet-Dateien und bestehenden Migrationsdokumenten.
- Erwartetes Ergebnis: bestätigte Liste mit „bereits migriert“, „offen“ und „behauptet, aber nicht verifiziert“.

### Für Step 2

- Review der Restpunktliste auf Eindeutigkeit, Priorisierung und Reproduzierbarkeit.
- Erwartetes Ergebnis: ein einziges aktuelles Arbeitsdokument ohne widersprüchliche Statusaussagen.

### Für Step 3

- `npm run lint`
- Sichtprüfung der Metadaten und Registrierungslogik.
- Erwartetes Ergebnis: keine offenkundigen Widersprüche mehr zwischen `package.json`, `module.json` und der Modulinitialisierung.

### Für Step 4

- Nach jeder Fix-Runde `npm run lint`.
- Betroffene Funktionen lokal erneut prüfen, soweit ohne vollständige Foundry-Laufzeit möglich.
- Erwartetes Ergebnis: die dokumentierten Restpunkte werden nacheinander abgebaut, ohne bereits bereinigte Bereiche erneut zu beschädigen.

### Für Step 5

- Jede erledigte Maßnahme direkt im Plan abhaken oder als erledigt markieren.
- Erwartetes Ergebnis: Plan und Implementierungsstand bleiben synchron.

### Für Step 6

- Manueller Check in Foundry v13 durch den Maintainer.
- Mindestens zu prüfen:
  - Actor Sheet öffnet ohne Fehler.
  - Creature Sheet öffnet ohne Fehler.
  - Tabwechsel funktioniert.
  - Actions und Dialoge reagieren korrekt.
  - Form-Updates werden gespeichert.
  - DragDrop funktioniert.
  - Effektbibliothek und Effekt-Stacking funktionieren.
  - Accordion/Favorites bleiben stabil über Re-Render.
  - Browser-Konsole bleibt frei von relevanten Fehlern.
- Erwartetes Ergebnis: Abschlussfreigabe für v13 oder eine klar begrenzte Restfehlerliste mit Reproduktion.

## 5. Delegation Map

| Step | Specialist | Input | Expected Output |
| ---- | ---------- | ----- | --------------- |
| 1 | code | Aktueller Sheet-Code, Modul-Metadaten, bestehende Migrationsdokumente | Verifizierte Ist-Analyse mit belastbarer Restpunktbasis |
| 2 | docs | Ergebnis aus Step 1 | Konsolidierte Restpunktliste in dieser Datei |
| 3 | code | Restpunktliste aus Step 2 | Bereinigte statische und deklarative v13-Inkonsistenzen |
| 4 | code | Bereinigter Stand aus Step 3 | Sequenziell gefixte Sheet-Restpunkte |
| 5 | docs | Ergebnisse aus Step 4 | Aktualisierte Plan-Datei mit sauberem Status |
| 6 | user | Finaler Code-Stand aus Step 5 | Manueller Abschlusscheck und dokumentiertes Ergebnis |

## Konkrete Startreihenfolge

1. `package.json` gegen `module.json` abgleichen.
2. `module.js` auf verbleibende v13-Risiken in Registrierung und Initialisierung prüfen.
3. Bestehende Migrationsdokumente auf veraltete Claims reduzieren.
4. Danach nur noch echte Laufzeit- oder Interaktionsfehler an den beiden Sheets fixen.
5. Zum Schluss den manuellen Foundry-v13-Check durchführen und das Ergebnis in dieser Datei nachtragen.

## Ergebnisprotokoll für den manuellen Abschlusscheck (durch Maintainer)

Datum:

Foundry-Version:

Ilaris-System-Version:

### Checkliste

- [ ] Actor Sheet öffnet fehlerfrei
- [ ] Creature Sheet öffnet fehlerfrei
- [ ] Tabwechsel funktioniert
- [ ] Actions funktionieren (inkl. Schips)
- [ ] Dialoge funktionieren und speichern
- [ ] DragDrop funktioniert
- [ ] Effektbibliothek/Stacking funktioniert
- [ ] Accordion/Favorites bleiben stabil
- [ ] Browser-Konsole ohne relevante Fehler

### Ergebnis

- [ ] Freigabe für v13
- [ ] Restfehler dokumentiert

Notizen: