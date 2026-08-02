## ADDED Requirements

### Requirement: Waffenbau-Dialog erzeugt Fernkampfoption als benannte verknüpfte Kopie
Wenn der Waffenbau-Dialog eine Nahkampfwaffe mit der Eigenschaft `Fernkampfoption` erstellt, SHALL er den als ersten Eigenschaftsparameter festgelegten Fernkampfnamen für eine zusätzliche verknüpfte `fernkampfwaffe` auf demselben Helden verwenden. Die Kopie SHALL die gemeinsamen Bauwerte und Eigenschaften übernehmen, `Fernkampfoption` jedoch entfernen. Beide Items SHALL über die bestehenden Flags `linkedMeleeId` und `linkedRangedId` bidirektional verknüpft sein.

#### Scenario: Nahkampfwaffe mit benannter Fernkampfoption erstellen
- **WHEN** ein Besitzer eine valide Nahkampfwaffe mit `Fernkampfoption` und dem Parameter „Axtpistole“ im Waffenbau-Dialog erstellt
- **THEN** werden eine Nahkampfwaffe und eine verknüpfte Fernkampfwaffe mit dem Namen „Axtpistole“ angelegt, und nur die Nahkampfwaffe enthält `Fernkampfoption`

#### Scenario: Fernkampfwaffenblatt öffnen
- **WHEN** die Fernkampfkopie erfolgreich erzeugt wurde
- **THEN** öffnet der Dialog das reguläre Item-Blatt der Fernkampfwaffe

#### Scenario: Builder-Erstellung löst keine Legacy-Kompendiumsuche aus
- **WHEN** der Waffenbau-Dialog die Nahkampfwaffe mit Fernkampfoption erstellt
- **THEN** überspringt der bestehende `createItem`-Hook die Kompendium-basierte automatische Fernkampfwaffenerstellung
