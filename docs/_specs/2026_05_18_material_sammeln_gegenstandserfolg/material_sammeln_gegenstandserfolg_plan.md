# 1. Objective

Der alternative Fertigkeitsdialog soll bei `Material sammeln` nach einem Erfolg oder kritischen Erfolg eine einfache Gegenstandsauswahl aus passenden Welt-Items und Welt-Kompendium-Items anbieten, den gewählten Gegenstand als neues `gegenstand`-Item auf den Actor importieren und anschließend sofort dessen Bearbeitungsdialog öffnen.

# 2. Context & Research Summary

- Der relevante lokale Steuerpunkt bleibt `scripts/apps/fertigkeit-dialog.js`: Dort werden Nutzungskontext, Schwierigkeit, Rollformel und der eigentliche Rollaufruf bereits vollständig im Modul entschieden.
- Der Modul-Dialog nutzt aktuell `roll_crit_message(...)` aus dem Ilaris-System und feuert zusätzlich den Modul-Hook `ilaris-alternative-actor-sheet.fertigkeitDialogRolled`. Eine fertige Anschlusslogik für gegenstandsbezogene Erfolgsfolgen existiert dort noch nicht.
- Die Hook-Dokumentation des Ilaris-Systems in `C:/Users/padiq/AppData/Local/FoundryVTT/Data/systems/Ilaris/docs/develop/hooks.md` beschreibt für Skillwürfe einen strukturierten Post-Roll-Kontext mit `success`, `crit` und `fumble`. Für die Planung ist relevant, dass die gewünschte Erweiterung nur bei `success === true` beziehungsweise kritischem Erfolg laufen darf und bei Misserfolg oder Patzer nie.
- Im Modul existieren bereits belastbare Muster für Actor-Embedded-Document-Erzeugung über `actor.createEmbeddedDocuments('Item', ...)`, z. B. in `scripts/utilities.js` beim automatischen Hinzufügen von Fernkampfoptionen. Dieses Muster passt direkt zur Anforderung, den gewählten Gegenstand stets als neues Actor-Item anzulegen.
- Das Modul verwendet sowohl eigene AppV2-Anwendungen (`scripts/apps/fertigkeit-dialog.js`) als auch leichte `DialogV2.wait(...)`-Prompts in Sheets. Für die gewünschte „einfache Auswahl im Modulstil“ ist ein kleiner eigener AppV2-Dialog mit Handlebars-Template der robustere Fit, weil damit vorhandene Modul-CSS wiederverwendet werden kann, ohne auf Foundry-Standardmarkup beschränkt zu sein.
- Die bestehende Dialog-Optik ist bereits in `styles/fertigkeit-dialog.css` gekapselt und in `module.json` registriert. Ein neuer, kleiner Auswahl-Dialog kann deshalb ohne zusätzliche Manifest-Änderung auskommen, wenn er dieselbe Stilfamilie wiederverwendet.
- Weltweite Datenquellen lassen sich lokal über `game.items` sowie `game.packs` erschließen. Für diese Aufgabe sollen ausschließlich Welt-Items und Items aus Welt-Kompendien berücksichtigt werden; Modul-Kompendien wie `ilaris-alternative-actor-sheet.nenneke_regeln-gegenstaende` sind explizit auszuschließen.
- Die Kandidatenmenge muss auf `Item.type === 'gegenstand'` sowie einen case-insensitiven Teilstringtreffer auf `Zutat` oder `Material` im Namen eingeschränkt werden. Da identische Namen aus unterschiedlichen Quellen vorkommen können, sollte die Auswahlquelle in der UI sichtbar bleiben statt aggressiv dedupliziert zu werden.
- Die in den Planner-Vorgaben genannten `.agents`-Dokumente (`CODEBASE_ARCHITECTURE`, `PATTERNS_AND_EXAMPLES`, `GLOSSARY`) sind in diesem Workspace nicht vorhanden; die Recherche stützt sich daher auf die realen Moduldateien, die System-Hook-Dokumentation und die Foundry-Dokumentation zu Embedded Documents.
- Die Foundry-API-Dokumentation bestätigt `Actor.createEmbeddedDocuments(...)` als korrekten Pfad zum Erzeugen neuer Actor-Items. Danach kann das erzeugte Item direkt über sein Sheet geöffnet werden.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `scripts/apps/fertigkeit-dialog.js` | modify | Erfolgsstatus aus dem Rollpfad ableiten, Material-sammeln-spezifischen Nachlauf auslösen, Kandidatenquellen laden, gewähltes Item importieren und Actor-Item-Sheet öffnen |
| `scripts/apps/material-item-selection-dialog.js` | create | Neuer kleiner AppV2-Auswahldialog im Modulstil für die Auswahl eines einzigen gültigen Gegenstands |
| `templates/apps/material-item-selection-dialog.hbs` | create | Template für die Gegenstandsauswahl inklusive Quelle und Bestätigungsaktion |
| `styles/fertigkeit-dialog.css` | modify | Vorhandene Dialogstilfamilie um Layoutregeln für den kompakten Auswahl-Dialog erweitern |

