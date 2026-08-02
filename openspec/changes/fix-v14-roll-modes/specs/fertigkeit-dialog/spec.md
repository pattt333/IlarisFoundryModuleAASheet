## MODIFIED Requirements

### Requirement: Roll result posted to chat

After a successful roll, the result SHALL be posted to chat via the Ilaris system's `postRollToChat` function using the actor's speaker data and a Foundry V14-supported message visibility mode.

#### Scenario: Successful roll

- **WHEN** a W20 roll is completed
- **THEN** the result including critical status is posted to chat via the actor's speaker

#### Scenario: Selecting a V14 message visibility mode

- **WHEN** the user selects `public`, `self`, `gm`, or `blind` in the Würfelmodus selector and completes a roll
- **THEN** the dialog passes that mode to the chat posting integration and the chat message is created with that visibility

#### Scenario: Legacy core roll preference

- **WHEN** no selector value is available and the stored core roll preference is `publicroll`, `selfroll`, `gmroll`, or `blindroll`
- **THEN** the dialog maps it respectively to `public`, `self`, `gm`, or `blind` before posting the result

#### Scenario: Unknown roll preference

- **WHEN** the selected value and fallback core roll preference do not identify a supported V14 message visibility mode
- **THEN** the dialog posts the result using the `public` message visibility mode
