# 1. Objective

Die Kompendium-Quelldaten unter `packs/*/_source` dieses Moduls sollen anhand der im Ilaris-System definierten Umbenennungen geprüft und alle tatsächlich noch vorhandenen Legacy-Datenfelder in Item-Einträgen auf die neuen Bezeichner umgestellt werden.

# 2. Context & Research Summary

- Referenzquellen sind die externen System-Pläne `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_07_refactoring_variablennamen\refactoring_variablennamen_plan.md`, `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_07_ui_modernisierung_entkopplung\plan_ui_entkopplung.md` und `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_03_inventarisierung_datenmodell\inventarisierung_datenmodell_plan.md`.
- Für Kompendium-Items sind daraus zwei Rename-Klassen direkt relevant:
   - Typ-Umbenennungen: `freiestalent -> freiesTalent`, `freie_fertigkeit -> freieFertigkeit`, `uebernatuerliche_fertigkeit -> uebernatuerlicheFertigkeit`, `effect-item -> effectItem`, `abgeleiteter-wert -> abgeleiteterWert`.
   - Feld-Umbenennungen im aktuellen ModelData-Zuschnitt: `voraussetzungen -> voraussetzung` bei `manoever` sowie `wm -> wm_at` bei Waffen/Angriffsdaten.
- Im Modul existiert bereits eine frühere Planung unter `docs/_specs/2026_05_09_variablennamen_sync_migration/variablennamen_sync_migration_plan.md`, die dieselbe Mappingliste dokumentiert und frühere Teilanpassungen in Code, Templates und Compendium-Quellen festhält.
- Die `_source`-Daten sind im Modul vorhanden; die Recherche fand 1822 JSON-Dateien unter `packs/**/_source/*.json`.
- Eine gezielte Suche nach alten Typ-Strings in `packs/**/_source/*.json` ergab aktuell keine Treffer. Die neuen Typen `effectItem` und `abgeleiteterWert` kommen bereits in `packs/effect-library/_source/*.json`, `packs/nenneke-aktionen/_source/*.json` und `packs/nenneke_regeln-abgeleitetewerte/_source/*.json` vor.
- Die zusätzliche Recherche zu Feldern zeigt ein differenziertes Bild: `wm_at` ist in `packs/nenneke_regeln-waffen/_source/*.json` bereits breit vorhanden, ein Legacy-Feld `wm` wurde in den `_source`-JSONs nicht bestätigt; `voraussetzung` ist in `packs/nenneke_regeln-vorteile/_source/*.json` bereits etabliert, während `voraussetzungen` noch vielfach in `packs/nenneke_regeln-manoever/_source/*.json` vorkommt.
- Die Datenmodell-Inventarisierung bestätigt dabei die fachliche Zuordnung: `manoever` gehört zu den Meta-Items und ist der naheliegende Kandidat für die Feldmigration `voraussetzungen -> voraussetzung`; Waffen verwenden im aktuellen Modell `wm_at`.
- Daraus folgt: Das Implementierungsvorgehen muss mit einer verifizierenden Bestandsaufnahme beginnen und darf nicht pauschal davon ausgehen, dass alle im System dokumentierten Umbenennungen in diesem Modul noch offen sind. Nach der aktuellen Recherche ist vor allem die `manoever`-Migration bei den Compendium-Quelldaten konkret zu prüfen bzw. umzusetzen.
- Relevante Randbedingung aus `package.json`: Es gibt `npm run lint` und `npm run pack-all`, aber kein `npm test`-Script. Die Validierung muss sich daher auf Suche, Lint und Pack-Rebuild stützen.
- `.agents/CODEBASE_ARCHITECTURE.md`, `.agents/PATTERNS_AND_EXAMPLES.md` und `.agents/GLOSSARY.md` sind in diesem Workspace nicht vorhanden; die Planung stützt sich deshalb auf die vorhandenen Repo-Dokumente und die konkrete Dateistruktur.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `docs/_specs/2026_05_18_compendium_variablennamen_sync/compendium_variablennamen_sync_plan.md` | create | Umsetzungsplan für die Compendium-Migration dokumentieren |
| `packs/**/_source/*.json` | modify only where matches are found | Legacy-Datenfelder in Item-Einträgen auf die neuen Variablennamen umstellen |
| `packs/nenneke_regeln-manoever/_source/*.json` | likely modify | Bestätigte Legacy-Vorkommen von `voraussetzungen`, die gegen das kanonische Feld `voraussetzung` geprüft werden müssen |
| `packs/nenneke_regeln-waffen/_source/*.json` | verify only | Prüfen, ob entgegen der bisherigen Suche doch noch Legacy-Felder wie `wm` existieren; aktuell ist nur `wm_at` bestätigt |

