## 1. Waffenbau-Regeln und Kompendiumsdaten

- [x] 1.1 Erstelle `scripts/apps/weapon-builder-logic.js` mit dem Katalog der K-Werte, Stapelregeln, Konfliktgruppen, K10-Summierung in halben Punkten, Pflichtparameter-Prüfung und der Ableitung einer Fernkampfkopie ohne `Fernkampfoption`.
- [x] 1.2 Ergänze `scripts/apps/weapon-builder-logic.js` um das Laden und deterministische Zusammenführen von `waffeneigenschaft`-Items aus den in `Ilaris.waffeneigenschaftenPacks` konfigurierten Kompendien.

## 2. Dialog-Script

- [x] 2.1 Erstelle `scripts/apps/weapon-builder-dialog.js` als AppV2 mit `HandlebarsApplicationMixin(ApplicationV2)`, die Grundwerte, Eigenschaftsauswahl, Parameterslots, den verpflichtenden Fernkampfnamen bei Fernkampfoption, freie K-Werte und den Validierungszustand vorbereitet.
- [x] 2.2 Implementiere in `scripts/apps/weapon-builder-dialog.js` die Dialogaktionen zum Hinzufügen, Entfernen und Ändern von Eigenschaften sowie zur K10- und Konfliktvalidierung.
- [x] 2.3 Implementiere in `scripts/apps/weapon-builder-dialog.js` die Erstellung über `Actor#createEmbeddedDocuments('Item', ...)`, die builder-spezifische Hook-Markierung, die Verknüpfung einer nach dem Fernkampfoption-Parameter benannten Fernkampfkopie und das Öffnen ihres Item-Blatts.

## 3. Dialog-Template

- [x] 3.1 Erstelle `templates/apps/weapon-builder-dialog.hbs` mit Grundwertfeldern, einer Liste gewählter Eigenschaften, dynamischen Parameterslots, freien K-Zahlenfeldern und sichtbarer K10-/Validierungsanzeige.
- [x] 3.2 Ergänze `templates/apps/weapon-builder-dialog.hbs` um die nur für den jeweiligen Waffentyp passenden WM- und Ladezeitfelder sowie Erstellen-/Abbrechen-Aktionen.

## 4. Dialog-Styling und Registrierung

- [x] 4.1 Erstelle `styles/weapon-builder-dialog.css` für die responsive Dialogstruktur, verwende ausschließlich vorhandene zentrale Farb- und Overlay-Variablen und ergänze deren Bereitstellung für das Dialogfenster in `styles/module.css`.
- [x] 4.2 Registriere `styles/weapon-builder-dialog.css` in `module.json`.

## 5. Heldenbogen-Integration

- [x] 5.1 Ändere `scripts/sheets/alternative-actor-sheet.js`, sodass `onItemCreate` Nah- und Fernkampfwaffen-Buttons in `IlarisWeaponBuilderDialog` überführt und alle übrigen Itemklassen an die Ilaris-Standardaktion delegiert.
- [x] 5.2 Ergänze die nötigen Imports in `scripts/sheets/alternative-actor-sheet.js` für den Waffenbau-Dialog.

## 6. Fernkampfoption-Integration

- [x] 6.1 Ändere `module.js`, sodass der bestehende `createItem`-Hook builder-markierte Nahkampfwaffen überspringt und keine zusätzliche Kompendiumwaffe erstellt.
- [x] 6.2 Prüfe `scripts/utilities.js` und passe nur bei Bedarf die bestehende Flag-Verknüpfungs- oder Löschlogik an, damit die vom Builder erzeugten verknüpften Waffen korrekt kaskadierend gelöscht werden.

## 7. Unit Tests

- [x] 7.1 Erstelle `scripts/apps/_spec_/weapon-builder-logic.spec.js` für Katalogwerte, freie K-Werte in 0,5er-Schritten, exakte K10-Validierung, Ausschlüsse, Mehrfachauswahl, Pflichtparameter und das Entfernen von `Fernkampfoption` aus der Fernkampfkopie.
- [x] 7.2 Dokumentiere in `scripts/apps/_spec_/weapon-builder-logic.spec.js` die benötigte Test-Runtime oder passe die vorhandene Modul-Tooling-Konfiguration nur dann an, wenn eine tatsächlich ausführbare Testumgebung verfügbar ist.

## 8. E2E- und Abschlussvalidierung

