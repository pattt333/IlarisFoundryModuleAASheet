## 1. Objective
Sicherstellen, dass das Modul-CSS ausschließlich auf die alternativen Actor-Sheets (Held + Kreatur) wirkt und keinerlei visuelle Seiteneffekte in Foundry-Core-UI (insbesondere Kompendium-Tab, andere Tabs/Buttons) verursacht; ausgenommen ist das Window-Header-Styling innerhalb der alternativen Sheets.

## 2. Context & Research Summary
- Die drei gewünschten Architektur-Referenzen unter `.agents/` (`CODEBASE_ARCHITECTURE.md`, `PATTERNS_AND_EXAMPLES.md`, `GLOSSARY.md`) sind in diesem Workspace nicht vorhanden; Planung basiert daher auf direkter Code-/Template-/CSS-Recherche im Modul.
- Zentrale Leak-Ursache gefunden: globale CSS-Variablen auf `body` und `body.theme-dark` in `styles/module.css` überschreiben Foundry-UI-Farben systemweit.
- Weitere Leak-Risiken gefunden: ungescopte Klassen in `styles/favorites-component.css` (z. B. `.favorites-*`, `.combat-*`, `.favorite-*`) und globale Media-Query-Selektoren.
- Zusätzliche Reichweite außerhalb „nur Sheet“: globale Styles für Initiativ-Dialoge in `styles/initiative-dialog.css` (App-spezifisch, nicht Sheet-spezifisch).
- Aktuelle Sheet-Root-Basis ist vorhanden (`classes: ['alternative']` + Ilaris-Sheet-Klassen), daher ist Strategie A (striktes Scoping am Sheet-Root) technisch gut umsetzbar.
- Relevante Constraints:
  - Modul lädt Styles global über `module.json` `styles`-Array.
  - Zusätzlich werden einzelne CSS-Dateien in `module.js` per `<link>` global in `document.head` injiziert.
  - User-Vorgabe: keine CSS-Wirkung außerhalb der alternativen Sheets, außer Window-Header innerhalb der Sheets.

## 3. Affected Files
| File | Action | Reason |
|------|--------|--------|
| `styles/module.css` | modify | Entfernen globaler `body`/`body.theme-dark` Variablen-Scopes und Umscoping auf Sheet-Root; Absicherung aller selektorischen Ausnahmen. |
| `styles/favorites-component.css` | modify | Vollständiges Namespacing/Scoping der ungescopten `.favorites-*`, `.combat-*`, `.favorite-*` Selektoren auf Alternative-Sheet-Root. |
| `styles/item-accordion.css` | modify | Bereinigung von `body.theme-dark ...` Mustern zugunsten sheet-lokaler Theme-Hooks. |
| `styles/effect-card.css` | modify | Verifikation, dass alle Selektoren strikt am Sheet-Root hängen; ggf. Nachscoping einzelner Ausnahmen. |
| `styles/creature-sheet.css` | modify | Verifikation/Bereinigung von Nicht-Sheet-Selektoren und Konsolidierung auf Creature-Sheet-Root. |
| `styles/initiative-dialog.css` | modify | Entkopplung von Sheet-Farbvariablen oder vollständige Auslagerung, damit keinerlei Core-UI unbeabsichtigt beeinflusst wird. |
| `module.js` | modify | Entfernen/Anpassen globaler CSS-Link-Injektion; optional bedingtes Laden nur im relevanten Sheet-Kontext. |
| `templates/sheets/character/alternative-actor-header.hbs` | modify | Optionaler zusätzlicher Wrapper/Root-Klasse für hartes Scoping (erlaubt laut Vorgabe). |
| `templates/sheets/character/alternative-actor-sidebar.hbs` | modify | Optionaler ergänzender Scope-Wrapper für Komponenten-Isolation. |
| `templates/sheets/npc/alternative-creature-sheet.hbs` | modify | Optionaler ergänzender Scope-Wrapper für Creature-spezifische Scoping-Sicherheit. |
| `templates/components/favorites-component.hbs` | modify | Optionales BEM/Namespace-Attribut für kollisionsfreie Komponenten-Selektoren. |

