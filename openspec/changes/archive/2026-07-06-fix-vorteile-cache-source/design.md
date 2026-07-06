## Context

`refreshVorteileCache()` reads `game.packs.get('Ilaris.vorteile')` — the raw compendium. The Ilaris system has a configurable vorteile list in its settings that reflects which vorteile are actually in use. Reading from the system setting is more accurate and avoids including unused vorteile.

## Decisions

### Decision 1: Read from system setting instead of compendium

Replace the compendium pack read with a read from the Ilaris system's configured vorteile list setting.

**Rationale**: The system setting is user-editable and reflects the actual game state. The compendium may contain vorteile not used in the current campaign.
