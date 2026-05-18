# 1. Objective

Ein Besitzer eines Helden-Sheets soll im Inventar-Tab auf das Bild eines `gegenstand`-Items klicken können, in einem neuen Dialog mehrere Ziele über die bestehende Ilaris-Target-Selection auswählen, per Button `Gegenstand anwenden` eine modulweite Hook-/Socket-Weitergabe auslösen und dabei den Gegenstand immer um 1 verbrauchen bzw. bei Menge 0 löschen.

# 2. Context & Research Summary

- Das Inventar rendert `gegenstand`-Einträge bereits zentral über das wiederverwendete Accordion-Partial `templates/components/item-accordion.hbs`; die drei Inventarbereiche `Tragend`, `Mitführend` und Container reichen ihre Konfiguration über `extraButtons` und Template-Parameter ein. Das ist der richtige Einstiegspunkt für einen Bildklick ohne Duplikation.
- Die Actor-Sheet-Actions werden in `scripts/sheets/alternative-actor-sheet.js` zentral über `static DEFAULT_OPTIONS.actions` registriert. Dort existiert bereits das Muster für Item-bezogene Aktionen wie `itemQuantityChange`.
- Mengenverbrauch ist lokal bereits zweimal gelöst: generisch im Sheet über `onItemQuantityChange` und gezielt im Fertigkeitendialog über `_consumeSelectedUsedItem`. Beide löschen das Item bei Menge `<= 0` bzw. `=== 1`.
- Effektübertragung existiert im Modul bereits als Utility `addEffectWithStacking(actor, effectData)` in `scripts/utilities.js`; außerdem wird dieses Utility bereits für Effektbibliothek-Transfers und Blutung verwendet. Das ist der naheliegende Zielpfad für eine spätere echte Effektanwendung.
- Das Ilaris-System bringt mit `systems/Ilaris/scripts/combat/dialogs/target-selection.js` bereits einen AppV2-Dialog mit Mehrfachauswahl mit. Der Dialog liefert `{ tokenId, actorId, name, distance }[]` zurück und synchronisiert zusätzlich `game.user.updateTokenTargets(...)`. Er kann direkt konsumiert werden, ohne Systemdateien zu ändern.
- Das Modul hat bisher kein eigenes globales Socket-/Mirror-Hook-Muster. `module.js` ist aber bereits der zentrale Einstiegspunkt für modulweite Hooks und globale Fenster-Exports; dort liegt auch das bestehende Muster für Ilaris-Kampf-Hooks wie `Hooks.on('Ilaris.postAngriff', ...)`.
- Laut Foundry-VTT-API v13 unterstützt `Document` bzw. `Actor` die benötigten Methoden `createEmbeddedDocuments`, `update`, `delete`, `deleteEmbeddedDocuments` und `testUserPermission`. Das deckt Effektanwendung und Mengenänderung auf Dokumentebene ab.
- `.agents/CODEBASE_ARCHITECTURE.md`, `.agents/PATTERNS_AND_EXAMPLES.md` und `.agents/GLOSSARY.md` konnten im Workspace nicht gefunden werden. Die Planung stützt sich deshalb auf die vorhandenen Moduldateien, die Systemdatei des Ilaris-Dialogs und die Foundry-v13-API-Dokumentation.
- Risiko: Der Nutzer wünscht die Effektanwendung vorerst als Platzhalter. Deshalb sollte die erste Iteration Transport, Zielauflösung, Rechtepfad und Verbrauch fertigstellen, aber die eigentliche Zielmutation klar kapseln, damit später echte Active-Effect-Übertragung ohne Umbau ergänzt werden kann.

# 3. Affected Files