## 4. Steps
1. **What**: Vollständigen CSS-Selector-Audit durchführen und jede Regel als `sheet-scoped`, `module-app-scoped`, `global-leak` klassifizieren; priorisierte Leak-Liste mit konkreten Ziel-Selektoren erstellen.
   **Where**: `styles/module.css`, `styles/favorites-component.css`, `styles/item-accordion.css`, `styles/effect-card.css`, `styles/creature-sheet.css`, `styles/initiative-dialog.css`.
   **Who**: `code`
   **Depends on**: none
   **Reference**: Bestehende Sheet-Root-Selektoren in `styles/module.css` (Muster `.ilaris.sheet.actor.alternative ...`).

2. **What**: Design-Token/Variablen strikt auf Alternative-Sheet-Roots umstellen (Strategie A): globale `body`-Variableblöcke ersetzen durch sheet-lokale Root-Container; Dark/Light-Theming über body-Klasse nur noch als Präfix auf sheet-spezifische Selektoren nutzen.
   **Where**: `styles/module.css`.
   **Who**: `code`
   **Depends on**: 1
   **Reference**: Foundry-Theme-Hooks (`body.theme-dark` / `body.theme-light`) nur in Kombination mit Sheet-Root gemäß Repo-Memory `foundry-theme-hooks.md`.

3. **What**: Ungescopte Komponenten-Selektoren hart auf Alternative-Sheet begrenzen; falls nötig Klassen präfixen (z. B. `aas-*`) und HBS-Klassen synchron anpassen.
   **Where**: `styles/favorites-component.css`, `templates/components/favorites-component.hbs`, optional `templates/sheets/character/alternative-actor-sidebar.hbs`.
   **Who**: `code`
   **Depends on**: 1, 2
   **Reference**: Komponenten-Einbindung im Character-Sidebar-Template und Favorites-Manager-Selektoren in `scripts/components/favorites-manager.js`.

4. **What**: Restliche CSS-Dateien auf globale Theme-/Element-Selektoren prüfen und konsequent auf Sheet-Root umstellen; doppelte/inkonsistente Regeln entfernen.
   **Where**: `styles/item-accordion.css`, `styles/effect-card.css`, `styles/creature-sheet.css`.
   **Who**: `code`
   **Depends on**: 1, 2
   **Reference**: Aktuelle Klassenstruktur aus `scripts/sheets/alternative-actor-sheet.js` und `scripts/sheets/alternative-creature-sheet.js` (`classes: ['alternative']`).

5. **What**: Entscheidung und Umsetzung für `styles/initiative-dialog.css`: entweder vollständige Entkopplung vom Sheet-Token-System (eigene, eng begrenzte Dialog-Tokens) oder Entfernung aus globalem Modul-Styleset, wenn Ziel strikt „nur Sheets“ ist.
   **Where**: `styles/initiative-dialog.css`, `module.js`, optional `module.json`.
   **Who**: `code`
   **Depends on**: 1, 2
   **Reference**: Dialog-Klassen aus `scripts/apps/initiative-dialog.js` und `scripts/apps/mass-initiative-dialog.js`.

6. **What**: Optionale HBS-Root-Härtung einführen (zusätzliche eindeutige Wrapper-Klasse/`data-`Attribut pro alternativer Sheet-Variante), um zukünftige CSS-Leaks technisch zu verhindern.
   **Where**: `templates/sheets/character/alternative-actor-header.hbs`, `templates/sheets/character/alternative-actor-sidebar.hbs`, `templates/sheets/npc/alternative-creature-sheet.hbs`.
   **Who**: `code`
   **Depends on**: 2, 3, 4
   **Reference**: Bestehende PARTS-Struktur in `scripts/sheets/alternative-actor-sheet.js` und `scripts/sheets/alternative-creature-sheet.js`.

7. **What**: Abschließende Leak-Sicherung: statischer Selector-Check (Regex/rg) plus Negativliste für verbotene globale Selektoren definieren, damit regressionssicher nachvollziehbar bleibt, was außerhalb des Sheets nicht mehr erlaubt ist.
   **Where**: alle betroffenen `styles/*.css`.
   **Who**: `code`
   **Depends on**: 3, 4, 5, 6
   **Reference**: Verbotene Muster aus initialem Audit (z. B. nacktes `body`, unprefixtes `.favorites-*`, `.combat-*`, globale `.window-content`).

## 5. Validation Plan
- **Step 1 (Audit)**
  - Commands: `rg "^\s*(body|:root|html|\.favorites-|\.combat-|\.favorite-|\.window-content|\.window-header|\.window-title)" styles`
  - Manual checks: keine (rein statischer Audit).
  - Expected: vollständige Liste aller potentiellen Leaks inkl. Datei/Selektor.

