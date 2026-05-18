# 1. Objective

Der modul-eigene Fertigkeitsdialog soll zusätzlich zum bereits geplanten Aktions-Dropdown ein zweites temporäres Dropdown `Benutzter Gegenstand` erhalten, das alle Actor-Items vom Typ `gegenstand` plus `nichts` mit Mengenanzeige anbietet, den gewählten Gegenstand im Chat des Würfelwurfs sichtbar macht und beim tatsächlichen Wurf für Fertigkeits-, freie Fertigkeits- und Attributproben genau 1 Stück verbraucht bzw. bei Menge 0 den Gegenstand aus dem Inventar entfernt.

# 2. Context & Research Summary

- Die in der Planner-Vorgabe genannten Dateien `.agents/CODEBASE_ARCHITECTURE.md`, `.agents/PATTERNS_AND_EXAMPLES.md`, `.agents/GLOSSARY.md` und `AGENTS.md` sind in diesem Workspace nicht vorhanden. Die Recherche musste daher direkt über die realen Moduldateien erfolgen.
- Das Modul besitzt den Fertigkeitsdialog bereits selbst: `scripts/apps/fertigkeit-dialog.js` enthält eine vollständige AppV2-Dialogklasse mit zentralen Zustands- und Rollmethoden, und `templates/apps/fertigkeit-dialog.hbs` ist bereits in `module.js` vorgeladen.
- Das Routing ist schon sauber auf das Modul begrenzt: `templates/sheets/character/tabs/skills-tab.hbs` setzt `rollscope="module-skills-dialog"`, und `scripts/sheets/alternative-actor-sheet.js` öffnet für diesen Scope bereits den Modul-Dialog für profane Fertigkeiten, freie Fertigkeiten und Attributproben.
- Der bestehende Dialog verwaltet Eingaben zentral über `_handleInputChange()`, `_syncStateFromForm()`, `_calculateModifiers()` und `_executeRoll()`. Ein weiteres temporäres Dropdown sollte deshalb an genau diese State-Pipeline angeschlossen werden, statt eigene DOM-Sonderpfade einzuführen.
- Der Chattext wird aktuell in `_executeRoll()` zusammengesetzt. Dort werden bereits `Nutzung` und `Schwierigkeit` sichtbar gemacht und ein Modul-Hook `ilaris-alternative-actor-sheet.fertigkeitDialogRolled` mit Payload ausgelöst. Das ist der direkte Erweiterungspunkt für `Benutzter Gegenstand`.
- Mengenlogik für Gegenstände existiert im Modul bereits an zwei Stellen als Präzedenzfall: `scripts/sheets/alternative-actor-sheet.js` behandelt `item.system.quantity` inklusive Löschen bei `<= 0`, und `scripts/utilities.js` nutzt dasselbe Muster für Munition mit `gegenstand`-Items.
- Die Nutzeranforderung ist eindeutig auf nicht persistente Dialogauswahl beschränkt: `nichts` bleibt bei jedem Öffnen der Default, die Auswahl soll nur beim tatsächlichen Würfelwurf wirken, und der Verbrauch gilt für alle drei durch den Modul-Dialog unterstützten Probenarten.
- Risiko: Zwischen Dialog-Öffnen und Würfelklick kann sich das Inventar ändern. Die Implementierung muss deshalb beim Verbrauch per stabiler Item-Identität erneut am Actor validieren, statt sich nur auf gerenderte Anzeigetexte zu verlassen.
- Risiko: Die offizielle API-Abfrage lieferte aktuelle Foundry-Dokumentation, während das Modul laut `module.json` auf Version 13 zielt. Die vorgesehenen Operationen `item.update()` und `item.delete()` entsprechen aber bereits verwendeten Modulmustern und liegen damit im vorhandenen Kompatibilitätsrahmen.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `scripts/apps/fertigkeit-dialog.js` | modify | Zusätzlichen Dialogzustand für den benutzten Gegenstand einführen, Gegenstandsoptionen aus dem Actor ableiten, Auswahl in Chat und Hook integrieren und beim Würfelwurf genau 1 Menge verbrauchen bzw. löschen |
| `templates/apps/fertigkeit-dialog.hbs` | modify | Zweites Dropdown `Benutzter Gegenstand` mit `nichts` als Default und allen `gegenstand`-Items inkl. Mengenanzeige ergänzen |
| `styles/fertigkeit-dialog.css` | modify | Falls nötig, Breite, Zeilenumbruch und Fokuszustände für das zusätzliche Dropdown im bestehenden Dialoglayout stabil halten |

# 4. Steps

