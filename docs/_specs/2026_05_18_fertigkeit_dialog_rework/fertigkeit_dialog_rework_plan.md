# 1. Objective

Das Modul soll den im alternativen Heldenbogen aus dem Fertigkeiten-Tab gestarteten Fertigkeitsdialog um ein temporäres Dropdown mit den vier Optionen `nichts`, `Material sammeln`, `Gegenstand herstellen` und `Gegenstand einkaufen` erweitern, ohne Systemdateien zu ändern, und das Dialog-Styling soll konsistent zum Modul in Light- und Dark-Mode sein.

# 2. Context & Research Summary

- Das alternative Modul verwendet im Fertigkeiten-Tab bereits `data-rolltype="fertigkeit_diag"` für die Skill-Icons in `templates/sheets/character/tabs/skills-tab.hbs`; damit wird derselbe Systemdialog wie im Grundsystem geöffnet.
- Der Click läuft nicht im Modul, sondern über die vererbte Sheet-Aktion `rollable` aus `systems/Ilaris/scripts/actors/sheets/actor.js`; dort delegiert `onRollable` für `fertigkeit_diag` an `wuerfelwurf(target, actor)` in `systems/Ilaris/scripts/dice/wuerfel.js`.
- `wuerfelwurf` instanziiert für `fertigkeit_diag` direkt `FertigkeitDialog` aus `systems/Ilaris/scripts/skills/dialogs/fertigkeit.js` und rendert dessen Template `systems/Ilaris/scripts/skills/templates/dialogs/fertigkeit.hbs`.
- Der Systemdialog ist bereits AppV2-basiert, hat ein einzelnes Template-Part, bindet seine `input`- und `select`-Elemente zentral in `_onRender()` und berechnet alle Vorschauwerte über `_calculateModifiers()`. Das ist günstig für eine modul-eigene Unterklasse oder einen gezielten Ersatzdialog.
- Offizielle Foundry-AppV2-Hooks erlauben zwar DOM-Manipulation über `renderApplicationV2` bzw. klassenspezifische Render-Hooks, aber diese Variante wäre hier nur ein nachgelagerter Eingriff in fremdes HTML und müsste zusätzlich Roll-Ausführung und Zustandsermittlung patchen.
- Die Modul-Themes liegen aktuell in `styles/module.css`, sind aber auf `.ilaris.sheet.actor.alternative` und `body.theme-dark .ilaris.sheet.actor.alternative` gescoped. Diese Variablen greifen daher nicht automatisch für eigenständige Dialogfenster.
- Es existiert mit `styles/initiative-dialog.css` ein dialog-spezifisches Styling-Vorbild, aber die Datei ist derzeit weder in `module.json` registriert noch in `module.js` injiziert. Für das neue Dialog-Styling muss die Lade-Strategie daher bewusst festgelegt werden.
- Der Nutzerwunsch ist explizit auf das Modul begrenzt, soll nur temporär im Dialog gelten, für alle Benutzer gelten, die den Dialog öffnen können, und zunächst spätere Logik vorbereiten statt bereits Herstellungsregeln umzusetzen.

## Vergleich der realistischen Modul-Optionen

1. Render-Hook auf den bestehenden Systemdialog
   - Vorteil: kein eigener Dialog-Klon, schneller Prototyp.
   - Nachteil: schwer sauber nur auf Modul-Kontext zu begrenzen, DOM-Injektion in fremdes Template, zusätzliche Eingriffe in Roll-Ausführung nötig, höheres Drift-Risiko bei Systemupdates.

2. Modul-eigener Dialog als Unterklasse oder enger Fork des Systemdialogs
   - Vorteil: sauber auf den Fertigkeiten-Tab des Moduls begrenzbar, eigener Template- und Styling-Besitz, spätere Logik kann strukturiert vorbereitet werden.
   - Nachteil: ein Teil der Systemdialog-Logik wird im Modul gespiegelt und muss bei Systemänderungen beobachtet werden.

3. Monkey-Patch von `wuerfelwurf` oder `FertigkeitDialog`
   - Vorteil: zentraler Eingriff.
   - Nachteil: globaler Seiteneffekt, schwer wartbar, unnötig riskant für ein modul-lokales Rework.