- **Step 2 (Token-Scoping)**
  - Commands: `rg "^\s*body(\.theme-dark|\.theme-light)?\s*\{" styles/module.css`
  - Manual checks: keine.
  - Expected: keine globalen Body-Variablenblöcke mehr ohne Sheet-Root-Bezug.

- **Step 3 (Favorites-Scoping)**
  - Commands: `rg "^\s*\.(favorites|combat|favorite)-" styles/favorites-component.css`
  - Manual checks: keine.
  - Expected: alle Treffer sind auf Alternative-Sheet-Root oder eindeutiges Namespace eingeschränkt.

- **Step 4 (Rest-CSS)**
  - Commands: `rg "body\.theme-dark" styles/item-accordion.css styles/effect-card.css styles/creature-sheet.css`
  - Manual checks: keine.
  - Expected: Theme-Selektoren nur noch in Kombination mit Sheet-Root.

- **Step 5 (Dialog-Abgrenzung)**
  - Commands: `rg "initiative-dialog|mass-initiative-dialog" styles module.js`
  - Manual checks: keine.
  - Expected: klare Trennung dokumentiert/umgesetzt, sodass Ziel „nur Sheets“ eingehalten wird.

- **Step 6 (Template-Härtung)**
  - Commands: `rg "aas-|data-aas|alternative" templates/sheets templates/components`
  - Manual checks: keine.
  - Expected: eindeutige Scope-Anker in relevanten Templates vorhanden.

- **Step 7 (Final Gate)**
  - Commands: `npm run lint`
  - Manual checks (gezielt): Foundry öffnen, Kompendium-Tab + beliebige Core-Sidebar-Tabs + Core-Buttons prüfen; Farbgebung/Typografie unverändert zum Foundry-Standard. Danach alternatives Held- und Kreaturen-Sheet öffnen und prüfen, dass Window-Header-Style dort weiterhin greift.
  - Expected: keine unbeabsichtigten Stiländerungen außerhalb der alternativen Sheets.

- **Overall Result**
  - Commands: `rg "^\s*body\s*\{|^\s*body\.theme-dark\s*\{" styles`
  - Manual checks: kompakter Smoke-Test in Foundry (Compendium, Sidebar, Buttons, alternatives Held-/Kreaturen-Sheet).
  - Expected: 0 globale Leakage-Selektoren, Styling wirkt nur auf alternative Sheets (plus erlaubter Sheet-Window-Header).

## 6. Assumptions & Open Questions
- Annahmen:
  - Das Ziel „nur alternative Actor-Sheets“ schließt Initiativ-Dialoge als Nicht-Sheet-UI aus.
  - Window-Header-Ausnahme gilt ausschließlich innerhalb alternativer Sheet-Fenster.
  - Template-Anpassungen (Wrapper/zusätzliche Klassen) sind erlaubt und gewünscht, falls für robustes Scoping nötig.
- Offene Fragen:
  - Soll `styles/initiative-dialog.css` vollständig neutralisiert werden oder als separater, streng dialog-lokaler Stil erhalten bleiben, obwohl Ziel „nur Sheets“ ist?
  - Soll ein dauerhaftes CI-ähnliches Regex-Gate (z. B. npm script) ergänzt werden, um globale Selektor-Regressions künftig automatisch zu verhindern?

## 7. Delegation Map
| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehende `styles/*.css` | Audit-Liste mit Leak-Klassifikation |
| 2 | code | Audit + `styles/module.css` | Sheet-lokal gescopte Token/Theme-Regeln |
| 3 | code | Audit + Favorites CSS/HBS + Favorites Manager | Kollisionfreie Favorites-Selektoren mit Sheet-Scoping |
| 4 | code | Audit + restliche CSS-Dateien | Bereinigte, durchgängig gescopte Sheet-Stile |
| 5 | code | Dialog-CSS + `module.js` + Zielvorgabe | Klare Abgrenzung/Entfernung von Nicht-Sheet-Styling |
| 6 | code | relevante Sheet-/Component-Templates | Zusätzliche Scope-Anker im Markup |
| 7 | code | alle geänderten Styles + Prüfkommandos | Abschluss-Check ohne externe CSS-Nebenwirkungen |