1. Gegenstandsauswahl in den Dialogzustand aufnehmen
- **What**: In der bestehenden Dialogklasse eine zweite nicht persistierte Auswahl `usedItem` ergänzen, die beim Öffnen immer auf `none` initialisiert wird. Aus `actor.items` sollen ausschließlich Dokumente vom Typ `gegenstand` gelesen und in ein Template-taugliches Optionsformat mit stabilem Identifikator, Name und `item.system.quantity` umgewandelt werden.
- **Where**: `scripts/apps/fertigkeit-dialog.js`
- **Who**: `code`
- **Depends on**: `none`
- **Reference**: `scripts/apps/fertigkeit-dialog.js`, `scripts/sheets/alternative-actor-sheet.js`, `scripts/utilities.js`

2. Zweites Dropdown im Template ergänzen
- **What**: Im bestehenden Dialogtemplate unterhalb des Aktions-Dropdowns ein weiteres Feld mit dem Label `Benutzter Gegenstand` ergänzen. Die erste Option muss `nichts` sein. Danach folgen alle Actor-Items vom Typ `gegenstand`, jeweils mit Mengenanzeige im sichtbaren Label, zum Beispiel `Seil (3)`. Das Select muss in dieselbe Change- und Input-Logik eingebunden bleiben wie die übrigen Formfelder.
- **Where**: `templates/apps/fertigkeit-dialog.hbs`
- **Who**: `code`
- **Depends on**: `1`
- **Reference**: `templates/apps/fertigkeit-dialog.hbs`, `scripts/apps/fertigkeit-dialog.js`

3. Auswahl im Rollkontext und Chat sichtbar machen
- **What**: Die zentrale Modifikator- bzw. Rollzustandsberechnung so erweitern, dass der gewählte Gegenstand als strukturierter Wert verfügbar ist. Beim tatsächlichen Würfelwurf muss der Chattext zusätzlich eine Zeile wie `Benutzter Gegenstand: ...` erhalten, sofern nicht `nichts` gewählt wurde. Derselbe Wert soll in den bestehenden Hook-Payload aufgenommen werden, damit Folgefeatures den Gegenstand ohne erneute DOM-Abfrage verwenden können.
- **Where**: `scripts/apps/fertigkeit-dialog.js`
- **Who**: `code`
- **Depends on**: `1`, `2`
- **Reference**: `scripts/apps/fertigkeit-dialog.js`, `https://foundryvtt.com/api/classes/foundry.documents.Actor.html`, `https://foundryvtt.com/api/classes/foundry.documents.BaseItem.html`

4. Verbrauchslogik beim echten Würfelwurf implementieren
- **What**: In `_executeRoll()` oder einer von dort aufgerufenen Hilfsmethode den ausgewählten Gegenstand nur dann verbrauchen, wenn tatsächlich der Würfel-Button des Dialogs ausgeführt wurde. Der Verbrauch muss für alle drei bereits unterstützten Probenarten gelten. Die Logik soll das aktuelle Item erneut am Actor auflösen, `system.quantity` um 1 reduzieren und bei Ergebnis `<= 0` das Item löschen. Wenn das Item zwischenzeitlich nicht mehr existiert oder keine Menge mehr hat, muss der Wurf stabil bleiben und eine saubere Nutzerinformation vorgesehen werden.
- **Where**: `scripts/apps/fertigkeit-dialog.js`
- **Who**: `code`
- **Depends on**: `1`, `3`
- **Reference**: `scripts/apps/fertigkeit-dialog.js`, `scripts/utilities.js`, `scripts/sheets/alternative-actor-sheet.js`, `https://foundryvtt.com/api/classes/foundry.documents.BaseItem.html`

5. Dialoglayout für das zusätzliche Feld absichern
- **What**: Prüfen, ob das zweite Dropdown im vorhandenen Layout ohne Überlauf oder abgeschnittene Labels funktioniert. Falls nötig, vorhandene Dialog-CSS minimal erweitern, damit längere Gegenstandsnamen mit Mengenangabe in Light- und Dark-Mode lesbar bleiben und Fokuszustände konsistent bleiben.
- **Where**: `styles/fertigkeit-dialog.css`
- **Who**: `code`
- **Depends on**: `2`
- **Reference**: `styles/fertigkeit-dialog.css`, `templates/apps/fertigkeit-dialog.hbs`

6. Regressionen und Randfälle validieren
- **What**: Verifizieren, dass `nichts` bei jedem Öffnen vorausgewählt ist, dass nur `gegenstand`-Items im Dropdown erscheinen, dass die Mengen korrekt angezeigt werden, dass bei jedem tatsächlichen Wurf genau 1 verbraucht wird, dass das Item bei 0 verschwindet, und dass freie Fertigkeiten sowie Attributproben denselben Verbrauchspfad nutzen. Zusätzlich muss geprüft werden, dass die bereits vorhandene `Aktion`-Auswahl unverändert weiterfunktioniert.
- **Where**: Betroffene Dateien aus Abschnitt 3 sowie manuelle Prüfung in Foundry
- **Who**: `code`
- **Depends on**: `3`, `4`, `5`
- **Reference**: `scripts/apps/fertigkeit-dialog.js`, `templates/apps/fertigkeit-dialog.hbs`, `templates/sheets/character/tabs/skills-tab.hbs`

