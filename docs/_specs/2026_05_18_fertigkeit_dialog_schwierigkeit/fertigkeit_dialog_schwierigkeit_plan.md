# 1. Objective

Der bereits im Modul vorhandene alternative Fertigkeitsdialog soll um ein kontextabhängiges Feld `Schwierigkeit` erweitert werden, das nur für `Material sammeln`, `Gegenstand herstellen` und `Gegenstand einkaufen` erscheint und bei gesetzter Schwierigkeit die bestehende Ilaris-Würfellogik mit `success_val` für automatische Erfolgs-/Misserfolgsanzeige verwendet.

# 2. Context & Research Summary

- Der ursprünglich geplante Dialog-Ersatz ist im Modul bereits umgesetzt: `scripts/apps/fertigkeit-dialog.js` rendert ein eigenes AppV2-Fenster mit `templates/apps/fertigkeit-dialog.hbs`, und `scripts/sheets/alternative-actor-sheet.js` routet nur Auslöser mit `data-rollscope="module-skills-dialog"` auf diesen Dialog.
- Das Modul importiert bereits `roll_crit_message` aus `systems/Ilaris/scripts/dice/wuerfel_misc.js`. Diese Systemfunktion unterstützt schon heute einen optionalen Parameter `success_val` und ruft intern `evaluateCriticalResults(...)` auf.
- `evaluateCriticalResults` ist im System nicht direkt exportiert, aber die für diesen Ausbau relevante Funktionalität ist über `roll_crit_message(formula, label, text, speaker, rollmode, crit_eval, fumble_val, success_val)` bereits erreichbar. Für den Modulplan ist deshalb kein Systempatch nötig und auch keine Umleitung auf eine andere Foundry-Standardmethode.
- Der aktuelle Moduldialog kennt bereits `usageContext` mit den drei gewünschten Herstellungs-/Einkaufsoptionen plus `none`. Damit ist der richtige lokale Steuerpunkt vorhanden: Sichtbarkeit, Defaultwert und Rollpfad können vollständig im Modul-Dialog entschieden werden.
- Das Dialog-Template enthält bisher nur `Nutzung`, `Hohe Qualität` und `Modifikator`. Das Feld `Schwierigkeit` muss neu ergänzt und an dieselbe Live-Update-Mechanik (`change`/`input` -> `_handleInputChange()` -> `_updateModifierDisplay()`) angeschlossen werden.
- Das Dialog-Styling ist bereits separat in `styles/fertigkeit-dialog.css` registriert und in `module.json` eingebunden. Für die neue Erweiterung sind daher voraussichtlich nur kleine Layout-Anpassungen nötig, keine neue Asset-Registrierung.
- Die in den Planner-Vorgaben genannten `.agents`-Dokumente (`CODEBASE_ARCHITECTURE`, `PATTERNS_AND_EXAMPLES`, `GLOSSARY`) sind in diesem Workspace nicht vorhanden; die Recherche stützt sich deshalb auf die realen Moduldateien, den bestehenden Spec-Plan und die Ilaris-Systemdatei `wuerfel_misc.js`.
- Die Foundry-AppV2-Dokumentation bestätigt, dass `_prepareContext()` und `_onRender()` die korrekten Erweiterungspunkte für kontextabhängige Dialogdaten und DOM-gebundene Reaktionslogik bleiben. Ein Wechsel auf andere Application-Typen ist für diese Erweiterung nicht erforderlich.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `scripts/apps/fertigkeit-dialog.js` | modify | Zustandslogik für Schwierigkeit, bedingte Sichtbarkeit, Zahlenvalidierung, Zusammenfassung und Umschalten auf `success_val` ergänzen |
| `templates/apps/fertigkeit-dialog.hbs` | modify | Neues Feld `Schwierigkeit` unter dem Dropdown `Nutzung` einfügen, inkl. statischer bzw. editierbarer Variante je nach Auswahl |
| `styles/fertigkeit-dialog.css` | modify | Optional notwendige Layout-Regeln für das zusätzliche Feld und deaktivierte/readonly Darstellung ergänzen |

# 4. Steps

1. Schwierigkeit als abgeleiteten Dialogzustand definieren
   - **What**: Die Dialogklasse so erweitern, dass aus dem gewählten `usageContext` zentral abgeleitet wird, ob eine Schwierigkeit aktiv ist, ob sie fest auf `16` gesetzt wird oder als editierbares Zahlenfeld geführt wird, und welcher effektive Schwierigkeitswert an die Würfellogik geht. Die Ableitung soll nicht an Template-Strings verstreut sein, sondern in einer kleinen Hilfsmethode oder strukturierten Rückgabe liegen.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `none`
   - **Reference**: `scripts/apps/fertigkeit-dialog.js`, `systems/Ilaris/scripts/dice/wuerfel_misc.js`