# 4. Steps

1. Roll-Ergebnis im alternativen Fertigkeitsdialog für Folgeaktionen normalisieren
   - **What**: Den bestehenden Rollabschluss in `scripts/apps/fertigkeit-dialog.js` so analysieren und erweitern, dass nach dem Würfelwurf ein eindeutiger Erfolgsstatus (`success`, `crit`, `fumble`) lokal verfügbar ist. Falls der aktuelle `roll_crit_message(...)`-Pfad diesen Status nicht direkt in der benötigten Form zurückliefert, soll die Implementierung an derselben Stelle einen normalisierten Rollkontext herstellen, damit Folgeaktionen nicht an Chat-Parsing oder UI-Zustand gekoppelt werden.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `none`
   - **Reference**: `scripts/apps/fertigkeit-dialog.js`, `C:/Users/padiq/AppData/Local/FoundryVTT/Data/systems/Ilaris/docs/develop/hooks.md`

2. Kandidatenquellen für sammelbare Gegenstände aufbauen
   - **What**: Eine zentrale Ladefunktion ergänzen, die aus `game.items` und allen Welt-Kompendien eine Liste gültiger Kandidaten erstellt. Berücksichtigt werden nur Dokumente mit `type === 'gegenstand'` und Namen, die case-insensitiv `Zutat` oder `Material` enthalten. Die Ergebnisstruktur soll genug Metadaten tragen, um zwischen Welt-Item und Welt-Kompendium zu unterscheiden und später das korrekte Quelldokument zu laden bzw. zu importieren.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `1`
   - **Reference**: `scripts/utilities.js`, Foundry `game.items`, Foundry `game.packs` / `getIndex(...)`

3. Einfachen Auswahl-Dialog im Modulstil anlegen
   - **What**: Einen kleinen AppV2-Dialog für die Einzelauswahl eines Gegenstands erstellen. Der Dialog soll eine einzelne Auswahl aus den vorbereiteten Kandidaten, sichtbare Quellenkennzeichnung und klare Bestätigungs-/Abbruchaktionen bieten. Die UI soll bewusst einfach bleiben und keine Mehrfachauswahl oder Mengenlogik einführen.
   - **Where**: `scripts/apps/material-item-selection-dialog.js`, `templates/apps/material-item-selection-dialog.hbs`
   - **Who**: `code`
   - **Depends on**: `2`
   - **Reference**: `scripts/apps/fertigkeit-dialog.js`, `templates/apps/fertigkeit-dialog.hbs`, Foundry `ApplicationV2`