## Empfohlene Richtung

Option 2 ist die bevorzugte Implementierungsstrategie: Das Modul soll für seine eigenen Fertigkeits-Tab-Auslöser einen modul-eigenen Fertigkeitsdialog öffnen, der den Systemdialog eng nachbildet und nur um den Auswahlkontext ergänzt. Damit bleibt die Änderung lokal zum Modul, die spätere Logik bekommt einen klaren Erweiterungspunkt, und das Theme kann kontrolliert im Modul gepflegt werden.

## Constraints und Risiken

- Das Modul darf keine Systemdateien modifizieren; alle Änderungen müssen im Modul selbst liegen.
- Die Dropdown-Auswahl soll nicht persistiert werden; deshalb sind Actor- oder Item-Flags für den eigentlichen Wert nicht notwendig.
- Wenn der Dialog im Modul als Unterklasse geführt wird, muss bei Systemupdates geprüft werden, ob `_calculateModifiers()`, `_executeRoll()` oder das Template des Originals fachlich geändert wurden.
- Die offizielle API-Recherche erfolgte auf der aktuellen Foundry-Dokumentation; das Modul zielt laut `module.json` auf Kompatibilität 13. Bei Einsatz von generischen AppV2-Hooks wäre deshalb ein Laufzeittest in der lokalen Foundry-Version besonders wichtig.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `scripts/apps/fertigkeit-dialog.js` | create | Modul-eigene Dialogklasse als lokaler Ersatz bzw. Unterklasse des Systemdialogs mit zusätzlichem Auswahlkontext |
| `templates/apps/fertigkeit-dialog.hbs` | create | Modul-eigenes Dialogtemplate mit zusätzlichem Dropdown und konsistenter Struktur zum Original |
| `styles/fertigkeit-dialog.css` | create | Dialog-spezifisches Styling für Light- und Dark-Mode im Modul-Look |
| `scripts/sheets/alternative-actor-sheet.js` | modify | Eigene Roll-Routing-Logik für Fertigkeiten-Tab-Auslöser, damit nur das Modul den erweiterten Dialog verwendet |
| `templates/sheets/character/tabs/skills-tab.hbs` | modify | Optionaler expliziter Marker für modul-eigene Dialogauslöser bzw. eindeutige Scope-Abgrenzung im Fertigkeiten-Tab |
| `module.js` | modify | Template-Preload und Initialisierung der neuen Dialogintegration |
| `module.json` | modify | Registrierung der neuen Dialog-CSS, falls sie nicht in `styles/module.css` integriert wird |

# 4. Steps

1. Basisdialog im Modul anlegen
   - **What**: Eine modul-eigene Dialogklasse erstellen, die die bestehende Systemlogik für Fertigkeits-, freie Fertigkeits- und Attributprobe eng übernimmt, aber den Auswahlkontext als zusätzliche, nicht persistierte Dialogeigenschaft vorbereitet. Die Klasse soll eine zentrale Methode für den gewählten Nutzungskontext bereitstellen, damit spätere Herstellungslogik nicht direkt an DOM-Selektoren hängt.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `none`
   - **Reference**: `systems/Ilaris/scripts/skills/dialogs/fertigkeit.js`, `systems/Ilaris/scripts/dice/wuerfel.js`

2. Dialog-Template mit Dropdown ergänzen
   - **What**: Das bestehende Systemtemplate in ein Modultemplate überführen und ein Dropdown mit exakt vier Optionen ergänzen: `nichts` als Default, `Material sammeln`, `Gegenstand herstellen`, `Gegenstand einkaufen`. Das Dropdown soll in dieselbe Live-Update-Mechanik eingebunden sein wie die bestehenden `input`- und `select`-Felder.
   - **Where**: `templates/apps/fertigkeit-dialog.hbs`
   - **Who**: `code`
   - **Depends on**: `1`
   - **Reference**: `systems/Ilaris/scripts/skills/templates/dialogs/fertigkeit.hbs`

