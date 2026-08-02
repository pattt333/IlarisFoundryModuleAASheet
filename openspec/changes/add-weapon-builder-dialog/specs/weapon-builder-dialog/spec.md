## ADDED Requirements

### Requirement: Waffenbau-Dialog öffnet sich aus beiden Waffen-Buttons eines Helden
Der alternative Heldenbogen SHALL beim Auslösen von `itemCreate` für `nahkampfwaffe` oder `fernkampfwaffe` einen Waffenbau-Dialog öffnen. Andere Itemklassen SHALL weiterhin durch die Ilaris-Standardaktion erstellt werden.

#### Scenario: Nahkampfwaffe hinzufügen
- **WHEN** ein Besitzer eines Helden im Kampf-Tab „Waffe hinzufügen“ bei Nahkampfwaffen auswählt
- **THEN** öffnet sich ein Waffenbau-Dialog im Modus Nahkampfwaffe

#### Scenario: Fernkampfwaffe hinzufügen
- **WHEN** ein Besitzer eines Helden im Kampf-Tab „Waffe hinzufügen“ bei Fernkampfwaffen auswählt
- **THEN** öffnet sich ein Waffenbau-Dialog im Modus Fernkampfwaffe

#### Scenario: Andere Itemklasse
- **WHEN** ein Nutzer `itemCreate` für eine andere Itemklasse wie `aktion` auslöst
- **THEN** wird die bestehende Ilaris-Erstellaktion unverändert verwendet

### Requirement: Dialog erfasst passende Grundwerte
Der Waffenbau-Dialog SHALL Name, getrennte W3- und W6-Anzahlen, einen TP-Modifikator, Fertigkeit, Talent und Reichweite erfassen. Für Nahkampfwaffen SHALL er AT- und VT-WM erfassen; für Fernkampfwaffen SHALL er FK-WM und Ladezeit erfassen. Material, Preis und Härte SHALL nicht Teil des Dialogs sein.

#### Scenario: Nahkampfgrundwerte speichern
- **WHEN** eine valide Nahkampfwaffe erstellt wird
- **THEN** enthält das erzeugte Item die erfassten gemeinsamen Felder sowie `system.wm_at` und `system.wm_vt`

#### Scenario: Fernkampfgrundwerte speichern
- **WHEN** eine valide Fernkampfwaffe erstellt wird
- **THEN** enthält das erzeugte Item die erfassten gemeinsamen Felder sowie `system.wm_fk` und `system.lz`

### Requirement: Grundwertverbesserungen zählen zum K10-Budget
Der Dialog SHALL die W3-Anzahl mit K2, die W6-Anzahl mit K4, den vorzeichenbehafteten TP-Modifikator sowie die vorzeichenbehafteten AT- und VT-WM jeweils mit ihrem Zahlenwert in die K-Summe aufnehmen.

#### Scenario: W6 und AT erhöhen die K-Summe
- **WHEN** ein Nutzer einen W6 und AT-WM +2 einträgt
- **THEN** erhöht sich die sichtbare K-Summe um K6

#### Scenario: TP-Modifikator finanzieren
- **WHEN** ein Nutzer einen TP-Modifikator von -2 einträgt
- **THEN** verringert sich die sichtbare K-Summe um K2

#### Scenario: Negative AT- und VT-WM finanzieren
- **WHEN** ein Nutzer AT-WM -2 und VT-WM -1 einträgt
- **THEN** verringert sich die sichtbare K-Summe um K3

### Requirement: Fertigkeiten und Talente werden aus konfigurierten Kompendien vorgeschlagen
Der Waffenbau-Dialog SHALL die Namen der Items vom Typ `fertigkeit` aus `Ilaris.fertigkeitenPacks` und die Namen der Items vom Typ `talent` aus `Ilaris.talentePacks` als auswählbare Vorschläge für die jeweiligen Grundwertfelder laden. Die Felder SHALL weiterhin freie Texteingaben erlauben.

#### Scenario: Fertigkeit aus konfiguriertem Kompendium wählen
- **WHEN** ein konfiguriertes Fertigkeiten-Kompendium die Fertigkeit „Einhandklingenwaffen“ enthält
- **THEN** bietet der Dialog „Einhandklingenwaffen“ im Fertigkeitsfeld zur Auswahl an

#### Scenario: Talent aus konfiguriertem Kompendium wählen
- **WHEN** ein konfiguriertes Talente-Kompendium ein Talent enthält
- **THEN** bietet der Dialog dessen Namen im Talentfeld zur Auswahl an

#### Scenario: Freier Grundwert
- **WHEN** ein Nutzer einen Namen eingibt, der in keinem konfigurierten Kompendium enthalten ist
- **THEN** akzeptiert der Dialog den eingegebenen Fertigkeits- oder Talentnamen unverändert

### Requirement: Waffeneigenschaften stammen aus den konfigurierten Ilaris-Kompendien
Der Dialog SHALL verfügbare `waffeneigenschaft`-Items ausschließlich aus den von `Ilaris.waffeneigenschaftenPacks` ausgewählten Item-Kompendien laden und deren Parameterslots sowie einen gegebenenfalls hinterlegten festen Wert übernehmen.