2. Dialog-Template um das bedingte Feld `Schwierigkeit` ergänzen
   - **What**: Unter dem vorhandenen Dropdown `Nutzung` ein neues Feld mit dem Label `Schwierigkeit` ergänzen. Bei `Material sammeln` soll ein nicht editierbares Feld mit Wert `16` erscheinen. Bei `Gegenstand herstellen` und `Gegenstand einkaufen` soll ein Zahlen-Input mit Default `16` erscheinen. Bei `nichts` darf kein Schwierigkeitsfeld sichtbar sein.
   - **Where**: `templates/apps/fertigkeit-dialog.hbs`
   - **Who**: `code`
   - **Depends on**: `1`
   - **Reference**: `templates/apps/fertigkeit-dialog.hbs`, `scripts/apps/fertigkeit-dialog.js`

3. Live-Update und Zahlenvalidierung an den bestehenden Dialogfluss anbinden
   - **What**: Sicherstellen, dass ein Wechsel der Nutzung sofort die Sichtbarkeit und Art des Schwierigkeitsfeldes aktualisiert, dass freie Eingaben nur numerisch verarbeitet werden, und dass bei Umschalten zwischen Optionen konsistente Defaults gelten. Die bestehende Rechenvorschau soll nach jeder relevanten Änderung neu berechnet werden.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`, `templates/apps/fertigkeit-dialog.hbs`
   - **Who**: `code`
   - **Depends on**: `1`, `2`
   - **Reference**: `scripts/apps/fertigkeit-dialog.js` (`_onRender`, `_handleInputChange`, `_calculateModifiers`), Foundry `ApplicationV2` `_onRender`/`_prepareContext`

4. Roll-Ausführung bei aktiver Schwierigkeit auf den Ilaris-Erfolgswertpfad umschalten
   - **What**: Die Roll-Logik des Moduldialogs so anpassen, dass bei aktiver Schwierigkeit der ermittelte Wert als `success_val` an `roll_crit_message` übergeben wird, damit das Ilaris-System intern `evaluateCriticalResults` gegen diese Schwierigkeit auswertet. Der bestehende Rollpfad ohne Schwierigkeit muss unverändert bleiben. Zusätzlich soll der gewählte Nutzungskontext und die effektive Schwierigkeit in Text/Hook-Payload an zentraler Stelle verfügbar sein.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `1`, `3`
   - **Reference**: `systems/Ilaris/scripts/dice/wuerfel_misc.js` (`roll_crit_message`, `evaluateCriticalResults`), `scripts/apps/fertigkeit-dialog.js` (`_executeRoll`)

5. Vorschau und UI-Text auf den neuen Rollmodus abstimmen
   - **What**: Die bestehende Zusammenfassung im rechten Bereich so erweitern, dass bei aktiver Schwierigkeit klar erkennbar ist, gegen welchen Zielwert gewürfelt wird und dass dieser Wert nicht versehentlich als normaler Modifikator behandelt wird. Die Darstellung soll zwischen festem Wert (`16`) und frei eingegebener Schwierigkeit unterscheiden, ohne zusätzliche Fachlogik in das Template zu verschieben.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`, optional `styles/fertigkeit-dialog.css`
   - **Who**: `code`
   - **Depends on**: `3`, `4`
   - **Reference**: `scripts/apps/fertigkeit-dialog.js` (`_updateModifierDisplay`), `styles/fertigkeit-dialog.css`

6. Layout für das zusätzliche Feld konsistent halten
   - **What**: Falls das neue Feld das bestehende Formular visuell bricht, kleine CSS-Anpassungen für Abstand, Breite und readonly/disabled Zustand ergänzen. Es sollen keine neuen Farbkonzepte eingeführt werden; das Feld soll sich unauffällig in das vorhandene Modul-Styling einfügen.
   - **Where**: `styles/fertigkeit-dialog.css`
   - **Who**: `code`
   - **Depends on**: `2`
   - **Reference**: `styles/fertigkeit-dialog.css`

7. Verhaltensgrenzen und Regressionen prüfen
   - **What**: Verifizieren, dass das Feld nur für die drei genannten Optionen erscheint, dass `Material sammeln` immer fest `16` nutzt, dass die beiden anderen Optionen standardmäßig `16` vorbelegen, dass nur Zahlen verarbeitet werden, und dass der Rollaufruf ohne Schwierigkeit weiterhin den bisherigen Pfad nutzt. Außerdem prüfen, dass das Routing im Sheet unverändert lokal auf den Modul-Fertigkeiten-Tab beschränkt bleibt.
   - **Where**: Betroffene Dateien aus Abschnitt 3 sowie manuelle Prüfung im alternativen Heldensheet
   - **Who**: `code`
   - **Depends on**: `4`, `5`, `6`
   - **Reference**: `scripts/sheets/alternative-actor-sheet.js`, `templates/sheets/character/tabs/skills-tab.hbs`, `scripts/apps/fertigkeit-dialog.js`

# 5. Validation Plan