# 5. Validation Plan

- **Step 1**
- Commands to run: `npm run lint`
- Manual checks: Dialog aus dem Fertigkeiten-Tab öffnen und prüfen, dass `Benutzter Gegenstand` mit `nichts` als Default erscheint und nur `gegenstand`-Items des Actors gelistet werden.
- Expected outcomes: Keine Lint-Fehler; die Optionsliste enthält keine anderen Item-Typen und zeigt Mengen an.

- **Step 2-3**
- Commands to run: `npm run lint`
- Manual checks: Einen Gegenstand auswählen und einen Wurf für profane Fertigkeit, freie Fertigkeit und Attributprobe durchführen.
- Expected outcomes: Der Chattext enthält weiterhin Nutzung und Schwierigkeit und zusätzlich den gewählten Gegenstand; der Hook-Payload enthält denselben Gegenstandsbezug.

- **Step 4**
- Commands to run: `npm run lint`
- Manual checks: Vor dem Wurf die Item-Menge notieren, dann würfeln.
- Expected outcomes: Nach jedem tatsächlichen Wurf sinkt die Menge exakt um 1; bei Wechsel von 1 auf 0 wird das Item aus dem Inventar entfernt; bei Dialog öffnen oder Abbruch passiert kein Verbrauch.

- **Step 5**
- Commands to run: `npm run lint`
- Manual checks: Dialog mit kurzen und langen Gegenstandsnamen in hellem und dunklem Theme prüfen.
- Expected outcomes: Labels und Select bleiben lesbar, ohne Layoutbruch oder unleserliche Fokuszustände.

- **Overall result**
- Commands to run: `npm test`, `npm run lint`
- Manual checks: Alternative Heldensheet öffnen, mehrere Würfe mit und ohne benutzten Gegenstand durchführen, danach Inventar prüfen.
- Expected outcomes: Keine Test- oder Lint-Regressionen; die Auswahl bleibt temporär, der Chat zeigt den benutzten Gegenstand, und der Verbrauch funktioniert nur beim echten Würfelwurf für alle drei Probearten.

# 6. Assumptions & Open Questions

- Die Auswahl `Benutzter Gegenstand` soll zusätzlich zum bereits vorhandenen Aktions-Dropdown angezeigt werden, nicht an dessen Stelle.
- Relevante Items sind ausschließlich Actor-Items vom Typ `gegenstand`.
- Die maßgebliche Mengenquelle ist einheitlich `item.system.quantity`.
- Der Verbrauch soll unabhängig von Erfolg oder Misserfolg des Wurfs erfolgen, solange tatsächlich ein Würfelwurf aus dem Dialog ausgelöst wurde.
- `nichts` bleibt bei jedem Öffnen des Dialogs der Defaultwert und wird nicht pro Actor gespeichert.
- Offene Frage: Falls ein ausgewählter Gegenstand zwischen Dialogöffnung und Würfelklick von einem anderen Prozess gelöscht oder auf 0 reduziert wurde, muss die Umsetzung entscheiden, ob nur eine Warnung ausgegeben oder zusätzlich der Chattext kenntlich gemacht wird. Funktional darf dieser Randfall den Wurf nicht abbrechen.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehende Dialogklasse und Actor-Inventory-Struktur | Dialogzustand mit temporärer Gegenstandsauswahl und normierter Optionsliste |
| 2 | code | Vorhandenes Dialogtemplate und gewünschtes Label/Default | Template mit zweitem Dropdown `Benutzter Gegenstand` und Mengenanzeige |
| 3 | code | Dialogzustand aus Schritt 1-2 und bestehender Chat- und Hook-Pfad | Rollkontext, Chattext und Hook-Payload mit sichtbarem benutzten Gegenstand |
| 4 | code | Bestehende Rollausführung und Mengenmuster aus Moduldateien | Verbrauchslogik für `gegenstand`-Items mit Update- oder Delete-Pfad |
| 5 | code | Vorhandenes Dialog-CSS und erweitertes Template | Stabiler Dialog mit lesbarem zweitem Dropdown in Light- und Dark-Mode |
| 6 | code | Vollständige Änderung aus Schritt 1-5 | Validierte Umsetzung ohne Regressionen in Aktions-, freie-Fertigkeits- und Attributwürfen |