3. Zukünftige Logik sauber vorbereiten
   - **What**: In der Modul-Dialogklasse eine kleine, strukturierte Repräsentation des Auswahlkontexts definieren, z. B. als normierten String-Wert oder Mapping. Bei der Roll-Ausführung soll dieser Wert bereits an einer zentralen Stelle verfügbar sein. Falls noch keine Regelmechanik umgesetzt wird, soll der Wert mindestens in die Roll-Zusammenfassung oder in einen modul-eigenen Hook-Payload aufgenommen werden, damit die Erweiterung später ohne erneuten UI-Umbau nutzbar bleibt.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `1`, `2`
   - **Reference**: `systems/Ilaris/scripts/skills/dialogs/fertigkeit.js`, `https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html`

4. Modul-Sheet auf den neuen Dialog routen
   - **What**: Im alternativen Actor-Sheet die Roll-Action so erweitern oder überschreiben, dass Aufrufe aus dem Modul-Fertigkeiten-Tab den neuen Moduldialog öffnen, während andere Rolltypen und andere Bereiche weiterhin an das bestehende Systemverhalten delegiert werden. Die Scope-Abgrenzung soll bewusst eng sein: nur Auslöser aus dem Fertigkeiten-Tab des Moduls.
   - **Where**: `scripts/sheets/alternative-actor-sheet.js`, optional `templates/sheets/character/tabs/skills-tab.hbs`
   - **Who**: `code`
   - **Depends on**: `1`, `2`, `3`
   - **Reference**: `scripts/sheets/alternative-actor-sheet.js`, `systems/Ilaris/scripts/actors/sheets/actor.js`, `templates/sheets/character/tabs/skills-tab.hbs`

5. Styling für Light- und Dark-Mode anbinden
   - **What**: Dialog-spezifische CSS-Regeln anlegen, die denselben visuellen Ton wie das Modul verwenden. Dafür entweder eine eigene Dialog-Theme-Klasse mit den benötigten Farbvariablen für beide Modi anlegen oder die relevanten Variablen aus `styles/module.css` gezielt für den Dialog neu definieren. Das Dropdown, Labels, Warntexte, Container und Fokuszustände müssen in beiden Modi lesbar und konsistent sein.
   - **Where**: `styles/fertigkeit-dialog.css`, optional `module.json` oder alternativ `styles/module.css`
   - **Who**: `code`
   - **Depends on**: `2`
   - **Reference**: `styles/module.css`, `styles/initiative-dialog.css`, `https://foundryvtt.com/api/functions/hookEvents.renderApplicationV2.html`

6. Modul-Initialisierung und Asset-Registrierung abschließen
   - **What**: Das Modul so anpassen, dass das neue Dialogtemplate verfügbar ist und das Dialog-Styling zuverlässig geladen wird. Wenn ein separates Stylesheet verwendet wird, muss es in `module.json` aufgenommen oder bewusst zur Laufzeit injiziert werden. Zusätzlich sollen notwendige Imports für den neuen Dialog sauber an bestehende Modulstrukturen angeschlossen werden.
   - **Where**: `module.js`, `module.json`
   - **Who**: `code`
   - **Depends on**: `1`, `2`, `5`
   - **Reference**: `module.js`, `module.json`

7. Regressionen und Scope-Verhalten prüfen
   - **What**: Verifizieren, dass nur die Skill-Dialoge aus dem Modul-Fertigkeiten-Tab das neue Dropdown erhalten, dass freie Fertigkeiten denselben Auswahlkontext bieten, dass Attribute oder andere systemeigene Dialogpfade nicht unbeabsichtigt verändert wurden, und dass das Dropdown bei jedem Öffnen wieder mit `nichts` startet.
   - **Where**: Betroffene Dateien aus Abschnitt 3 sowie manuelle Prüfung in Foundry
   - **Who**: `code`
   - **Depends on**: `4`, `5`, `6`
   - **Reference**: `templates/sheets/character/tabs/skills-tab.hbs`, `systems/Ilaris/scripts/dice/wuerfel.js`

# 5. Validation Plan

## Step 1-3

- **Command**: `npm run lint`
- **Manual check**: Öffnen einer Fertigkeit aus dem Modul-Fertigkeiten-Tab; der neue Dialog rendert ohne Fehler und zeigt das Dropdown mit Default `nichts`.
- **Expected outcome**: Keine ESLint-Fehler im neuen Dialogcode; Dialog öffnet stabil für reguläre und freie Fertigkeiten.