- [ ] 8.1 Prüfe manuell in Foundry VTT 14 einen Helden mit mindestens einem in `Ilaris.waffeneigenschaftenPacks` konfigurierten Kompendium: beide Waffen-Buttons, Parameterslots, freie K-Werte, K10-Blockierung, Mehrfachauswahl und Konfliktmeldungen.
- [ ] 8.2 Prüfe manuell in Foundry VTT 14 Fernkampfoption: genau eine verknüpfte Fernkampfwaffe ohne `Fernkampfoption`, geöffnetes Fernkampf-Itemblatt und Kaskadenlöschung in beide Richtungen.
- [x] 8.3 Führe `npm run lint` aus und behebe alle durch die Änderung verursachten Fehler.

## 9. Fertigkeits- und Talentkompendien

- [x] 9.1 Ergänze `scripts/apps/weapon-builder-logic.js` um das Laden und Zusammenführen von `fertigkeit`- und `talent`-Namen aus `Ilaris.fertigkeitenPacks` beziehungsweise `Ilaris.talentePacks`.
- [x] 9.2 Ergänze `scripts/apps/weapon-builder-dialog.js` um die vorbereiteten Fertigkeits- und Talentvorschläge.
- [x] 9.3 Ergänze `templates/apps/weapon-builder-dialog.hbs` um frei editierbare Grundwertfelder mit den Kompendiumsvorschlägen als `datalist`.
- [x] 9.4 Erweitere `scripts/apps/_spec_/weapon-builder-logic.spec.js` um das Filtern und deterministische Zusammenführen der beiden Kompendiumstypen und führe den Node-Test-Runner aus.
- [ ] 9.5 Prüfe manuell in Foundry VTT 14, dass `Ilaris.fertigkeitenPacks` und `Ilaris.talentePacks` im Waffenbau-Dialog Vorschläge liefern und freie Texteingaben erhalten bleiben.

## 10. Direkte Kampfwerte und stabile Eigenschaftsauswahl

- [x] 10.1 Ergänze `scripts/apps/_spec_/weapon-builder-logic.spec.js` um K-Kosten für W3, W6, TP-Modifikator und positive AT-/VT-WM sowie die TP-Formelerzeugung.
- [x] 10.2 Ergänze `scripts/apps/weapon-builder-logic.js` um Grundwert-Kosten und die Ableitung der TP-Formel aus W3-, W6- und TP-Modifikator-Eingaben.
- [x] 10.3 Ändere `scripts/apps/weapon-builder-dialog.js`, sodass Grundwertkosten in die K10-Validierung einfließen und die gewählte Eigenschaft über Renderzyklen im Dialogzustand erhalten bleibt.
- [x] 10.4 Ändere `templates/apps/weapon-builder-dialog.hbs`, um die strukturierten TP-Eingaben und die persistierte Dropdown-Auswahl darzustellen.
- [x] 10.5 Führe Node-Tests und die fokussierte ESLint-Prüfung für die geänderten Waffenbau-Skripte aus.
- [ ] 10.6 Prüfe manuell in Foundry VTT 14, dass W3/W6/TP/AT/VT die K-Summe korrekt beeinflussen und die ausgewählte Eigenschaft tatsächlich hinzugefügt wird.

## 11. Eigenschaftswerte und negative Kampfwerte

- [x] 11.1 Ergänze den Logiktest um negative AT-/VT-WM und die Übernahme eines festen Eigenschaftswerts.
- [x] 11.2 Übernehme optionale Eigenschaftswerte aus dem Kompendium, zeige sie im Dialog und speichere sie in der Waffeneigenschaft.
- [x] 11.3 Ändere die K-Berechnung, sodass negative AT-/VT-WM die K-Summe senken.
- [x] 11.4 Führe Node-Tests und die fokussierte ESLint-Prüfung für die geänderten Waffenbau-Skripte aus.
- [ ] 11.5 Prüfe manuell in Foundry VTT 14 Eigenschaftswerte sowie positive und negative AT-/VT-WM im K-Budget.

## 12. Variable Eigenschaftsparameter

- [x] 12.1 Ergänze Logiktests für die skalierte K-Berechnung numerischer Eigenschaftsparameter.
- [x] 12.2 Erweitere die K-Berechnung, sodass der erste numerische Parameterslot den Eigenschafts-K-Wert skaliert.
- [x] 12.3 Führe Node-Tests und die fokussierte ESLint-Prüfung aus.
- [ ] 12.4 Prüfe manuell in Foundry VTT 14, dass erhöhte numerische Eigenschaftsparameter die K-Summe aktualisieren.
