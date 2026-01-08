# Feature: Automatic Fernkampfwaffe Addition via Fernkampfoption Property

## Scenario: Adding a weapon with Fernkampfoption property

**Given** the actor sheet is open  
**And** the weapon compendium "ilaris-alternative-actor-sheet.nenneke_regeln-waffen" is available  
**And** the compendium contains a weapon "Axtpistole" of type "nahkampfwaffe"  
**And** the weapon "Axtpistole" has property "Fernkampfoption" with parameters `["Axtpistole (Kurzfeuerwaffen)"]`  
**And** the compendium contains "Axtpistole (Kurzfeuerwaffen)" of type "fernkampfwaffe"  
**And** the actor does not have "Axtpistole (Kurzfeuerwaffen)" yet

**When** the user drags "Axtpistole" from the compendium to the actor sheet

**Then** the "Axtpistole" nahkampfwaffe should be added to the actor  
**And** the "Axtpistole (Kurzfeuerwaffen)" fernkampfwaffe should be automatically added to the actor  
**And** the user should see a notification "Axtpistole (Kurzfeuerwaffen) automatisch hinzugefügt"

---

## Scenario: Duplicate prevention

**Given** the actor sheet is open  
**And** the actor already has "Axtpistole (Kurzfeuerwaffen)" fernkampfwaffe on the character sheet  
**And** the compendium contains "Axtpistole" nahkampfwaffe with Fernkampfoption property referencing "Axtpistole (Kurzfeuerwaffen)"

**When** the user drags "Axtpistole" from the compendium to the actor sheet

**Then** the "Axtpistole" nahkampfwaffe should be added to the actor  
**And** no duplicate "Axtpistole (Kurzfeuerwaffen)" should be added  
**And** no notification should be shown for the fernkampfwaffe  
**And** no error should occur

---

## Scenario: Missing Fernkampfwaffe in compendium

**Given** the actor sheet is open  
**And** the compendium contains "TestWaffe" nahkampfwaffe  
**And** "TestWaffe" has property "Fernkampfoption" with parameters `["NonexistentWeapon"]`  
**And** "NonexistentWeapon" does NOT exist in the compendium

**When** the user drags "TestWaffe" from the compendium to the actor sheet

**Then** the "TestWaffe" nahkampfwaffe should be added to the actor  
**And** no fernkampfwaffe should be added  
**And** the user should see a warning notification "Waffe nicht gefunden: NonexistentWeapon"

---

## Scenario: Missing compendium pack

**Given** the actor sheet is open  
**And** the compendium "ilaris-alternative-actor-sheet.nenneke_regeln-waffen" is NOT available  
**And** a weapon "Axtpistole" has property "Fernkampfoption" with parameters `["Axtpistole (Kurzfeuerwaffen)"]`

**When** the user drags "Axtpistole" to the actor sheet

**Then** the "Axtpistole" nahkampfwaffe should be added to the actor  
**And** no fernkampfwaffe should be added  
**And** the user should see a warning notification "Waffe nicht gefunden: Axtpistole (Kurzfeuerwaffen)"  
**And** an error should be logged to the console

---

## Scenario: Adding non-nahkampfwaffe items (regression test)

**Given** the actor sheet is open  
**And** the compendium contains an item "Lederrüstung" of type "ruestung"

**When** the user drags "Lederrüstung" from the compendium to the actor sheet

**Then** the "Lederrüstung" should be added to the actor normally  
**And** no additional items should be added automatically  
**And** the Fernkampfoption logic should not be triggered

---

## Scenario: Circular dependency prevention

**Given** the actor sheet is open  
**And** "Axtpistole" nahkampfwaffe has Fernkampfoption property referencing "Axtpistole (Kurzfeuerwaffen)"  
**And** "Axtpistole (Kurzfeuerwaffen)" is being added automatically with flag `fernkampfOptionAutoAdded: true`

**When** the createItem hook is triggered for "Axtpistole (Kurzfeuerwaffen)"

**Then** the hook should detect the `fernkampfOptionAutoAdded` flag  
**And** should return early without processing  
**And** no additional weapons should be searched or added  
**And** normal item creation should proceed

---

## Implementation Notes

### Data Structure
- Weapon properties are stored in `item.system.eigenschaften` as array of objects
- Each property has structure: `{key: "PropertyName", parameters: [...]}`
- Fernkampfoption parameter contains the exact name of the fernkampfwaffe

### Compendium Structure
- Pack ID: `"ilaris-alternative-actor-sheet.nenneke_regeln-waffen"`
- Contains both nahkampfwaffe and fernkampfwaffe types
- Search uses exact name match from parameters[0]

### Technical Constraints
- Hook must be non-async to allow fire-and-forget pattern
- Async operations extracted to separate helper function
- Guard clauses must return early for non-applicable items
- Duplicate check uses actor.items.find() with name and type match
