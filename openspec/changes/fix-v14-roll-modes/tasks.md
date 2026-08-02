## 1. V14-Würfelmodus-Kompatibilität

- [x] 1.1 In `scripts/apps/fertigkeit-dialog-logic.js` eine exportierte, reine Normalisierungsfunktion für aktuelle, historische und ungültige Moduswerte ergänzen.
- [x] 1.2 In `scripts/apps/fertigkeit-dialog.js` die V14-Modusregistrierung aus `CONFIG.ChatMessage.modes` für den Dialog-Kontext bereitstellen und den vor dem Aufruf von `postRollToChat` bestimmten Würfelmodus durch die Normalisierungsfunktion ersetzen.
- [x] 1.3 In `templates/apps/fertigkeit-dialog.hbs` den vorhandenen Würfelmodus-Selector mit den aus V14 stammenden Modusdaten rendern und die Standardauswahl beibehalten.

## 2. Modulmetadaten

- [x] 2.1 Den Foundry-Kompatibilitätsblock in `package.json` auf die mit `module.json` deklarierte V14-Kompatibilität angleichen.

## 3. Unit Tests

- [x] 3.1 In `scripts/apps/_spec_/fertigkeit-dialog.spec.js` Unit-Tests nach dem vorhandenen `node:test`-/`assert`-Muster für alle vier Legacy-Zuordnungen, gültige V14-Werte sowie den öffentlichen Rückfall bei leeren oder unbekannten Werten ergänzen.

## 4. Validierung

- [x] 4.1 `npm run lint` nach den Änderungen ausführen und alle neuen Verstöße beheben.
- [x] 4.2 Die Spec-Datei `scripts/apps/_spec_/fertigkeit-dialog.spec.js` mit der im Repository vorhandenen Node-Testumgebung ausführen.
- [ ] 4.3 In Foundry VTT 14 eine Fertigkeitsprobe für `public`, `self`, `gm` und `blind` ausführen und Chat-Erzeugung sowie Sichtbarkeit kontrollieren; zusätzlich einen alten oder ungültigen gespeicherten Kernmodus prüfen.