# 4. Steps

1. **What**: Die vollständige, für Kompendium-Items relevante Rename-Matrix aus den externen System-Plänen ableiten und auf rein datenfeldbezogene Änderungen in Item-Einträgen einschränken; dabei Typ-Umbenennungen und Feld-Umbenennungen getrennt erfassen sowie explizit festhalten, welche bekannten Umbenennungen in Scope sind und welche systemweiten Refactorings nicht in Scope sind.
   **Where**: `docs/_specs/2026_05_18_compendium_variablennamen_sync/compendium_variablennamen_sync_plan.md`, externe Referenzen `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_07_refactoring_variablennamen\refactoring_variablennamen_plan.md`, `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_07_ui_modernisierung_entkopplung\plan_ui_entkopplung.md`, `C:\Users\padiq\AppData\Local\FoundryVTT\Data\systems\Ilaris\docs\_specs\2026_05_03_inventarisierung_datenmodell\inventarisierung_datenmodell_plan.md`
   **Who**: `docs`
   **Depends on**: `none`
   **Reference**: Externe Ilaris-Pläne vom 2026-05-03 und 2026-05-07; vorhandener Modulplan `docs/_specs/2026_05_09_variablennamen_sync_migration/variablennamen_sync_migration_plan.md`

2. **What**: Alle `packs/*/_source`-JSONs systematisch nach den alten Bezeichnern durchsuchen, die Treffer pro Pack dokumentieren und zwischen echten Datenfeldern in Item-Einträgen und irrelevanten Vorkommen unterscheiden; dabei Typ-Strings und Feldnamen getrennt auswerten. Der aktuelle Vorbefund ist zu verifizieren: keine alten Typ-Strings mehr, kein bestätigtes `wm`, aber bestätigte `voraussetzungen`-Vorkommen in `packs/nenneke_regeln-manoever/_source/*.json`.
   **Where**: `packs/**/_source/*.json`
   **Who**: `compendium`
   **Depends on**: `1`
   **Reference**: Bestehende `_source`-Struktur unter `packs/`; Suchmuster aus Schritt 1

3. **What**: Nur die in Schritt 2 bestätigten Treffer in den betroffenen JSON-Dateien umbenennen; dabei ausschließlich die Item-Datenfelder ändern und keine Textinhalte, Flags außerhalb des Scopes oder LevelDB-Dateien anfassen. Falls der Vorbefund bestehen bleibt, umfasst die konkrete Umsetzung primär `manoever.voraussetzungen -> manoever.voraussetzung`; Typ- oder Waffenfeld-Anpassungen erfolgen nur bei bestätigten Legacy-Treffern.
   **Where**: `packs/**/_source/*.json`
   **Who**: `compendium`
   **Depends on**: `2`
   **Reference**: `docs/_specs/2026_05_09_variablennamen_sync_migration/variablennamen_sync_migration_plan.md`; Konvention aus `.github/instructions/compendium.instructions.md`

