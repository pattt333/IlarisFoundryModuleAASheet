## 1. Objective
Der Main-Tab des alternativen Character-Sheets soll den bisherigen Attribut-Block vollstandig durch eine Eigenheiten-Ansicht ersetzen, inklusive funktionsfahiger Create/Edit/Delete-Actions und konsistentem Light-/Dark-Mode-Styling uber bestehende Farbvariablen.

## 2. Context & Research Summary
- Der aktuelle Main-Tab in `templates/sheets/character/tabs/main-tab.hbs` rendert nur den Attribut-Bereich (`actor.system.attribute`) in einem `grid-2col`-Layout mit `.abilities`/`.ability`.
- Das Sheet registriert Actions uber AppV2 in `scripts/sheets/alternative-actor-sheet.js` (`itemCreate` ist bereits in `DEFAULT_OPTIONS.actions` vorhanden), daher kann die neue Eigenheiten-UI `data-action="itemCreate|itemEdit|itemDelete"` direkt nutzen.
- Bestehende Character-Tab-Templates (`kampf-tab.hbs`, `items-tab.hbs`) nutzen konsistent die Struktur `.items-section`, `.items-header`, `.item-controls`, `.items-list`, `.item-control`; diese Klassen sind bereits in `styles/item-accordion.css` ausdefiniert und farbvariablenbasiert.
- `styles/module.css` enthalt aktuell Main-Tab-spezifische Regeln fur `.grid-2col`, `.abilities`, `.ability`; diese sind auf den alten Attribut-Block zugeschnitten und mussen fur die neue Struktur ersetzt oder gezielt erganzt werden.
- Theme-Basis ist vorhanden: globale Variablen in `styles/module.css` fur Light und `body.theme-dark` fur Dark; Repository-Memory bestatigt `body.theme-dark`/`body.theme-light` als stabile Hooks.
- Foundry-API-Referenz: AppV2-/Sheet-Kontext uber `ActorSheetV2` und Application-Building-Blocks in der offiziellen API-Doku (`https://foundryvtt.com/api/`).
- Abweichung zur gewunschten Quellenreihenfolge: `.agents/CODEBASE_ARCHITECTURE.md`, `.agents/PATTERNS_AND_EXAMPLES.md`, `.agents/GLOSSARY.md` sowie `template.json` sind in diesem Workspace nicht vorhanden und wurden daher durch direkte Code- und CSS-Recherche ersetzt.

## 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `templates/sheets/character/tabs/main-tab.hbs` | modify | Attribut-Block vollstandig durch Eigenheiten-Block ersetzen; Datenquelle `actor.eigenheiten`; Actions fur Erstellen/Bearbeiten/Loschen anbinden |
| `styles/module.css` | modify | Alte Main-Tab-Attribut-Styles entfernen/anpassen und Main-Tab-Eigenheiten-Styles uber vorhandene Farbvariablen fur Light/Dark definieren |
| `styles/item-accordion.css` | modify (optional, falls fur Konsistenz benotigt) | Falls fur Eigenheiten-Liste kleinere Varianten der bestehenden `.items-*`/`.item-control`-Muster gebraucht werden, ohne neue Hardcoded-Farben einzufuhren |

## 4. Steps
1. **What**: Main-Tab-Markup auf Eigenheiten umstellen und den bisherigen Attribut-Block vollstandig entfernen. Der neue Block nutzt `actor.eigenheiten`, bietet einen Add-Trigger (`data-action="itemCreate" data-itemclass="eigenheit"`) sowie Edit/Delete-Links pro Eintrag und fallt bei leerer Liste auf einen klaren Empty-State zuruck.
   **Where**: `templates/sheets/character/tabs/main-tab.hbs`
   **Who**: code
   **Depends on**: none
   **Reference**: `templates/sheets/character/tabs/kampf-tab.hbs` (Action-Pattern), `templates/sheets/character/tabs/items-tab.hbs` (Section-Struktur)

2. **What**: Eigenheiten-Layout semantisch in bestehende Sheet-Struktur einbetten (z. B. uber `.items-section`/`.items-header`/`.items-list` oder gleichwertige Klassen), sodass das bestehende Designsystem genutzt wird statt isolierter Sonderstruktur.
   **Where**: `templates/sheets/character/tabs/main-tab.hbs`, `styles/item-accordion.css` (nur falls notwendig)
   **Who**: code
   **Depends on**: 1
   **Reference**: `styles/item-accordion.css` (bestehende List-/Control-Muster)

