# 1. Objective

Die drei systemseitigen Combat-Dialoge fuer Angriff, Fernkampf und Uebernatuerlich sollen im Modul per reinem, sauber gescoptem CSS an das bestehende Light-/Dark-Mode-Farbschema des Fertigkeit-Dialogs angepasst werden, ohne Funktionalitaet oder Templates zu aendern.

# 2. Context & Research Summary

- Die im Planner-Prozess vorgesehenen Dateien `.agents/CODEBASE_ARCHITECTURE.md`, `.agents/PATTERNS_AND_EXAMPLES.md` und `.agents/GLOSSARY.md` sind in diesem Workspace nicht vorhanden; die Planung basiert deshalb auf den real vorhandenen Modul- und Systemdateien.
- Das Modul hat mit `styles/fertigkeit-dialog.css` bereits ein klares Vorbild fuer dialogbezogene Theming-Styles: root-gescopte CSS-Variablen, Dark-Mode-Ueberschreibung ueber `body.theme-dark` und descendant-basierte Styles innerhalb einer eindeutigen Root-Klasse.
- Die drei Ziel-Dialoge gehoeren weiterhin zum Basis-System Ilaris und werden im Modul nicht durch eigene Klassen ersetzt. Das Modul delegiert alle relevanten Rolltypen ausser `fertigkeit_diag` an das System weiter.
- Die drei Dialogklassen besitzen stabile, selektierbare Root-Klassen aus dem System: `.ilaris.combat-dialog.angriff-dialog`, `.ilaris.combat-dialog.fernkampf-dialog` und `.ilaris.combat-dialog.uebernatuerlich-dialog`.
- Die drei System-Templates teilen eine weitgehend identische Struktur (`.combat-dialog-container`, `.left-column`, `.right-column`, `.target-selection-container`, `.maneuver-header`, `.modifier-summary-container`, `.clickable-summary`). Dadurch kann die Umsetzung in einer neuen, gemeinsamen CSS-Datei erfolgen, ohne Template-Aenderungen zu benoetigen.
- Das Modul laedt Styles zentral ueber `module.json`; eine neue CSS-Datei kann dort registriert werden, ohne JavaScript anzupassen.
- Hauptrisiko: Die Styling-Oberflaeche haengt an System-Markup und System-Klassennamen. Solange diese unveraendert bleiben, ist ein CSS-only-Override aus dem Modul robust genug.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `module.json` | modify | Neue Combat-Dialog-CSS-Datei im Modul registrieren, damit die Styles global geladen werden. |
| `styles/combat-dialog.css` | create | Neues, ausschliesslich auf die drei Combat-Dialoge gescoptes Light-/Dark-Mode-Styling implementieren. |

# 4. Steps

1. **What**: Eine neue dedizierte Stylesheet-Datei fuer Combat-Dialoge anlegen und den Scope auf die drei systemseitigen Root-Klassen festlegen. Gemeinsame Design-Tokens fuer Light- und Dark-Mode innerhalb dieser Datei definieren, orientiert am Farbschema und Variablenmuster des Fertigkeit-Dialogs.
   **Where**: `styles/combat-dialog.css`
   **Who**: code
   **Depends on**: none
   **Reference**: `styles/fertigkeit-dialog.css`; System-Root-Klassen aus `Data/systems/Ilaris/scripts/combat/dialogs/angriff.js`, `Data/systems/Ilaris/scripts/combat/dialogs/fernkampf-angriff.js`, `Data/systems/Ilaris/scripts/combat/dialogs/uebernatuerlich.js`