4. Material-sammeln-Folgeaktion nur bei Erfolg oder kritischem Erfolg auslösen
   - **What**: Den Nachlauf in `scripts/apps/fertigkeit-dialog.js` so verdrahten, dass die Gegenstandsauswahl ausschließlich dann startet, wenn `usageContext.key === 'gatherMaterials'` und der normalisierte Rollstatus Erfolg oder kritischen Erfolg signalisiert. Bei Misserfolg oder Patzer darf weder Dialog noch Item-Erzeugung ausgelöst werden.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`, `scripts/apps/material-item-selection-dialog.js`
   - **Who**: `code`
   - **Depends on**: `1`, `3`
   - **Reference**: `C:/Users/padiq/AppData/Local/FoundryVTT/Data/systems/Ilaris/docs/develop/hooks.md`, `scripts/apps/fertigkeit-dialog.js`

5. Gewähltes Welt- oder Welt-Kompendium-Item als neues Actor-Item importieren
   - **What**: Nach Bestätigung den gewählten Gegenstand laden, als neues eingebettetes Item auf dem Actor anlegen und bewusst immer ein neues Item erzeugen, nicht stapeln oder mergen. Welt-Items sollen als Kopie importiert werden; Welt-Kompendium-Items sollen über ihr Quelldokument geladen und ebenfalls als neue Actor-Kopie erzeugt werden.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `2`, `4`
   - **Reference**: `scripts/utilities.js`, Foundry `Actor.createEmbeddedDocuments(...)`

6. Neues Actor-Item direkt zur Bearbeitung öffnen
   - **What**: Direkt nach erfolgreicher Erzeugung das neu angelegte Actor-Item referenzieren und dessen Item-Sheet öffnen. Der Öffnungspfad soll sich auf das tatsächlich erzeugte Actor-Item beziehen, nicht auf das Ursprungsdokument aus Welt oder Kompendium.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`
   - **Who**: `code`
   - **Depends on**: `5`
   - **Reference**: Foundry `Item.sheet.render(true)`, vorhandene `render(true)`-Aufrufe im Modul

7. Auswahl- und Fehlerzustände benutzerseitig sauber behandeln
   - **What**: Definieren und implementierbar machen, was bei leerer Trefferliste, Dialog-Abbruch oder Importfehler passiert. Erwartet ist: keine Actor-Mutation bei Abbruch, keine Folgeaktion bei leerer Liste außer klarer Benutzerhinweis, keine Quellen außerhalb Welt/Welt-Kompendium, und keine unbeabsichtigte Auslösung für `Gegenstand herstellen` oder `Gegenstand einkaufen`.
   - **Where**: `scripts/apps/fertigkeit-dialog.js`, `scripts/apps/material-item-selection-dialog.js`, `styles/fertigkeit-dialog.css`
   - **Who**: `code`
   - **Depends on**: `4`, `5`, `6`
   - **Reference**: `styles/fertigkeit-dialog.css`, vorhandene `ui.notifications`-Nutzung im Modul

8. Dialogstil für die kompakte Auswahl ergänzen
   - **What**: Die bestehende Dialog-CSS so erweitern, dass der neue Auswahl-Dialog denselben Modul-Look übernimmt und auf Desktop wie Mobil konsistent bleibt. Es sollen nur kleine Ergänzungen für Listen-/Select-Layout, Quellenhinweise und Abstände hinzugefügt werden.
   - **Where**: `styles/fertigkeit-dialog.css`
   - **Who**: `code`
   - **Depends on**: `3`
   - **Reference**: `styles/fertigkeit-dialog.css`

# 5. Validation Plan

## Step 1-4

- **Command**: `npm run lint`
- **Manual check**: Im alternativen Fertigkeitsdialog `Material sammeln` wählen und jeweils einen Erfolg, kritischen Erfolg, Misserfolg und Patzer testen.
- **Expected outcome**: Die Gegenstandsauswahl erscheint nur bei Erfolg und kritischem Erfolg. Bei Misserfolg und Patzer erscheint sie nie.

## Step 2-3

- **Command**: `npm run lint`
- **Manual check**: Welt-Items und mindestens ein Welt-Kompendium mit passenden `gegenstand`-Einträgen bereitstellen; zusätzlich Modul-Kompendiumeinträge mit passenden Namen sichtbar im System belassen.
- **Expected outcome**: Die Auswahl enthält nur Welt-Items und Welt-Kompendium-Items. Modul-Kompendien werden nicht angeboten. Jeder Eintrag zeigt genug Kontext, um gleiche Namen aus verschiedenen Quellen zu unterscheiden.