3. **What**: Main-Tab-CSS fur die neue Eigenheiten-Ansicht finalisieren: alte `.abilities`/`.ability`-Abhangigkeiten entfernen oder neutralisieren und neue Selektoren fur Uberschrift, Listeneintrage und Action-Bedienelemente setzen. Dabei ausschliesslich bestehende Farbvariablen verwenden (z. B. `--color-surface-*`, `--color-text-*`, `--color-border-*`, `--primary-color`).
   **Where**: `styles/module.css` (ggf. erganzt durch `styles/item-accordion.css`)
   **Who**: code
   **Depends on**: 2
   **Reference**: `styles/module.css` (Theme-Variablen inkl. `body.theme-dark`), `/memories/repo/foundry-theme-hooks.md`

4. **What**: Sicherstellen, dass die Item-Actions im neuen Main-Tab mit der bestehenden AppV2-Actions-Konfiguration zusammenspielen und keine zusatzliche JS-Anpassung erforderlich ist; nur wenn ein konkreter Integrationsbruch sichtbar wird, einen minimalen Folge-Task fur JS erganzend definieren.
   **Where**: `scripts/sheets/alternative-actor-sheet.js` (nur verifizieren, i. d. R. ohne Anderung)
   **Who**: code
   **Depends on**: 1
   **Reference**: `scripts/sheets/alternative-actor-sheet.js` (`DEFAULT_OPTIONS.actions`), Foundry API `ActorSheetV2`/ApplicationV2

5. **What**: Abschlussabgleich fur Scope-Treue: Anderung nur im Character-Main-Tab, keine Nebenanpassungen an anderen Tabs oder Creature-Sheets.
   **Where**: `templates/sheets/character/tabs/main-tab.hbs`, `styles/module.css`, `styles/item-accordion.css`
   **Who**: docs
   **Depends on**: 3, 4
   **Reference**: Nutzeranforderung (nur dieser Tab)

## 5. Validation Plan
- Technisch:
  - `npm run lint` ausfuhren, um unbeabsichtigte Syntax-/Style-Probleme in geanderten Assets auszuschliessen.
- Manuelle Checks in Foundry:
  - Character-Sheet offnen, Main-Tab auswahlen, verifizieren dass Attribute nicht mehr sichtbar sind und stattdessen nur Eigenheiten angezeigt werden.
  - Auf `Neue Eigenheit` klicken: es wird ein Item vom Typ `eigenheit` erstellt/geoffnet.
  - Bestehende Eigenheit bearbeiten (`itemEdit`) und loschen (`itemDelete`) testen.
  - Leere und befullte Eigenheiten-Liste testen (inkl. Text-Fallback `item.system.text` -> `item.name`).
  - In Light- und Dark-Theme kontrollieren: Hintergrunde, Text, Borders, Hover-/Action-Zustande lesen sich sauber und nutzen Variablen, keine hardcodierten Sonderfarben.
- Erwartete Ergebnisse:
  - Main-Tab zeigt ausschliesslich Eigenheiten.
  - Create/Edit/Delete funktioniert uber bestehende Action-Pipeline.
  - Darstellung ist in beiden Themes konsistent und farbvariablenbasiert.

## 6. Assumptions & Open Questions
- Annahme: `actor.eigenheiten` ist im Render-Kontext des alternativen Character-Sheets bereits vorhanden und enthalt die zugehorigen Items.
- Annahme: `data-itemclass="eigenheit"` ist ein gultiger Item-Typ in der bestehenden Ilaris-Umgebung.
- Offen (Implementierung): Soll bei leerer Liste ein expliziter Hinweistext angezeigt werden oder reicht ein leerer Listenbereich?
- Offen (Implementierung): Soll fur Eigenheiten eine kompakte Einzeilenliste oder ein kartenartiges Layout verwendet werden, sofern beide konsistent mit den vorhandenen Token-Styles sind?
- Hinweis: Die angeforderten Forschungsquellen `.agents/*` und `template.json` waren im Workspace nicht verfugbar; daher basiert der Plan auf direkter Analyse der vorhandenen Templates, Styles und Sheet-Klasse.

## 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Nutzeranforderung + aktuelles `main-tab.hbs` | Main-Tab-Markup mit vollstandigem Eigenheiten-Block statt Attributen |
| 2 | code | Markup aus Step 1 + vorhandene `.items-*` Patterns | Eingebettete, konsistente Struktur fur Liste und Controls |
| 3 | code | Main-Tab-Struktur + Theme-Variablen aus `styles/module.css` | Light/Dark-kompatibles Styling ohne Hardcoded-Farben |
| 4 | code | Neues Markup + Action-Registrierung in `alternative-actor-sheet.js` | Verifiziertes Action-Verhalten ohne unnötige JS-Regression |
| 5 | docs | Ergebnisse aus Steps 1-4 | Abnahme gegen Scope (nur Character Main-Tab) dokumentiert |