4. **What**: Nach der JSON-Anpassung eine Restsuche nach allen alten Bezeichnern über sämtliche `_source`-Dateien laufen lassen und verifizieren, dass nur neue Variablennamen verbleiben; falls der Audit bereits in Schritt 2 null Legacy-Treffer ergeben hat, dieselbe Suche als Nachweis der Vollständigkeit wiederholen.
   **Where**: `packs/**/_source/*.json`
   **Who**: `compendium`
   **Depends on**: `3`
   **Reference**: Die bekannten Alt-Bezeichner aus Schritt 1, insbesondere die Feldnamen `voraussetzungen` und `wm`

5. **What**: Die Compendien aus den aktualisierten `_source`-Daten neu packen und das Ergebnis mit einer kurzen Stichprobe gegen die tatsächlich betroffenen Packs absichern; wenn es keine Datenänderungen gab, den Rebuild dennoch als Konsistenzprüfung einplanen.
   **Where**: `packs/**/_source/*.json`, `package.json`, `utils/pack-all.js`
   **Who**: `setup`
   **Depends on**: `4`
   **Reference**: `package.json` Script `pack-all`; `.github/instructions/compendium.instructions.md`

6. **What**: Das Ergebnis der Umsetzung dokumentieren: geänderte Packs, Anzahl der tatsächlich bearbeiteten Dateien, verwendete Rename-Matrix und den Fall, dass die Prüfung keine verbleibenden Legacy-Datenfelder ergeben hat.
   **Where**: `docs/_specs/2026_05_18_compendium_variablennamen_sync/compendium_variablennamen_sync_plan.md`
   **Who**: `docs`
   **Depends on**: `5`
   **Reference**: Vorbildhafte Ergebnisdokumentation in `docs/_specs/2026_05_09_variablennamen_sync_migration/variablennamen_sync_migration_plan.md`

# 5. Validation Plan

- Schritt 2:
   - Befehl: Suche nach `freiestalent|freie_fertigkeit|uebernatuerliche_fertigkeit|effect-item|abgeleiteter-wert|voraussetzungen|wm` in `packs/**/_source/*.json`
   - Erwartung: Entweder eine vollständige Trefferliste pro Pack oder ein belastbarer Nullbefund; nach aktuellem Stand insbesondere Treffer für `voraussetzungen` in den Manoever-Quelldaten.
- Schritt 3:
  - Manuelle Prüfung: Stichprobe aus jeder tatsächlich geänderten Pack-Gruppe; prüfen, dass nur das beabsichtigte Datenfeld geändert wurde.
  - Erwartung: Keine unbeabsichtigten Änderungen an Name, Beschreibung, Flags oder anderen Datenbereichen.
- Schritt 4:
   - Befehl: Erneute Restsuche nach allen Alt-Bezeichnern in `packs/**/_source/*.json`
  - Erwartung: 0 Treffer.
- Schritt 5:
  - Befehl: `npm run pack-all`
  - Erwartung: Pack-Rebuild läuft erfolgreich durch.
- Gesamtvalidierung:
  - Befehl: `npm run lint`
  - Erwartung: Keine neuen lint-relevanten Probleme durch die bearbeiteten JSON-/Dokumentationsänderungen.
  - Manuelle Prüfung: In Foundry stichprobenartig je ein Item aus jedem tatsächlich betroffenen Pack öffnen.
  - Erwartung: Die Items laden weiterhin korrekt und verwenden die neuen Typ-/Feldbezeichner.

# 6. Assumptions & Open Questions