## Step 4

- **Command**: `npm run lint`
- **Manual check**: Klick auf Skill-Icons im Modul-Fertigkeiten-Tab öffnet den Moduldialog; andere Rolltypen im Sheet funktionieren unverändert weiter.
- **Expected outcome**: Modul-Skills verwenden den neuen Dialog, Attribut- oder Kampfdialoge verhalten sich weiterhin wie zuvor.

## Step 5-6

- **Command**: `npm run lint`
- **Manual check**: Foundry einmal mit hellem und einmal mit dunklem Theme starten; Dialoghintergrund, Texte, Select-Feld und Fokuszustände sind konsistent und lesbar.
- **Expected outcome**: Das Dialog-Styling folgt klar dem Modul-Look in beiden Modi; CSS wird zuverlässig geladen.

## Step 7 / Gesamtvalidierung

- **Command**: `npm test`
- **Command**: `npm run lint`
- **Manual check**: 
  - Alternative Heldensheet öffnen.
  - Im Fertigkeiten-Tab mehrere profane Fertigkeiten und freie Fertigkeiten testen.
  - Prüfen, dass die Auswahl beim erneuten Öffnen nicht persistiert wird.
  - Prüfen, dass die spätere Logik vorbereitet ist, z. B. durch sichtbare Roll-Zusammenfassung oder Hook-Payload mit Auswahlwert.
- **Expected outcome**: Keine Test- oder Lint-Regressionen im Modul; der neue Kontext ist nur temporär, sauber scoping-begrenzt und UI-seitig vollständig integriert.

# 6. Assumptions & Open Questions

## Assumptions

- Gemeint sind die Fertigkeitsdialoge, die aus dem alternativen Heldenbogen des Moduls im Fertigkeiten-Tab geöffnet werden.
- Die Auswahl soll derzeit keine Regelwerte verändern, aber technisch so vorbereitet sein, dass spätere Herstellungs- oder Einkaufslogik sauber andocken kann.
- `nichts` ist der Standardwert bei jedem neuen Öffnen des Dialogs.
- Eine modul-eigene Dialogklasse ist akzeptabel, auch wenn sie einen Teil der Systemdialog-Logik spiegelt.

## Open Questions

- Soll der gewählte Nutzungskontext schon jetzt im Chat sichtbar sein oder nur intern für spätere Logik verfügbar sein? Der Plan lässt beide Varianten zu, bevorzugt aber Sichtbarkeit im Rolltext oder Hook-Payload zur einfacheren Verifikation.
- Falls das Modul später weitere Sheet-Typen mit demselben Dialog erweitert, sollte dann dieselbe Dialogklasse wiederverwendet oder die Scope-Regel nochmals verengt werden?
- Falls das Team eine stärkere Vermeidung von Code-Duplikation will, müsste nach der Erstumsetzung geprüft werden, ob eine robust genug scoping-begrenzte Hook-Lösung doch sinnvoll ist.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Systemdialog-Klasse und System-`wuerfelwurf` als Referenz | Modul-eigene Dialogklasse mit vorbereitetem Nutzungskontext |
| 2 | code | Original-Template und gewünschte vier Optionen | Modul-Template mit Dropdown und Default `nichts` |
| 3 | code | Dialogklasse aus Schritt 1 und Nutzerwunsch „spätere Logik vorbereiten“ | Zentral verfügbarer, normierter Auswahlwert für spätere Logik |
| 4 | code | Alternatives Sheet und Skills-Tab-Markup | Modul-lokales Routing auf den neuen Dialog ohne globale Seiteneffekte |
| 5 | code | Modul-Farbvariablen und Dialog-Layout | Light-/Dark-Mode-Styling im Modul-Look |
| 6 | code | Neue Dialogdateien und bestehende Modulinitialisierung | Geladene Templates, Imports und Styles ohne Asset-Lücken |
| 7 | code | Vollständige Änderung aus Schritt 1-6 | Validiertes, scoped Fertigkeitsdialog-Rework ohne Regression in anderen Dialogen |
