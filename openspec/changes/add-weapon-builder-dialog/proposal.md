## Why

Helden können Grundwaffen bisher nur als leere Items erstellen und deren Werte anschließend im Systemblatt einzeln bearbeiten. Ein geführter Waffenbau-Dialog soll die GQ0-Regel mit K10-Budget, die gewählten Waffeneigenschaften und ihre Konflikte unmittelbar beim Erstellen prüfen.

## What Changes

- Ersetze die direkte Item-Erstellung durch einen Waffenbau-Dialog für die Nah- und Fernkampfwaffen-Buttons im Kampf-Tab eines Helden.
- Stelle Grundwerte für den jeweiligen Waffentyp bereit: Name, TP, Fertigkeit, Talent, Reichweite sowie passende WM und bei Fernkampfwaffen Ladezeit; Fertigkeiten und Talente werden zusätzlich aus den in den Ilaris-Welteinstellungen aktivierten Kompendien angeboten.
- Ersetze das freie TP-Textfeld durch getrennte W3-, W6- und TP-Modifikator-Eingaben und rechne deren K-Werte sowie vorzeichenbehaftete AT-/VT-WM direkt in das K10-Budget ein.
- Lade Waffeneigenschaften aus den über die Ilaris-Einstellung konfigurierten Kompendien, einschließlich ihrer Parameterslots und eines gegebenenfalls hinterlegten Eigenschaftswerts.
- Berechne die K-Summe der ausgewählten Eigenschaften, erlaube das Erstellen nur bei exakt K10 und verhindere widersprüchliche oder nicht stapelbare Kombinationen.
- Bewahre die Auswahl im Eigenschafts-Dropdown während des Neu-Renderns des Dialogs, damit jede konfigurierte Eigenschaft auswählbar ist.
- Verwende feste Katalogwerte für bekannte Eigenschaften und ein bearbeitbares K-Zahlenfeld (Vorgabe 1, Schrittweite 0,5) für nicht katalogisierte Kompendiumseigenschaften.
- Berücksichtige den ersten numerischen Parameterslot einer Eigenschaft als Multiplikator ihres K-Werts, damit eine erhöhte variable Eigenschaft auch mehr K kostet.
- Erfrage bei Fernkampfoption einen Namen für die erzeugte Fernkampfwaffe, speichere ihn als ersten Parameter der Eigenschaft und erzeuge damit eine verknüpfte Fernkampfkopie, aus der die Eigenschaft Fernkampfoption entfernt ist; anschließend öffne deren Item-Blatt.
- Passe den bestehenden Fernkampfoption-Hook an, damit vom Builder erzeugte Kopien nicht zusätzlich aus dem fest verdrahteten Modul-Kompendium geladen werden.

## Capabilities

### New Capabilities

- `weapon-builder-dialog`: Erstellt regelgeprüfte Nah- und Fernkampf-Grundwaffen für Helden aus den konfigurierten Waffeneigenschafts-Kompendien.

### Modified Capabilities

- `fernkampfoption-auto-add`: Ersetzt die Kompendium-basierte Erzeugung für vom Waffenbau-Dialog erzeugte Fernkampfoptionen durch eine verknüpfte Kopie.

## Impact

- Betroffene Moduldateien: `scripts/sheets/alternative-actor-sheet.js`, neue Dialog-/Hilfsdateien unter `scripts/apps/` und/oder `scripts/utilities.js`, `templates/apps/`, `styles/`, `templates/sheets/character/tabs/kampf-tab.hbs`, `module.js`.
- Verwendete Foundry-APIs: AppV2 mit `HandlebarsApplicationMixin`, `Actor#createEmbeddedDocuments`, `Item#update`, `ItemSheet#render` und die bestehenden `createItem`-/`deleteItem`-Hooks.
- Die Änderung ist primär eine Sheet-/Feature-Änderung; `module.js` wird nur für die bestehende Fernkampfoption-Integration angepasst.
- Abhängigkeit: Ilaris-Systemeinstellungen `waffeneigenschaftenPacks`, `fertigkeitenPacks` und `talentePacks` sowie die darin ausgewählten Item-Kompendien.

## Testing Impact

- Neue unit-testbare Hilfslogik: K-Wert-Auflösung, Summierung, Konflikt- und Mehrfachauswahlprüfung sowie die Datenableitung für die Fernkampfkopie.
- Es existiert im Modul derzeit keine eigene `_spec_/`-Teststruktur; für die neue reine Logik soll eine passende `_spec_/`-Datei angelegt werden.
- Manuelle Foundry-VTT-14-Regression: Held öffnen, beide Buttons prüfen, Eigenschaften und Parameter aus einem konfigurierten Pack wählen, K10-Validierung und Konflikte prüfen sowie Fernkampfoption einschließlich Verknüpfung und geöffneter Fernkampfwaffe kontrollieren.