- Annahme: Für diesen Auftrag sind nur Datenfelder in Kompendium-Item-Einträgen relevant, nicht Code, Templates oder Weltmigrationen.
- Annahme: Die aus den externen System-Plänen abgeleiteten Typ- und Feld-Umbenennungen bilden die relevante Mindestmenge für diese Compendium-Anpassung.
- Annahme: `packs/*/_source` ist die einzig maßgebliche Quelle; LevelDB-Dateien werden nicht direkt bearbeitet.
- Offene Frage: Die aktuelle Recherche zeigt keine Legacy-Typstrings mehr in den `_source`-JSONs dieses Moduls. Der verbleibende Hauptkandidat ist derzeit `manoever.voraussetzungen`; vor der Umsetzung muss nur noch ausgeschlossen werden, dass weitere alte Feldnamen aus anderen Systemplänen übersehen wurden.
- Offene Frage: Der UI-Plan benennt `wm -> wm_at` als relevante Bereinigung, in den `_source`-JSONs dieses Moduls wurde aber bislang nur `wm_at` bestätigt. Dieser Nullbefund sollte vor der Implementierung noch einmal gezielt validiert werden.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | docs | Externer Ilaris-Plan und bestehender Modulplan | Verbindliche Mappingliste und Scope-Abgrenzung |
| 2 | compendium | Mappingliste aus Schritt 1 und alle `_source`-JSONs | Trefferliste pro Pack oder belegter Nullbefund |
| 3 | compendium | Bestätigte Trefferliste | Geänderte JSON-Dateien nur an relevanten Datenfeldern |
| 4 | compendium | Geänderte `_source`-JSONs | Nulltreffer für alle Alt-Bezeichner |
| 5 | setup | Aktualisierte `_source`-Dateien | Erfolgreicher Pack-Rebuild und kurze Validierungsnotiz |
| 6 | docs | Such- und Validierungsergebnisse | Abschlussdokumentation mit Änderungsumfang oder Nullbefund |

# 8. Implementation Result (2026-05-18)

## 8.1 Confirmed Rename Scope

- Legacy-Typ-Strings `freiestalent`, `freie_fertigkeit`, `uebernatuerliche_fertigkeit`, `effect-item` und `abgeleiteter-wert` wurden in `packs/**/_source/*.json` nicht mehr gefunden.
- Das Legacy-Feld `wm` wurde in den `_source`-JSONs ebenfalls nicht gefunden.
- Als einziger bestätigter Restbefund blieb `manoever.voraussetzungen` im Pack `packs/nenneke_regeln-manoever/_source`.

## 8.2 Applied Data Migration

- Geändertes Mapping: `voraussetzungen -> voraussetzung`
- Betroffener Pack: `packs/nenneke_regeln-manoever/_source`
- Tatsächlich bearbeitete Dateien: 65 JSON-Dateien
- Änderungsart: ausschließlich Umbenennung des JSON-Schlüssels im `system`-Block; Werte und sonstige Datenfelder blieben unverändert.

## 8.3 Verification Summary

- Vorher-Nachher-Audit über `packs/**/_source/*.json`: Nach der Umsetzung keine Treffer mehr für `freiestalent|freie_fertigkeit|uebernatuerliche_fertigkeit|effect-item|abgeleiteter-wert|voraussetzungen|wm`.
- Stichprobe geprüft: Manoever-Dateien mit gesetzter und leerer Voraussetzung verwenden nun konsistent `voraussetzung`.
- Die positive Gegensuche nach `"voraussetzung"` im Manoever-Pack bestätigt 65 Treffer und damit die vollständige Umstellung der zuvor betroffenen Dateien.
- `npm install`: erfolgreich; Abhängigkeiten waren bereits aktuell.
- `npm run pack-all`: nach BOM-freier Neuschreibung der geänderten JSON-Dateien erfolgreich; alle 13 Packs wurden neu gebaut.
- `npm run lint`: fehlgeschlagen, aber mit bestehender Repo-Baseline statt mit einem durch diese Migration verursachten neuen JSON-/Doku-Problem.

## 8.4 Residual Risks

- Die betroffenen Manoever sollten in Foundry noch stichprobenartig geöffnet werden, um die Feldumbenennung gegen die Laufzeitdarstellung zu bestätigen.
- Der Lint-Status des Repos bleibt unabhängig von dieser Änderung insgesamt rot und sollte separat bereinigt werden.