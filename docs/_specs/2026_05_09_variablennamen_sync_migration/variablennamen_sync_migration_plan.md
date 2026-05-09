## 1. Objective

Die im Ilaris-System bereits migrierten Variablennamen im Modul konsistent nachziehen, indem alle betroffenen JS-, HBS- und Kompendium-Referenzen auf die neuen Bezeichner umgestellt werden, ohne die bestehende Fachlogik zu verändern.

## 2. Assumptions

- Die Migrationslogik für bestehende Weltdaten wird vollständig vom System Ilaris übernommen und muss im Modul nicht erneut implementiert werden.
- Die Referenzliste der umzubenennenden Bezeichner aus dem System-Plan vom 2026-05-07 ist vollständig und korrekt.
- Für dieses Modul sind vor allem Typ-Strings und zugehörige Schlüssel relevant, insbesondere: freiestalent zu freiesTalent, freie_fertigkeit zu freieFertigkeit, uebernatuerliche_fertigkeit zu uebernatuerlicheFertigkeit, effect-item zu effectItem, abgeleiteter-wert zu abgeleiteterWert.
- Kompendiumsdaten in packs/**/_source müssen nach der Umbenennung neu gepackt werden, damit LevelDB-Inhalte konsistent sind.
- Dateiumbenennungen selbst (snake_case zu kebab-case) sind nicht zwingend Teil dieses Auftrags, solange alle Namensreferenzen fachlich korrekt sind.

## 3. Steps

1. What: Vollständige Rename-Matrix aus der externen Systemspezifikation in eine konkrete Modul-Mappingliste überführen (alt zu neu, inkl. Sonderfälle in Keys und Roll-Typen).
   Where: docs/_specs/2026_05_09_variablennamen_sync_migration/variablennamen_sync_migration_plan.md, externe Referenz in Data/systems/Ilaris/docs/_specs/2026_05_07_refactoring_variablennamen/refactoring_variablennamen_plan.md
   Who: docs
   Depends on: none

2. What: Alle betroffenen JavaScript-Verwendungen der alten Bezeichner identifizieren und auf neue Namen umstellen, inklusive switch/case-Vergleichen, Config-Zugriffen, Sheet-Registrierung und internen Type-Guards.
   Where: module.js, scripts/**/*.js
   Who: code
   Depends on: 1

3. What: Alle betroffenen Handlebars-Templates auf alte Typnamen, Tab-/Key-Referenzen oder Legacy-Propertynamen prüfen und auf neue Bezeichner umstellen.
   Where: templates/**/*.hbs, scripts/**/templates/**/*.hbs
   Who: code
   Depends on: 1

4. What: Kompendium-JSONs in _source auf alte Typ-Strings und alte Schlüssel prüfen, zielgerichtet umbenennen und anschließend Pack-Schritt einplanen.
   Where: packs/**/_source/**/*.json
   Who: compendium
   Depends on: 1

5. What: Konsistenz- und Regression-Checks durchführen (Suche nach Rest-Treffern, Lint/Test, Pack-All), danach stichprobenartige Funktionsprüfung in Foundry.
   Where: gesamtes Modul, Fokus scripts/, templates/, packs/
   Who: code + compendium + setup
   Depends on: 2, 3, 4

6. What: Abschlussdokumentation ergänzen: welche Namen migriert wurden, welche bewusst unverändert blieben, und welche Risiken offen sind.
   Where: docs/_specs/2026_05_09_variablennamen_sync_migration/variablennamen_sync_migration_plan.md oder ergänzende Umsetzungsnotiz im gleichen Ordner
   Who: docs
   Depends on: 5

## 4. Validation Plan

- Automatisierte Prüfungen:
  - npm run lint
  - npm test
  - npm run pack-all
- Suchbasierte Verifikation:
  - Keine Treffer mehr für alte Typ-Strings in scripts/**/*.js und templates/**/*.hbs.
  - Keine Treffer mehr für alte Typ-Strings in packs/**/_source/**/*.json.
- Manuelle Prüfungen in Foundry:
  - Items der umbenannten Typen werden in Helden- und Kreaturen-Sheets weiterhin korrekt angezeigt.
  - Würfel-/Dialogabläufe für freie und übernatürliche Fertigkeiten funktionieren weiterhin.
  - Effekte und abgeleitete Werte mit neuen Typbezeichnern sind weiterhin nutzbar.
- Erwartetes Ergebnis:
  - Modul nutzt ausschließlich die neuen System-Bezeichner an allen relevanten Referenzstellen.
  - Keine Regression in UI, Würfellogik und Kompendiuminhalten durch die reine Namensmigration.

## 5. Delegation Map

| Step | Specialist | Input | Expected Output |
| ---- | ---------- | ----- | --------------- |
| 1 | docs | Externe Systemspezifikation der Variablennamenänderungen | Verbindliche Mappingliste alt zu neu für dieses Modul |
| 2 | code | Mappingliste + bestehende JS-Verwendungen | JS-Code referenziert nur neue Bezeichner |
| 3 | code | Mappingliste + HBS-Templates | Templates ohne Legacy-Namen |
| 4 | compendium | Mappingliste + _source JSON in packs/ | Kompendiumquellen mit neuen Namen |
| 5 | setup | Geänderte Code- und Kompendiumdateien | Erfolgreiche Lint/Test/Pack-Verifikation |
| 6 | docs | Prüfergebnisse und finale Umsetzungsdetails | Nachvollziehbare Abschlussdokumentation |

## 6. Implementation Result (2026-05-09)

### 6.1 Applied Mapping

- effect-item -> effectItem
- abgeleiteter-wert -> abgeleiteterWert
- freie_fertigkeit -> freieFertigkeit
- uebernatuerliche_fertigkeit -> uebernatuerlicheFertigkeit
- freiestalent -> freiesTalent

### 6.2 Changed Areas

- JavaScript updates:
   - scripts/apps/initiative-dialog.js
   - scripts/sheets/alternative-actor-sheet.js
   - scripts/sheets/alternative-creature-sheet.js
- Handlebars updates:
   - templates/sheets/character/tabs/kampf-tab.hbs
   - templates/sheets/character/tabs/skills-tab.hbs
- Compendium _source updates:
   - packs/effect-library/_source/*.json (all matching effect-item entries)
   - packs/nenneke-aktionen/_source/*.json (all matching effect-item entries)
   - packs/nenneke_regeln-abgeleitetewerte/_source/*.json (all matching abgeleiteter-wert entries)

### 6.3 Verification Summary

- Residual search check:
   - No remaining matches for legacy tokens in scripts/**, templates/**, module.js, packs/**/_source/**.
- Automated checks:
   - npm run lint: failed (existing repo-wide lint issues, not introduced by this migration).
   - npm test: failed because package.json has no test script.
   - npm run pack-all: passed.

### 6.4 Intentionally Unchanged

- Human-readable text in documentation files outside migration target paths remains unchanged.
- No file renames (snake_case/kebab-case) were performed.
- No migration logic for world data was added in the module (delegated to system-level migration).

### 6.5 Open Risks

- Manual in-Foundry smoke checks are still required (sheet rendering, roll/dialog flows, effect handling).
- Existing lint baseline makes it harder to detect unrelated regressions from lint output alone.