2. **What**: Gemeinsame Layout- und Oberflaechen-Styles fuer die drei Dialoge umsetzen: Fensterhintergrund, Panel-Flaechen, Rahmen, Textfarben, Input-/Select-Styling, Fokus-Zustaende, Summary-Bloecke und responsive Spaltenlogik. Selektoren nur ueber die drei Combat-Dialog-Roots und deren gemeinsame Descendants aufbauen.
   **Where**: `styles/combat-dialog.css`
   **Who**: code
   **Depends on**: 1
   **Reference**: `styles/fertigkeit-dialog.css`; `Data/systems/Ilaris/scripts/combat/templates/dialogs/angriff.hbs`; `Data/systems/Ilaris/scripts/combat/templates/dialogs/fernkampf_angriff.hbs`; `Data/systems/Ilaris/scripts/combat/templates/dialogs/uebernatuerlich.hbs`; `Data/systems/Ilaris/scripts/combat/styles/combat-dialogs.css`

3. **What**: Kleine dialogspezifische Nachschaerfungen fuer Angriff, Fernkampf und Uebernatuerlich ergaenzen, falls einzelne Elemente trotz gemeinsamer Basis unterschiedliche visuelle Behandlung brauchen. Dabei keine neuen globalen Shared-Dateien einfuehren, solange die Unterschiede ueberschaubar bleiben; die neue Datei bleibt die alleinige Styling-Oberflaeche fuer diesen Task.
   **Where**: `styles/combat-dialog.css`
   **Who**: code
   **Depends on**: 2
   **Reference**: `Data/systems/Ilaris/scripts/combat/templates/dialogs/angriff.hbs`; `Data/systems/Ilaris/scripts/combat/templates/dialogs/fernkampf_angriff.hbs`; `Data/systems/Ilaris/scripts/combat/templates/dialogs/uebernatuerlich.hbs`

4. **What**: Die neue CSS-Datei in die Modul-Styles aufnehmen, damit das Styling ohne weitere Codeaenderungen geladen wird.
   **Where**: `module.json`
   **Who**: code
   **Depends on**: 1
   **Reference**: `module.json`; bestehende Registrierung von `styles/fertigkeit-dialog.css`

5. **What**: Die Umsetzung gezielt gegen alle relevanten Einstiegspunkte im Modul validieren und pruefen, dass nur die drei Ziel-Dialoge betroffen sind, waehrend andere Dialoge unveraendert bleiben.
   **Where**: `module.json`, `styles/combat-dialog.css`
   **Who**: code
   **Depends on**: 2, 3, 4
   **Reference**: `templates/sheets/character/tabs/kampf-tab.hbs`; `templates/sheets/character/tabs/spells-tab.hbs`; `templates/components/favorites-component.hbs`; `scripts/sheets/alternative-actor-sheet.js`

# 5. Validation Plan

- **Step 1 validation**: Sichtpruefung der neuen Datei auf sauberen Scope.
  Commands to run: kein Build erforderlich.
  Manual checks: Pruefen, dass alle Root-Selektoren nur auf `.ilaris.combat-dialog.angriff-dialog`, `.ilaris.combat-dialog.fernkampf-dialog` und `.ilaris.combat-dialog.uebernatuerlich-dialog` aufsetzen.
  Expected outcomes: Keine ungescopten globalen Regeln fuer `.combat-dialog`, `input`, `select`, `.window-content` oder aehnliche Basisklassen.

- **Step 2 validation**: Theme- und Layout-Validierung der gemeinsamen Regeln.
  Commands to run: `npm run lint`
  Manual checks: Foundry in Light-Mode und Dark-Mode oeffnen; je einen Angriff-, Fernkampf- und Uebernatuerlich-Dialog aufrufen und Header, Window-Content, Panels, Eingabefelder, Selects, Summary-Bloecke, Fokus-Zustaende und Spaltenlayout vergleichen.
  Expected outcomes: Die drei Dialoge uebernehmen sichtbar das Modul-Farbschema des Fertigkeit-Dialogs, bleiben aber funktional und strukturell unveraendert.

