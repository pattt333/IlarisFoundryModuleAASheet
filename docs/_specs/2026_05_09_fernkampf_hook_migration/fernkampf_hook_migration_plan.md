# Fernkampf Hook Migration Plan

## 1. Objective

Den bestehenden Fernkampf-Workflow des Moduls auf die neue Ilaris-Hook-API umstellen, sodass Munitionsverbrauch, Patzer-Logik und Wurfwaffen-Pile-Erzeugung weiterhin korrekt bei Fernkampfangriffen ausgelöst werden.

## 2. Assumptions

- Der bisherige Hook `Ilaris.fernkampfAngriffClick` ist im Zielsystem nicht mehr verfügbar (Breaking Change laut System-Doku).
- Die Ersatzintegration erfolgt über `Ilaris.postAngriff` und nutzt `dialog.attackType === "ranged"` als Filter für Fernkampf.
- Die aktuell benötigten Daten (`actor`, `item`, `rollResult`) können aus den `postAngriff`-Parametern (`rollResult`, `dialog`) zuverlässig abgeleitet werden.
- Die bestehende Logik in `module.js` soll funktional erhalten bleiben (kein Feature-Umbau, nur Hook-Migration plus notwendige Guard-Checks).
- Es ist akzeptabel, den alten Hook vollständig zu entfernen, statt parallel beide Hooks zu unterstützen.

## 3. Steps

1. **What**: Hook-Vertragsänderung dokumentieren und konkrete Migrationsziele festlegen (Alt-Hook, Neu-Hook, Datenmapping, Fernkampf-Filter).
   **Where**: [module.js](module.js), [docs/\_specs/ammunition-feature.md](docs/_specs/ammunition-feature.md), [docs/\_specs/wurfwaffen-pile-and-usage.md](docs/_specs/wurfwaffen-pile-and-usage.md), externe Referenz [../../../../systems/Ilaris/docs/develop/hooks.md](../../../../systems/Ilaris/docs/develop/hooks.md)
   **Who**: docs
   **Depends on**: none

2. **What**: Alten Hook-Listener `Ilaris.fernkampfAngriffClick` in einen neuen Listener auf `Ilaris.postAngriff` migrieren und frühzeitig filtern auf `dialog.attackType === "ranged"`.
   **Where**: [module.js](module.js)
   **Who**: code
   **Depends on**: 1

3. **What**: Datenmapping im neuen Hook implementieren (`actor` und `item` aus `dialog`) und defensive Abbruchbedingungen ergänzen (fehlender Actor, fehlendes Item, fehlende Weapon-Properties).
   **Where**: [module.js](module.js)
   **Who**: code
   **Depends on**: 2

4. **What**: Bestehende Geschäftslogik unverändert an das neue Hook-Signal anbinden: Locking-Flag, Munitionsverbrauch, Patzerbehandlung, Warnungen und Wurfwaffen-Pile-Flow.
   **Where**: [module.js](module.js), indirekt über Utility-Aufrufe in [scripts/utilities.js](scripts/utilities.js)
   **Who**: code
   **Depends on**: 3

5. **What**: Veraltete Hook-Nennung in Spezifikationsdokumenten aktualisieren, damit Implementierung und Doku konsistent sind.
   **Where**: [docs/\_specs/ammunition-feature.md](docs/_specs/ammunition-feature.md), [docs/\_specs/wurfwaffen-pile-and-usage.md](docs/_specs/wurfwaffen-pile-and-usage.md)
   **Who**: docs
   **Depends on**: 4

6. **What**: Regressionstests und manuelle Smoke-Checks für Fernkampfabläufe durchführen.
   **Where**: gesamtes Modul, Fokus auf Fernkampfablauf in Foundry
   **Who**: code
   **Depends on**: 4, 5

## 4. Validation Plan

- Automatisierte Checks:
    - npm run lint
    - npm test
- Manuelle Checks in Foundry:
    - Fernkampfangriff mit normalem Treffer: genau 1 Munition wird verbraucht (bei Held und passender Munitions-Eigenschaft).
    - Fernkampfangriff ohne Munition: Warnung + Chat-Hinweis erscheinen wie bisher.
    - Fernkampf-Patzer: Patzertabelle wird ausgeführt, inklusive Sonderfälle (z. B. Blutung, doppelter Verbrauch, Selbstschaden).
    - Wurfwaffe im Fernkampf: Pile-Erzeugung wird weiter ausgelöst, nur wenn ein aktiver Token vorhanden ist.
    - Nicht-Fernkampf (`melee`/`supernatural`): Hook-Handler läuft nicht in die Munitionslogik.
- Erwartete Ergebnisse:
    - Keine Fehler in Konsole durch fehlende Hook-Signaturen.
    - Keine doppelte Ausführung der Munitionslogik.
    - Vorhandenes Verhalten bleibt fachlich erhalten, nur Triggerquelle ist aktualisiert.

## 5. Delegation Map

| Step | Specialist | Input                                                                          | Expected Output                                             |
| ---- | ---------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 1    | docs       | Hook-Änderungen aus Ilaris-Systemdoku + bestehende Modul-Spezifikationen       | Klare Migrationsanforderungen mit Alt-/Neu-Hook-Mapping     |
| 2    | code       | Bestehender Listener in [module.js](module.js) + Zielhook `Ilaris.postAngriff` | Neuer Listener mit Fernkampf-Filter auf `dialog.attackType` |
| 3    | code       | Neue Hook-Signatur (`rollResult`, `dialog`)                                    | Robustes Mapping auf `actor`/`item` inkl. Guard-Checks      |
| 4    | code       | Bestehende Munitions-/Patzer-/Pile-Logik                                       | Gleiches Verhalten auf neuer Triggerbasis                   |
| 5    | docs       | Aktualisierte Implementierung                                                  | Konsistente Spezifikation ohne veralteten Hook-Namen        |
| 6    | code       | Fertige Änderungen                                                             | Nachweis durch Lint/Test/Smoke-Checks                       |