| File | Action | Reason |
|------|--------|--------|
| `module.js` | modify | Neuen modulweiten Broadcast-/Mirror-Hook registrieren, Socket-Nachrichten empfangen, neuen Dialog-Templatepfad preloaden und Helper/Exports zentral verdrahten |
| `scripts/sheets/alternative-actor-sheet.js` | modify | Neue Sheet-Action für Bildklick registrieren, Besitzerprüfung durchführen, Item auflösen und den neuen Gegenstands-Anwenden-Dialog öffnen |
| `scripts/utilities.js` | modify | Gemeinsame Hilfsfunktionen für Gegenstandsverbrauch und Zielanwendung kapseln, damit Dialog und globaler Hook denselben Pfad nutzen |
| `scripts/apps/item-apply-dialog.js` | create | Neuer AppV2-Dialog für Zielauswahl, Anzeige ausgewählter Ziele und Auslösen von `Gegenstand anwenden` |
| `templates/apps/item-apply-dialog.hbs` | create | Handlebars-Template für den neuen Gegenstands-Anwenden-Dialog |
| `templates/components/item-accordion.hbs` | modify | Bildbereich optional mit eigener `data-action` und Item-Metadaten ausstatten, ohne bestehende rollbare Muster zu brechen |
| `templates/components/supporting.hbs` | modify | Für `gegenstand`-Items im Bereich `Tragend` den Bildklick auf die neue Action verdrahten |
| `templates/components/carrying.hbs` | modify | Für `gegenstand`-Items im Bereich `Mitführend` den Bildklick auf die neue Action verdrahten |
| `templates/components/handcart.hbs` | modify | Für `gegenstand`-Items in Containern denselben Bildklick auf die neue Action verdrahten |
| `styles/module.css` | modify | Falls nötig minimale Dialog-/Status-Stile für Zielübersicht, deaktivierten Button und Platzhalterhinweis ergänzen |

# 4. Steps

1. **What**: Den neuen UX-Einstieg über das Item-Bild vorbereiten, indem das Accordion-Partial einen optionalen Bild-Action-Pfad unterstützt und die drei Inventar-Partial-Aufrufer diese Action nur für `gegenstand`-Items setzen.
   **Where**: `templates/components/item-accordion.hbs`, `templates/components/supporting.hbs`, `templates/components/carrying.hbs`, `templates/components/handcart.hbs`
   **Who**: code
   **Depends on**: none
   **Reference**: Bestehendes Bild-/Action-Muster in `templates/components/item-accordion.hbs`; bestehende Inventarverdrahtung in `templates/components/supporting.hbs`

2. **What**: Eine neue Sheet-Action `openItemApplyDialog` registrieren, die nur Besitzern offensteht, das geklickte `gegenstand`-Item sicher auflöst und den neuen Dialog mit Actor- und Item-Kontext öffnet.
   **Where**: `scripts/sheets/alternative-actor-sheet.js`
   **Who**: code
   **Depends on**: 1
   **Reference**: Action-Registrierung und Item-Auflösung in `scripts/sheets/alternative-actor-sheet.js`; Besitzerlogik über `this.actor.isOwner`

3. **What**: Einen neuen AppV2-Dialog implementieren, der Item-Infos anzeigt, den Ilaris-`TargetSelectionDialog` konsumiert, Mehrfachziele lokal speichert, ausgewählte Ziele rendert und den Button `Gegenstand anwenden` deaktiviert lässt, solange keine Ziele gewählt sind.
   **Where**: `scripts/apps/item-apply-dialog.js`, `templates/apps/item-apply-dialog.hbs`, optional `styles/module.css`
   **Who**: code
   **Depends on**: 2
   **Reference**: AppV2-Muster in `scripts/apps/fertigkeit-dialog.js`; Zielauswahl-API in `c:/Users/padiq/AppData/Local/FoundryVTT/Data/systems/Ilaris/scripts/combat/dialogs/target-selection.js`

4. **What**: Einen modulweiten Broadcast-/Mirror-Mechanismus definieren, der das Anwenden eines Gegenstands über `game.socket.emit('module.ilaris-alternative-actor-sheet', ...)` oder den vorhandenen Modulkanal spiegelt, lokal ebenfalls `Hooks.callAll(...)` auslöst und so auf allen Clients denselben Hook-Payload verfügbar macht.
   **Where**: `module.js`
   **Who**: code
   **Depends on**: 3
   **Reference**: Bestehende globale Hook-Zentrale in `module.js`; Nutzerreferenz zum Ilaris-Systemmuster `emitGlobalCombatHook(...)`

5. **What**: Den Zielfänger implementieren, der den Broadcast entgegennimmt, die Ziel-Actoren anhand der übergebenen `actorId`/`tokenId` auflöst, nur auf Clients mit passender Ownership weiterarbeitet und die eigentliche Anwendung in eine Utility-Funktion delegiert.
   **Where**: `module.js`, `scripts/utilities.js`
   **Who**: code
   **Depends on**: 4
   **Reference**: Foundry-v13-`Document.testUserPermission(...)` und vorhandene Utility-Kapselung in `scripts/utilities.js`

