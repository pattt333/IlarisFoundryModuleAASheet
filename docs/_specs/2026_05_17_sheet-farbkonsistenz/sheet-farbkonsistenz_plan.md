## 1. Objective
Alle sichtbaren Sheet- und Dialogfarben des Moduls sollen aus einem konsistenten Satz semantischer Farb-Tokens stammen, sodass keine hart codierten Hex- oder RGBA-Werte mehr in den geladenen UI-Styles verbleiben.

## 2. Context & Research Summary
- `styles/module.css` ist bereits der naheliegende Farb-Anker: Dort stehen die zentralen Variablen wie `--primary-color`, `--header-bg-color` und `--text-dark`.
- Die geladenen Stylesheets aus `module.json` verteilen sich auf mehrere Oberflächen (`styles/creature-sheet.css`, `styles/favorites-component.css`, `styles/initiative-dialog.css`, `styles/item-accordion.css`, `styles/effect-card.css`) und enthalten weiterhin direkte Farbwerte für Hover-Zustände, Rahmen, Schatten, Warnungen und Flächen.
- `templates/components/health-resources.hbs` nutzt mit `segment-red`, `segment-yellow` und `segment-green` bereits semantische Klassennamen; die Farbdefinition sitzt dort also schon in CSS und nicht im Template.
- `scripts/utilities.js` enthält noch ein inline gebautes Fumble-ChatMessage-HTML mit roter Umrandung und rotem Icon, also eine zusätzliche Farbquelle außerhalb der Stylesheets.
- Risiko: Einige Flächen nutzen `rgba(...)`-Werte als Transparenzabstufungen. Diese sollten nicht 1:1 ersetzt, sondern in passende semantische Tokens übersetzt werden, damit die visuelle Hierarchie erhalten bleibt.

## 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `styles/module.css` | modify | Zentrale semantische Farb-Tokens ergänzen und die bestehende Palette als Single Source of Truth festziehen |
| `styles/creature-sheet.css` | modify | Direkte Farbwerte der Kreaturen-Sheet-Styles auf Token umstellen |
| `styles/favorites-component.css` | modify | Direkte Farbwerte des Favoriten-Components vereinheitlichen |
| `styles/initiative-dialog.css` | modify | Dialogfarben, Warnungen und Zustände auf Tokens umstellen |
| `styles/item-accordion.css` | modify | Item-Accordion auf denselben Farbkanon bringen |
| `styles/effect-card.css` | modify | Effektkarten an die neue Token-Struktur anbinden |
| `scripts/utilities.js` | modify | Inline-Farbwerte im Fumble-ChatMessage auf tokenbasierte Klassen oder CSS-Variablen umstellen |

## 4. Steps
1. **What:** Farbrollen inventarisieren und ein semantisches Token-Set festlegen, das Primary, Hover, Surface, Overlay, Text, Border, Success, Warning und Danger abdeckt.
   **Where:** `styles/module.css`
   **Who:** code
   **Depends on:** none
   **Reference:** Der bestehende Variablenblock am Anfang von `styles/module.css` und die geladenen Styles aus `module.json`.

2. **What:** Die geladenen Sheet- und Komponenten-Styles auf die neuen Tokens umstellen und jede direkt codierte Farbe durch die passende Variable ersetzen; Sonderfälle wie Gradients, Schatten und Transparenzen sollen dabei semantisch erhalten bleiben.
   **Where:** `styles/creature-sheet.css`, `styles/favorites-component.css`, `styles/initiative-dialog.css`, `styles/item-accordion.css`, `styles/effect-card.css`
   **Who:** code
   **Depends on:** 1
   **Reference:** Die Treffer aus der Stylesuche sowie die jeweiligen Komponenten-Layouts in den geladenen Stylesheets.

3. **What:** Das inline erzeugte Fumble-Markup so umbauen, dass es keine harten Rotwerte mehr enthält und stattdessen dieselben Tokens bzw. dieselbe Statusklasse wie die Sheet-Styles verwendet.
   **Where:** `scripts/utilities.js`
   **Who:** code
   **Depends on:** 1, 2
   **Reference:** Das Fumble-HTML in `scripts/utilities.js` und die vorhandenen Status- und Warnfarben in den Stylesheets.

4. **What:** Nach der Umstellung einen gezielten Sichtcheck für Held-, Kreatur-, Dialog- und Effekt-Ansichten vorbereiten, damit die Refaktorierung gegen die echte Foundry-UI validiert werden kann.
   **Where:** `styles/module.css`, `styles/creature-sheet.css`, `styles/favorites-component.css`, `styles/initiative-dialog.css`, `styles/item-accordion.css`, `styles/effect-card.css`, `scripts/utilities.js`
   **Who:** docs
   **Depends on:** 2, 3
   **Reference:** Die betroffenen Sheet- und Dialogoberflächen im Modul sowie die Moduleinbindung in `module.json`.

## 5. Validation Plan
- `npm run lint` als erste technische Kontrolle für die JS-Dateien, falls `scripts/utilities.js` angepasst wird.
- Manuell in Foundry prüfen: ein Held-Sheet, ein Kreatur-Sheet, das Initiative-Dialogfenster und ein Effekt-Card-Szenario öffnen und kontrollieren, dass Header, Tabs, Hover-Zustände, Warnfarben und Rahmen konsistent aus dem Token-Set kommen.
- Manuell prüfen, dass keine auffälligen Restwerte wie direktes Blau, Rot oder graue Einzelwerte mehr auf den relevanten Oberflächen sichtbar sind und dass Lesbarkeit sowie Kontrast unverändert brauchbar bleiben.
- Erwartet: Alle sichtbaren Akzent-, Warn- und Flächenfarben folgen derselben Token-Quelle; nur bewusst ausgenommenes Status-Coloring bleibt semantisch begründet.

## 6. Assumptions & Open Questions
- Annahme: `styles/module.css` bleibt die zentrale Token-Quelle und darf um zusätzliche semantische Aliase erweitert werden.
- Annahme: Die bestehenden Health-Segment-Klassen `segment-red`, `segment-yellow` und `segment-green` bleiben erhalten, solange die Farbdefinitionen in CSS zentralisiert werden.
- Offen: Soll der Token-Pass auch über die Sheet-Styles hinaus weitere runtime-generierte UI-HTML-Strings außerhalb der Modul-Sheets abdecken, oder ist `scripts/utilities.js` der einzige zusätzliche Fall?
- Offen: Sollen Foundry-Standardvariablen wie `--color-success`, `--color-warning` und `--color-danger` direkt als Alias verwendet werden, oder soll das Modul für alle wichtigen Werte eigene Token-Namen definieren?

## 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehender Variablenblock in `styles/module.css` und die geladenen Style-Dateien | Semantisches Token-Set mit klarer Zuordnung zu allen Farbrollen |
| 2 | code | Token-Set aus Step 1 und die direkte Farbtrefferliste aus den geladenen Stylesheets | Alle Sheet- und Komponenten-CSS-Dateien nutzen nur noch Tokens statt harter Farbwerte |
| 3 | code | Fumble-HTML in `scripts/utilities.js` und die Token-Namen aus Step 1 | Keine direkten Rotwerte mehr im runtime-generierten Warnhinweis |
| 4 | docs | Ergebnis der Style-Umstellung | Sichtprüfungs- und Abnahmekriterien für Held-, Kreatur-, Dialog- und Effekt-UI |