## Step 1-3

- **Command**: `npm run lint`
- **Manual check**: Dialog aus dem Fertigkeiten-Tab öffnen, nacheinander `nichts`, `Material sammeln`, `Gegenstand herstellen` und `Gegenstand einkaufen` auswählen.
- **Expected outcome**: Das Feld `Schwierigkeit` erscheint nur für die drei relevanten Optionen, steht bei `Material sammeln` fest auf `16` und ist bei den beiden anderen Optionen numerisch editierbar mit Default `16`.

## Step 4

- **Command**: `npm run lint`
- **Manual check**: Je eine Probe mit aktiver Schwierigkeit und ohne Schwierigkeit auslösen.
- **Expected outcome**: Bei aktiver Schwierigkeit läuft der Aufruf über `roll_crit_message(..., success_val)` und der Chat zeigt Erfolg/Misserfolg nach Ilaris-Systemlogik an; ohne Schwierigkeit bleibt das bisherige Verhalten erhalten.

## Step 5-6

- **Command**: `npm run lint`
- **Manual check**: Dialog in hellem und dunklem Theme öffnen und das Umschalten der Optionen testen.
- **Expected outcome**: Das zusätzliche Feld fügt sich ohne Layoutbruch ein, readonly/editierbare Zustände sind klar und lesbar, und es entstehen keine neuen Theme-Inkonsistenzen.

## Step 7 / Gesamtvalidierung

- **Command**: `npm run lint`
- **Manual check**:
  - Alternativen Heldenbogen öffnen.
  - Im Fertigkeiten-Tab mehrere profane Fertigkeiten und freie Fertigkeiten testen.
  - Prüfen, dass der Vorschautext die Schwierigkeit korrekt widerspiegelt.
  - Prüfen, dass Eingaben wie leere Werte oder Nicht-Zahlen nicht zu fehlerhaften Rollformeln führen.
  - Prüfen, dass andere Dialoge und andere Rolltypen unverändert bleiben.
- **Expected outcome**: Keine Lint-Regressionen, korrekte bedingte Anzeige des Feldes, korrekte Ilaris-Erfolgsauswertung bei gesetzter Schwierigkeit und keine Scope-Ausweitung über den Modul-Dialog hinaus.

# 6. Assumptions & Open Questions

## Assumptions

- Die neue Schwierigkeit gilt nur für die drei bereits vorhandenen Nutzungskontexte und nicht für andere Probetypen oder zukünftige Optionen.
- Der feste Wert `16` für `Material sammeln` ist fachlich bewusst hart codiert und soll aktuell nicht über Settings oder Datenmodelle konfigurierbar sein.
- Das Zahlenfeld für `Gegenstand herstellen` und `Gegenstand einkaufen` soll nur temporär im Dialogzustand leben und nicht auf Actor- oder Item-Daten persistiert werden.
- Für die Erfolgs-/Misserfolgsanzeige genügt es, den bestehenden Systemhelfer `roll_crit_message` mit `success_val` zu nutzen; ein direkter Import oder Export von `evaluateCriticalResults` ist dafür nicht erforderlich.

## Open Questions

- Soll eine leere oder ungültige Eingabe im freien Schwierigkeitsfeld still auf `16` zurückfallen oder die Rollausführung aktiv blockieren? Der Nutzerwunsch deckt `nur Zahlen` ab, aber nicht das gewünschte Fehlverhalten bei leerem Feld.
- Soll die Schwierigkeit zusätzlich im Hook `ilaris-alternative-actor-sheet.fertigkeitDialogRolled` als eigenes Feld geführt werden, falls spätere Herstellungslogik direkt daran andocken soll? Für die Umsetzung ist das sinnvoll, aber noch nicht explizit gefordert.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehende Dialogklasse und vorhandene `usageContext`-Logik | Zentral abgeleiteter Schwierigkeitszustand im Moduldialog |
| 2 | code | Aktuelles Dialog-Template und Anforderung für drei bedingte Varianten | Erweiterte Dialog-UI mit Feld `Schwierigkeit` unter `Nutzung` |
| 3 | code | Neue UI-Elemente und bestehende Live-Update-Mechanik | Stabile Sichtbarkeits- und Zahlenlogik ohne Template-Spaghetti |
| 4 | code | Ilaris-Systemhelfer `roll_crit_message` mit `success_val` | Rollpfad mit automatischer Erfolgs-/Misserfolgsanzeige bei aktiver Schwierigkeit |
| 5 | code | Bestehende Vorschau im rechten Panel | Verständliche Vorschau mit sichtbarem Zielwert statt missverständlichem Modifikator |
| 6 | code | Vorhandenes Dialog-CSS | Kleine Layout-Anpassungen ohne neues Theme-Konzept |
| 7 | code | Vollständige Änderung aus Schritt 1-6 | Verifizierte Erweiterung ohne Regression in anderen Modul-Dialogen |