6. **What**: Die Zielanwendung zunächst als klar markierten Platzhalter kapseln: Item-Effekte auslesen, Payload-Struktur für spätere echte Active-Effect-Übertragung festlegen und vorerst pro Ziel eine sichtbare Platzhalterreaktion erzeugen, ohne die spätere echte `ActiveEffect`-Erstellung zu verbauen. Die Utility soll bereits so geschnitten sein, dass später `addEffectWithStacking(actor, effectData)` direkt genutzt werden kann.
   **Where**: `scripts/utilities.js`
   **Who**: code
   **Depends on**: 5
   **Reference**: `addEffectWithStacking(actor, effectData)` in `scripts/utilities.js`; bestehender Effekttransfer in `scripts/sheets/alternative-actor-sheet.js`

7. **What**: Den Gegenstandsverbrauch nach Klick auf `Gegenstand anwenden` immer um exakt 1 ausführen, unabhängig vom Platzhalter-Ergebnis der Zielanwendung, und das Item bei Restmenge 0 unmittelbar löschen. Diese Logik als gemeinsame Utility kapseln und vom Dialog nach erfolgreichem Broadcast aufrufen.
   **Where**: `scripts/utilities.js`, `scripts/apps/item-apply-dialog.js`
   **Who**: code
   **Depends on**: 4
   **Reference**: `_consumeSelectedUsedItem()` in `scripts/apps/fertigkeit-dialog.js`; `onItemQuantityChange()` in `scripts/sheets/alternative-actor-sheet.js`

8. **What**: Template-Preload, optionale Fenster-Exports und Hook-Initialisierung in `module.js` ergänzen, damit der neue Dialog beim Modulstart verfügbar ist und die Socket-/Hook-Listener einmalig registriert werden.
   **Where**: `module.js`
   **Who**: code
   **Depends on**: 3, 4, 5, 7
   **Reference**: Bestehende Template-Preloads und `window.IlarisAlternativeActorSheet`-Exports in `module.js`

9. **What**: Den End-to-End-Fluss manuell gegen typische Fehlerszenarien absichern: kein Ziel gewählt, Item nicht mehr vorhanden, Itemmenge bereits 0, Ziel ohne lokale Ownership, Actor ohne aktiven Token für die Zielauswahl.
   **Where**: `scripts/apps/item-apply-dialog.js`, `scripts/utilities.js`, `module.js`
   **Who**: code
   **Depends on**: 8
   **Reference**: Warnpfade in `scripts/apps/fertigkeit-dialog.js` und `target-selection.js`

# 5. Validation Plan

- Schritt 1:
  - Befehl: kein eigener Build nötig; nach Implementierung `npm run lint`
  - Manuelle Prüfung: Im Inventar-Tab bleibt Plus/Minus/Edit/Delete unverändert; ein Klick auf das Item-Bild eines `gegenstand` öffnet nicht mehr den Accordion-Header, sondern triggert die neue Action.
  - Erwartung: Nur `gegenstand`-Bilder im Inventar reagieren mit dem neuen Flow.
- Schritt 2:
  - Befehl: `npm run lint`
  - Manuelle Prüfung: Als Besitzer öffnet sich der Dialog; als Nicht-Besitzer erscheint kein anwendbarer Flow bzw. der Klick wird abgefangen.
  - Erwartung: Keine Berechtigungsfehler im Browser-Log.
- Schritt 3:
  - Befehl: `npm run lint`
  - Manuelle Prüfung: Der Dialog zeigt Itemname, Menge und Zielstatus; der Button `Gegenstand anwenden` ist deaktiviert, bis nach `Ziele wählen` mindestens ein Ziel zurückkommt.
  - Erwartung: Mehrfachauswahl aus dem Ilaris-Target-Dialog wird im Modul-Dialog sichtbar übernommen.
- Schritte 4 bis 6:
  - Befehl: `npm run lint`
  - Manuelle Prüfung: Zwei eingeloggte Clients testen denselben Anwendungsfall. Der auslösende Client sendet, alle Clients erhalten den Mirror-Hook, aber nur der berechtigte Client verarbeitet das Ziel weiter.
  - Erwartung: Keine Ownership-Fehler; pro Ziel erscheint die Platzhalteranwendung genau einmal.