## Step 5-6

- **Command**: `npm run lint`
- **Manual check**: Einen Gegenstand aus Welt und einen aus Welt-Kompendium auswählen.
- **Expected outcome**: In beiden Fällen wird jeweils ein neues Actor-Item erzeugt und unmittelbar dessen Bearbeitungsdialog geöffnet. Bestehende gleichnamige Actor-Items bleiben unberührt.

## Step 7-8 / Gesamtvalidierung

- **Command**: `npm run lint`
- **Manual check**:
  - `Material sammeln` mit leerer Trefferliste simulieren.
  - Auswahl-Dialog abbrechen.
  - Danach `Gegenstand herstellen`, `Gegenstand einkaufen` und `nichts` testen.
  - Alternativen Heldenbogen erneut öffnen und prüfen, dass keine Regression im restlichen Fertigkeitsdialog entsteht.
- **Expected outcome**: Bei leerer Trefferliste erfolgt nur ein Hinweis ohne Actor-Änderung. Bei Abbruch wird nichts importiert. Andere Nutzungskontexte behalten ihr bisheriges Verhalten ohne neuen Auswahl-Dialog.

# 6. Assumptions & Open Questions

## Assumptions

- Die neue Gegenstandsauswahl gilt vorerst ausschließlich für `Material sammeln` und nicht für `Gegenstand herstellen` oder `Gegenstand einkaufen`.
- Es wird immer genau ein Gegenstand ausgewählt und importiert.
- Auch bei identischem Namen wird immer ein neues Actor-Item angelegt; es findet kein Stacking und keine Mengenlogik statt.
- Das Öffnen des neu erzeugten Actor-Item-Sheets über das normale Foundry-Item-Sheet ist fachlich ausreichend; ein spezieller Modul-Editor ist nicht erforderlich.
- Die bestehende Stylesheet-Registrierung in `module.json` reicht aus; der neue Auswahl-Dialog kann dieselbe CSS-Datei mitbenutzen.

## Open Questions

- Falls die aktuelle Alternative-Dialog-Implementierung den System-Hookvertrag (`success`, `crit`, `fumble`) noch nicht direkt spiegelt, muss während der Umsetzung entschieden werden, ob der Erfolgsstatus über die Rückgabe des Rollhelpers oder über einen ergänzten lokalen Roll-Payload normiert wird.
- Die genaue Runtime-Eigenschaft, an der Welt-Kompendien von Modul-Kompendien gefiltert werden, sollte beim Implementieren einmal gegen das reale Pack-Objekt verifiziert werden, damit keine Foundry-Versionsannahme hart codiert wird.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehender Rollabschluss des alternativen Fertigkeitsdialogs und System-Hook-Doku | Normalisierter lokaler Erfolgsstatus für Folgeaktionen |
| 2 | code | Nutzerfilter: Welt/Welt-Kompendium, `gegenstand`, Name enthält `Zutat` oder `Material` | Zentrale Kandidatenliste mit Quellenmetadaten |
| 3 | code | Vorhandene AppV2- und Template-Muster des Moduls | Neuer kompakter Auswahl-Dialog im Modulstil |
| 4 | code | Normalisierter Rollstatus plus `usageContext` | Erfolgspfad nur für `Material sammeln` |
| 5 | code | Gewähltes Quelldokument aus Welt oder Welt-Kompendium | Neues eingebettetes Actor-Item ohne Stacking |
| 6 | code | Neu erzeugtes Actor-Item | Sofort geöffnetes Actor-Item-Sheet |
| 7 | code | Auswahlfluss und Fehlerszenarien | Robustes Verhalten bei Abbruch, Leertreffern und Fehlimporten |
| 8 | code | Vorhandenes Dialog-CSS | Konsistenter Modul-Look für den Auswahl-Dialog |
