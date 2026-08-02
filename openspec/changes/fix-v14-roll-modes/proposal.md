## Why

Nach der Migration auf Foundry VTT 14 schlagen Fertigkeitsproben beim Posten des Ergebnisses in den Chat fehl. Der Dialog übergibt noch einen Legacy-Würfelmodus, den Foundry V14 nicht als Chat-Sichtbarkeitsmodus auflösen kann.

## What Changes

- Stelle die Auswahl und Übergabe des Würfelmodus im Fertigkeitsdialog auf die dokumentierten V14-Chatmodi um.
- Normalisiere gespeicherte Legacy-Modi vor dem Chatversand und verwende einen sicheren öffentlichen Rückfallmodus für unbekannte oder leere Werte.
- Aktualisiere die Modulmetadaten in `package.json`, sodass sie die bereits in `module.json` erklärte Foundry-V14-Kompatibilität widerspiegeln.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `fertigkeit-dialog`: Fertigkeitswürfe können den in Foundry V14 unterstützten Chat-Sichtbarkeitsmodus wählen und zuverlässig als Chat-Nachricht posten.

## Impact

- Betroffene Moduldateien: `scripts/apps/fertigkeit-dialog.js`, neue reine Logik unter `scripts/apps/`, `templates/apps/fertigkeit-dialog.hbs` und `package.json`.
- Der Modulcode bleibt bei der vorhandenen Integration über die Ilaris-Systemfunktion `postRollToChat`; es werden keine neuen Hooks ergänzt.
- Relevante Foundry-APIs: `CONFIG.ChatMessage.modes`, `game.settings.get("core", "rollMode")` und `Roll#toMessage` mit `messageMode`.
- Die Änderung ist auf den dialogbasierten Fertigkeitswurf beschränkt. Die Ilaris-Systemdateien werden nicht verändert.

## Testing Impact

- Neue testbare Logik: Zuordnung der Legacy-Werte `publicroll`, `selfroll`, `gmroll` und `blindroll` zu den V14-Modi sowie der Rückfall auf `public`.
- Es wird eine gezielte Spec-Datei für die reine Modusnormalisierung unter `scripts/apps/_spec_/` benötigt.
- Manuelle Foundry-VTT-14-Regression: Eine Fertigkeitsprobe mit allen vier Modi ausführen und jeweils prüfen, dass die Chat-Nachricht erstellt wird und ihre Sichtbarkeit korrekt ist. Zusätzlich einen alten bzw. ungültigen gespeicherten Kernwert prüfen.