- Schritt 7:
  - Befehl: `npm run lint`
  - Manuelle Prüfung: Item mit Menge `2` sinkt nach Anwendung auf `1`; Item mit Menge `1` wird nach Anwendung entfernt; Verbrauch passiert auch dann, wenn die Platzhalteranwendung nur eine Meldung erzeugt.
  - Erwartung: Exakt ein Verbrauch pro Klick auf `Gegenstand anwenden`.
- Schritte 8 bis 9:
  - Befehl: `npm run lint`
  - Manuelle Prüfung: Modul neu laden, Dialog erneut öffnen, keine doppelten Listener, keine mehrfachen Hook-Ausführungen. Fehlerfälle erzeugen nur verständliche Warnungen.
  - Erwartung: Stabiler End-to-End-Flow ohne doppelte Broadcasts.
- Gesamtvalidierung:
  - Befehl: `npm run lint`
  - Manuelle Prüfung 1: Besitzer öffnet im Inventar-Tab einen `gegenstand`, wählt mehrere Ziele und wendet den Gegenstand an.
  - Manuelle Prüfung 2: Ein Ziel-Client ohne Ownership darf nichts mutieren; ein berechtigter Ziel-Client verarbeitet den Hook.
  - Manuelle Prüfung 3: Danach ist die Itemmenge reduziert bzw. das Item gelöscht.
  - Erwartung: UX, Rechtepfad, Broadcast und Verbrauch funktionieren gemeinsam.

# 6. Assumptions & Open Questions

- Annahme: `gegenstand`-Items besitzen bereits `item.effects` bzw. sollen später über dieselbe Datenquelle wie andere Effekttransfers behandelt werden.
- Annahme: Die erste Iteration darf die Zielanwendung als sichtbaren Platzhalter implementieren, solange Broadcast, Zielauflösung und Verbrauch vollständig funktionieren.
- Annahme: Der Modul-Socketkanal kann in `module.js` neu definiert werden, ohne Konflikt mit vorhandenen Modulhooks.
- Annahme: Der Besitzer des Quell-Actors ist auch der Nutzer, der den Verbrauch des Items auslösen darf.
- Annahme: Die bestehende Ilaris-`TargetSelectionDialog`-Klasse darf direkt importiert und konsumiert werden, ohne Systemdateien zu ändern.
- Offene Frage: Soll der Platzhalter pro Ziel nur eine Notification/Chat-Ausgabe erzeugen oder bereits leere, markierte Dummy-Effects auf dem Ziel anlegen? Für minimale Risiken empfiehlt sich zunächst Notification/Log + klarer Integrationspunkt für echte Effects.
- Offene Frage: Ob `styles/module.css` tatsächlich angepasst werden muss, hängt vom finalen Dialog-Markup ab; wenn bestehende Klassen ausreichen, kann dieser Eingriff entfallen.

# 7. Delegation Map

| Step | Specialist | Input | Expected Output |
|------|------------|-------|-----------------|
| 1 | code | Bestehendes Accordion-Partial und Inventar-Teiltemplates | Bildklick-Action für `gegenstand` ohne Regression an bestehenden Controls |
| 2 | code | Actor-Sheet-Action-Registry und Item-Kontext | Neuer Einstiegspunkt zum Öffnen des Gegenstands-Anwenden-Dialogs |
| 3 | code | Ilaris-Target-Dialog, Dialoganforderungen aus diesem Plan | Neuer AppV2-Dialog mit Mehrfachzielanzeige und deaktiviertem Apply-Button |
| 4 | code | Nutzeranforderung zum globalen Hook, bestehendes `module.js` | Broadcast-/Mirror-Hook-Mechanismus für modulweite Gegenstandsanwendung |
| 5 | code | Hook-Payload, Ownership-Regeln, Foundry-Document-API | Zielseitiger Empfänger mit sicherer Actor-Auflösung und Rechteprüfung |
| 6 | code | Utility `addEffectWithStacking`, Platzhaltervorgabe | Kapsel für spätere echte Effektübertragung plus vorläufige Platzhalteranwendung |
| 7 | code | Bestehende Verbrauchslogik aus Fertigkeitendialog und Sheet | Gemeinsame Consume-Utility mit Delete-bei-0-Verhalten |
| 8 | code | Template-/Hook-Initialisierung in `module.js` | Vollständig registrierter End-to-End-Flow nach Reload |
| 9 | code | Fehlerfälle und Validierungsplan | Abgesicherter UX-/Rechtepfad mit verständlichen Warnungen |