#### Scenario: Parameterisierte Eigenschaft auswählen
- **WHEN** ein konfiguriertes Kompendium eine Eigenschaft mit Parameterslots enthält und diese im Dialog gewählt wird
- **THEN** zeigt der Dialog die zugehörigen Parameterfelder und speichert deren Werte als `{ key, parameters }`

#### Scenario: Eigenschaft mit festem Wert auswählen
- **WHEN** ein konfiguriertes Kompendium eine Eigenschaft mit dem festen Wert „Leicht“ enthält
- **THEN** zeigt der Dialog den Wert an und speichert ihn zusammen mit dem Eigenschaftsschlüssel und ihren Parametern

#### Scenario: Fernkampfoption benennen
- **WHEN** ein Nutzer die Eigenschaft `Fernkampfoption` auswählt
- **THEN** verlangt der Dialog einen Namen für die zu erzeugende Fernkampfwaffe und speichert ihn als ersten Parameter der Eigenschaft

#### Scenario: Nicht konfiguriertes Kompendium
- **WHEN** ein Item-Kompendium nicht in `Ilaris.waffeneigenschaftenPacks` enthalten ist
- **THEN** erscheint keine seiner Waffeneigenschaften im Dialog

### Requirement: K10-Budget wird vor der Erstellung validiert
Der Dialog SHALL die K-Werte aller gewählten Eigenschaften summieren und das Erstellen ausschließlich bei einer Summe von exakt K10 erlauben. Bekannte Katalogeigenschaften SHALL ihren festen Wert verwenden. Für nicht katalogisierte Eigenschaften SHALL der Dialog ein K-Zahlenfeld mit Vorgabewert 1 und Schrittweite 0,5 anzeigen.

#### Scenario: Exakt K10
- **WHEN** die ausgewählten Eigenschaften zusammen K10 ergeben und alle anderen Validierungen erfüllt sind
- **THEN** ist die Erstellen-Aktion verfügbar

#### Scenario: Abweichende Summe
- **WHEN** die K-Summe kleiner oder größer als 10 ist
- **THEN** ist die Erstellen-Aktion deaktiviert und der aktuelle Summenwert sichtbar

#### Scenario: Unbekannte Eigenschaft bewerten
- **WHEN** eine Eigenschaft aus einem konfigurierten Kompendium nicht im festen Katalog steht
- **THEN** kann der Nutzer ihren K-Wert über ein numerisches Feld in 0,5er-Schritten festlegen und der Wert wird in die K-Summe eingerechnet

#### Scenario: Variablen Eigenschaftswert erhöhen
- **WHEN** eine Eigenschaft mit numerischem Parameterslot den Wert 2 erhält
- **THEN** zählt ihr K-Wert doppelt zur K-Summe

### Requirement: Auswahlregeln verhindern ungültige Eigenschaftskombinationen
Der Dialog SHALL nur die als stapelbar definierten Katalogeigenschaften mehrfach zulassen. Er SHALL mehrere Reichweitenkategorien, Leicht zusammen mit Schwer, Unzerstörbar zusammen mit Zerbrechlich sowie Unsicher zusammen mit Unberechenbar verhindern.

#### Scenario: Konflikt zwischen Leicht und Schwer
- **WHEN** Leicht bereits ausgewählt ist und der Nutzer Schwer auswählen möchte
- **THEN** wird Schwer nicht hinzugefügt und der Dialog zeigt einen verständlichen Validierungshinweis

#### Scenario: Mehrfach wählbare Eigenschaft
- **WHEN** der Nutzer eine als mehrfach wählbar definierte Eigenschaft wie `+1 TP` erneut hinzufügt
- **THEN** enthält die Waffenliste mehrere Einträge dieser Eigenschaft und jeder Eintrag zählt zum K-Budget

#### Scenario: Nicht katalogisierte Eigenschaft doppelt wählen
- **WHEN** der Nutzer eine nicht katalogisierte Eigenschaft erneut hinzufügen möchte
- **THEN** verhindert der Dialog die doppelte Auswahl

### Requirement: Eigenschaftsauswahl bleibt beim Rendern erhalten
Der Dialog SHALL die im Eigenschafts-Dropdown gewählte Eigenschaft bei jeder Neu-Renderung beibehalten und die Hinzufügen-Aktion SHALL genau diese Eigenschaft übernehmen.

#### Scenario: Andere Eigenschaft wählen
- **WHEN** ein Nutzer im Dropdown eine andere konfigurierte Eigenschaft auswählt
- **THEN** bleibt diese Auswahl sichtbar und wird durch „Eigenschaft hinzufügen“ zur Waffenliste hinzugefügt

### Requirement: Dialog erzeugt ein Ilaris-Waffenitem
Der Dialog SHALL eine valide Waffe mittels `Actor#createEmbeddedDocuments('Item', ...)` als `nahkampfwaffe` oder `fernkampfwaffe` mit strukturierten `system.eigenschaften` erstellen und sich danach schließen.

#### Scenario: Gültige Nahkampfwaffe erstellen
- **WHEN** ein Besitzer bei K10 eine valide Nahkampfwaffe erstellt
- **THEN** wird genau ein neues `nahkampfwaffe`-Item auf dem Helden angelegt und enthält die Dialogdaten

#### Scenario: Erstellen ohne Besitzrecht
- **WHEN** ein Nutzer ohne Besitzerrecht versucht, den Dialog abzuschließen
- **THEN** wird kein Item angelegt und der Nutzer erhält eine Warnung
