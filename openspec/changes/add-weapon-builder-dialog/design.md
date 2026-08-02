## Context

Der Kampf-Tab des alternativen Heldenbogens delegiert `itemCreate` gegenwärtig an `HeldenSheet`. Dadurch erzeugt ein Klick auf einen Waffen-Button unmittelbar ein leeres Ilaris-Item und öffnet dessen Systemblatt. Ilaris verwaltet Waffeneigenschaften als strukturierte Einträge `{ key, parameters }`; die auswählbaren `waffeneigenschaft`-Items werden über die Welt-Setting `Ilaris.waffeneigenschaftenPacks` aus konfigurierten Item-Kompendien geladen.

Das Modul besitzt bereits einen `createItem`-Hook für `Fernkampfoption`. Er lädt momentan eine Fernkampfwaffe mit gleichem Namen aus einem festen Modul-Kompendium. Der neue Builder erstellt stattdessen die benötigte Kopie selbst und muss diesen Legacy-Pfad für seine eigene Erstellung unterdrücken.

## Goals / Non-Goals

**Goals:**

- Ein AppV2-Dialog erstellt valide GQ0-Grundwaffen direkt aus beiden Waffen-Buttons eines Helden.
- Der Dialog bildet die K10-Punktabrechnung, bekannte Katalogwerte, frei bewertbare unbekannte Eigenschaften, Parameterslots, Stapelregeln und Ausschlüsse ab.
- Die erzeugten Items verwenden ausschließlich dokumentierte Ilaris-Itemdaten und vorhandene Ilaris-Waffeneigenschaften.
- Eine Fernkampfoption erzeugt eine bidirektional verknüpfte Fernkampfkopie und öffnet ihr Systemblatt.

**Non-Goals:**

- Keine Änderungen an Ilaris-Systemdateien, Kompendien oder deren Regeln.
- Keine Speicherung oder Regelwirkung für Material, Preis oder Härte im Builder.
- Keine neue Ausführung von Regelwirkungen: Der Dialog speichert die vom konfigurierten Kompendium bereitgestellten Eigenschaften; deren vorhandene Ilaris-Verarbeitung bleibt maßgeblich.
- Keine automatische Fernkampfkopie für außerhalb des Builders erstellte Nahkampfwaffen; der bisherige Kompendium-basierte Ablauf bleibt dafür erhalten.

## Decisions

### Eigenständige AppV2 mit Template, Stylesheet und reiner Regelhilfe

`IlarisWeaponBuilderDialog` wird als `HandlebarsApplicationMixin(ApplicationV2)` unter `scripts/apps/` angelegt. Das Markup liegt in `templates/apps/weapon-builder-dialog.hbs`; ein dediziertes `styles/weapon-builder-dialog.css` wird in `module.json` registriert. Die Aufbereitung von Eigenschaften, K-Werten, Konflikten, Daten für die zwei Waffentypen und Fernkampfkopien liegt in einer exportierbaren reinen Hilfsdatei.

Dies folgt der vorhandenen AppV2-Struktur und hält Regeln ohne DOM-Abhängigkeit testbar. Ein in `alternative-actor-sheet.js` implementierter Action-Handler fängt nur `nahkampfwaffe` und `fernkampfwaffe` ab; alle anderen Itemklassen delegiert er an `super.onItemCreate`.

Alternative: `DialogV2` mit dynamischem HTML. Verworfen, weil Parameterslots, Validierungszustand und Eigenschaftsliste wiederholt neu gerendert werden müssen und ein Handlebars-Template die notwendige Schichtung bietet.

### Kompendiumsauswahl entspricht der Ilaris-Setting

Die Dialogvorbereitung liest `game.settings.get('Ilaris', 'waffeneigenschaftenPacks')`, löst die Pack-IDs über `game.packs` auf und lädt nur `waffeneigenschaft`-Dokumente. Gleichnamige Eigenschaften werden deterministisch zusammengeführt; die erste Eigenschaft in der konfigurierten Pack-Reihenfolge stellt Parameterslots, Beschreibung und einen optionalen festen Eigenschaftswert bereit. Dieser Wert wird als Teil des strukturierten Waffeneigenschaftseintrags übernommen.

Alternative: Verwendung der statischen `CONFIG.ILARIS.waffeneigenschaften`. Verworfen, weil diese nicht die von der Welt aktivierten Kompendien und deren Parameterslots repräsentiert.

### Fertigkeits- und Talentvorschläge folgen den Ilaris-Kompendien

Der Builder liest zusätzlich `Ilaris.fertigkeitenPacks` und `Ilaris.talentePacks`. Er lädt daraus die Namen von Items der Typen `fertigkeit` beziehungsweise `talent`, führt gleichnamige Einträge nach Pack-Reihenfolge zusammen und stellt sie über HTML-`datalist`-Vorschläge für die weiterhin frei editierbaren Felder bereit.

Alternative: Zwei starre Select-Felder. Verworfen, weil frei definierte Waffen weiterhin eine Fertigkeit oder ein Talent verwenden können sollen, die nicht in den aktivierten Kompendien liegen.

### Katalog mit expliziter Fallback-Eingabe

Eine Modulkonstante ordnet den vereinbarten Katalognamen K-Werte, Wiederholbarkeit und Konfliktgruppen zu. Bekannte Werte sind unveränderlich. Für jede unbekannte Eigenschaft zeigt der Dialog ein Zahlenfeld mit `value=1` und `step=0.5`; der eingegebene Wert ist Teil der K-Summe. Die Erstellen-Aktion bleibt deaktiviert, bis die Summe exakt 10 beträgt und alle erforderlichen Parameter gesetzt sind.