- **Step 3 validation**: Dialogspezifische Feinanpassungen gegen Spezialfaelle pruefen.
  Commands to run: kein zusaetzlicher Kommandozwang ausser erneut `npm run lint`, falls an der Datei weitergearbeitet wurde.
  Manual checks: Angriff-, Fernkampf- und Uebernatuerlich-Dialog jeweils durchklicken; sicherstellen, dass unterschiedliche Inhaltsbereiche wie Zielauswahl, Manoever-/Modifikatorbloecke und Summary-Zeilen lesbar bleiben.
  Expected outcomes: Keine visuell entgleisten Einzelbereiche pro Dialogtyp; gemeinsame Basis bleibt konsistent.

- **Step 4 validation**: Laden der neuen Datei sicherstellen.
  Commands to run: `npm run lint`
  Manual checks: Browser-/Foundry-Reload; DevTools oder sichtbare Wirkung bestaetigen, dass `styles/combat-dialog.css` geladen ist.
  Expected outcomes: Die Datei wird mit dem Modul geladen und die Styles sind ohne JavaScript-Eingriff aktiv.

- **Step 5 validation**: End-to-end-Pruefung ueber Modul-Einstiegspunkte.
  Commands to run: `npm run start-foundry`
  Manual checks: Dialoge oeffnen ueber Kampf-Tab, Zauber/uebernatuerlich-Tab und Favoriten; falls vorhanden auch ueber Kreatur-/NSC-Oberflaechen pruefen. Light- und Dark-Mode jeweils gegenpruefen. Sicherstellen, dass Fertigkeit-Dialog und andere Moduldialoge optisch unveraendert bleiben.
  Expected outcomes: Nur die drei Combat-Dialoge erhalten das neue Theme; keine Regression bei bereits vorhandenen Dialog-Styles des Moduls.

# 6. Assumptions & Open Questions

- Annahme: Die System-Klassen `.angriff-dialog`, `.fernkampf-dialog` und `.uebernatuerlich-dialog` sowie die gemeinsame Struktur ihrer Descendants bleiben stabil genug fuer modulseitige CSS-Overrides.
- Annahme: Fuer die gewuenschte farbliche Angleichung reichen bestehende Markup-Hooks aus; es werden keine zusaetzlichen JS-Klassen oder Template-Anpassungen benoetigt.
- Annahme: Eine einzige neue Datei `styles/combat-dialog.css` ist fuer den aktuellen Scope die sauberste Loesung; ein zusaetzliches `dialogs-shared.css` ist erst dann sinnvoll, wenn bei spaeteren Tasks weitere Dialoge dieselben Tokens und Bausteine uebernehmen sollen.
- Offene Frage: Ob einzelne Varianten innerhalb des Uebernatuerlich-Dialogs (z. B. Magie, Karma, uebernatuerliche Fertigkeiten) spaeter eine feinere optische Differenzierung brauchen, ist mit dem aktuellen Scope nicht relevant und bleibt ausserhalb dieses Plans.
- Offene Frage: Falls das zugrunde liegende Ilaris-System sein Dialog-Markup oder die Root-Klassen aendert, muessen die Modul-Selektoren spaeter nachgezogen werden.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehendes `styles/fertigkeit-dialog.css`, System-Dialog-Root-Klassen, Scope-Vorgabe nur fuer drei Combat-Dialoge | Neue Datei `styles/combat-dialog.css` mit root-gescopten Theme-Tokens fuer Light und Dark Mode |
| 2 | code | Gemeinsame Struktur der drei System-Templates und bestehende System-CSS | Gemeinsame Basis-Styles fuer Fenster, Panels, Controls, Summarys und Responsive-Verhalten |
| 3 | code | Ergebnis aus Schritt 2 und dialogspezifische Template-Unterschiede | Kleine, gezielte per-Dialog-Nachschaerfungen ohne Scope-Ausweitung |
| 4 | code | Vorhandenes `module.json` und neue CSS-Datei | Registrierte Stylesheet-Einbindung im Modul |
| 5 | code | Fertige CSS-Datei, Modul-Einstiegspunkte und Foundry-Theme-Umschaltung | Verifizierte Darstellung in Light/Dark-Mode ohne visuelle Regression ausserhalb der drei Ziel-Dialoge |