Hat eine Eigenschaft mindestens einen numerischen Parameterslot, skaliert dessen erster eingetragener Wert den K-Wert der Eigenschaft. Ein leerer Wert lässt den Grundwert unverändert; der Wert `2` verdoppelt ihn, `0` hebt ihn auf. Das Vorzeichen des Grundwerts bleibt erhalten, sodass etwa ein variabler Nachteil weiterhin K finanziert.

Unbekannte Eigenschaften gelten mangels Katalog-Markierung als nicht wiederholbar. Das verhindert versehentliches Stapeln und lässt eine spätere Katalogerweiterung gezielt zu.

### Grundwerte tragen direkt zum K10-Budget bei

Der Dialog ersetzt das freie TP-Feld durch drei Zahlenfelder: Anzahl W3, Anzahl W6 und TP-Modifikator. Die erste Zahl kostet je W3 K2, die zweite je W6 K4 und der TP-Modifikator trägt seinen vorzeichenbehafteten Wert direkt bei. Beim Speichern wird daraus eine Ilaris-TP-Formel gebildet. AT- und VT-WM tragen jeweils ihren vorzeichenbehafteten Zahlenwert direkt zum K-Budget bei.

Die Regelhilfe erhält einen separaten Grundwert-Kostenwert, den sie mit den gewählten Eigenschaften summiert. Dadurch sind alle K-Quellen im selben Validierungspfad sichtbar und testbar.

### Dropdown-Auswahl bleibt über Renderzyklen erhalten

Der derzeitige Form-Change-Handler rendert den Dialog sofort neu. Der ausgewählte Eigenschaftsname wird deshalb als Dialogzustand gespeichert und im Template als ausgewählte Option ausgegeben. Die Hinzufügen-Aktion liest den Zustand statt eines möglicherweise bereits ersetzten DOM-Elements.

### Fernkampfoption wird synchron im Builder erzeugt

Beim Hinzufügen von `Fernkampfoption` erfasst der Dialog einen verpflichtenden Namen für die erzeugte Fernkampfwaffe und speichert ihn als ersten Parameter der strukturierten Eigenschaft. Beim Speichern der builder-erstellten Nahkampfwaffe erzeugt der Dialog mit `Actor#createEmbeddedDocuments('Item', ...)` eine Fernkampfkopie unter diesem Namen. Sie übernimmt gemeinsame Grunddaten und Eigenschaften, entfernt jedoch `Fernkampfoption`, setzt fernkampfspezifische Defaults und erhält die gegenseitigen Modulflags `linkedMeleeId` und `linkedRangedId`. Danach ruft der Dialog `createdRanged.sheet.render(true)` auf.

Beide Builder-Erstellungen tragen eine Optionsmarkierung, die der existierende `createItem`-Hook erkennt und überspringt. Das verhindert, dass der Legacy-Mechanismus zusätzlich eine Kompendiumwaffe erzeugt. Die bestehende Löschverkettung bleibt unverändert nutzbar.

Alternative: Den existierenden Hook auf das neue Verfahren umstellen. Verworfen, weil außerhalb des Builders erzeugte Nahkampfwaffen weiter die dokumentierte Kompendium-basierte Fernkampfoption verwenden sollen.

## Risks / Trade-offs

- [Ein konfiguriertes Pack ist nicht verfügbar oder leer] → Der Dialog zeigt eine klare Warnung und erlaubt keine Eigenschaften aus diesem Pack; Grundwerte können weiterhin erfasst werden, wenn mindestens keine Eigenschaft benötigt wird.
- [Pack-Eigenschaften haben gleiche Namen, aber abweichende Parameterslots] → Die Pack-Reihenfolge bestimmt deterministisch den verwendeten Eintrag; die Dialogliste kann Herkunft und Beschreibung ausweisen.
- [Eigenschaftsnamen weichen vom Regelkatalog ab] → Nicht exakt zuordenbare Namen erhalten das explizite K-Eingabefeld statt einer falschen festen Bewertung.
- [Fernkampfkopie enthält nicht passende Nahkampfwerte] → Die reine Ableitung setzt nur im Fernkampfmodell gültige Felder (`wm_fk`, `lz`) und entfernt Nahkampf-WM-Felder.
- [Kampfregeln einer externen Eigenschaft verlangen Systemcode] → Der Builder speichert nur die Eigenschaft; deren Verhalten bleibt beim vorhandenen Ilaris-System bzw. dem Kompendiumsitem.

## Migration Plan

Keine Datenmigration. Bestehende Waffen und die bestehende automatische Fernkampfoption bleiben unverändert. Ein Rückbau entfernt nur die neuen UI-Einstiegspunkte; bereits erzeugte Waffen bleiben normale Ilaris-Items mit den vorhandenen Verknüpfungsflags.

## Testing Strategy

- Reine Hilfsfunktionen prüfen K-Wert-Auflösung, `0.5`-Summierung ohne Gleitkommafehler, Ausschlüsse, Duplikate, Pflichtparameter, die Fernkampfkopie sowie das Filtern und Zusammenführen der Fertigkeits- und Talenteinträge.
- Das Modul besitzt kein `npm test`-Skript. Die reine Hilfslogik nutzt deshalb den Node.js-Bordrunner und wird gezielt mit `node --test scripts/apps/_spec_/weapon-builder-logic.spec.js` ausgeführt.
- Manuelle Foundry-VTT-14-Prüfung deckt beide Buttons, dynamische Parameterslots, K10-Blockierung, freie K-Werte, Konflikte, Erzeugen, Fernkampfoption, geöffnetes Itemblatt und Kaskadenlöschung ab.
