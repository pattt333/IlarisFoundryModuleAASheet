## Context

`IlarisAlternativeFertigkeitDialog` renders a selector from `CONFIG.Dice.rollModes` and passes its value unchanged to the Ilaris helper `postRollToChat`. Foundry V14 represents message visibility through `CONFIG.ChatMessage.modes`; when an unsupported legacy value reaches `ChatMessage.applyMode`, its mode entry has no `handler` and the chat message cannot be created.

The module must remain independent from the Ilaris system implementation. The affected UI has an existing Handlebars template and requires no style change.

## Goals / Non-Goals

**Goals:**

- Render only V14-supported chat visibility modes in the Fertigkeitsdialog.
- Convert persisted legacy core-setting values to their V14 equivalents before calling the existing system helper.
- Guarantee that a malformed or missing mode cannot prevent a completed probe from appearing in chat.
- Keep the package compatibility declaration consistent with `module.json`.

**Non-Goals:**

- Changing Ilaris system sources or its `postRollToChat` implementation.
- Altering roll formulas, critical-result handling, chat-card content, or any other roll dialogs.
- Supporting Foundry versions below V14.

## Decisions

### Use `CONFIG.ChatMessage.modes` as the selector data source

The dialog context will provide `CONFIG.ChatMessage.modes` to the existing `selectOptions` template. This is Foundry V14's documented registry and makes the option values align with the keys that `ChatMessage.applyMode` resolves.

The legacy `CONFIG.Dice.rollModes` source is not retained because it supplies pre-V14 roll-mode vocabulary rather than the V14 message-mode contract.

### Normalize in an importable dialog helper

A small, exported pure helper in `scripts/apps/fertigkeit-dialog-logic.js` will accept the DOM value or core setting, map `publicroll`, `selfroll`, `gmroll`, and `blindroll` to `public`, `self`, `gm`, and `blind`, and otherwise accept a key found in the mode registry supplied by `CONFIG.ChatMessage.modes`. All other values fall back to `public`.

`fertigkeit-dialog.js` imports this helper and normalizes immediately before `postRollToChat`, protecting existing worlds whose core preference has not yet changed. The separate file avoids importing Foundry application and Ilaris system dependencies in Node unit tests. It is preferable to relying on the system helper's legacy compatibility because that helper is outside the module's ownership and the observed V14 error occurs there.

### Preserve template/script separation

`templates/apps/fertigkeit-dialog.hbs` remains responsible only for the selector markup; `scripts/apps/fertigkeit-dialog.js` prepares the mode registry and uses the normalization helper. No CSS is needed.

### Preserve the existing system integration

The module continues to call `postRollToChat(rollResult, speaker, messageMode)`. No hook is added and no external system file is modified. The normalized V14 key is the integration boundary.

## Risks / Trade-offs

- [The Ilaris helper could require a different V14 parameter shape than its current third argument] → Verify the complete Fertigkeitsprobe flow in Foundry V14 for every supported mode; if it still fails, create a separate change owned by the Ilaris system.
- [A third-party package could extend `CONFIG.ChatMessage.modes`] → Accept registry keys dynamically instead of hard-coding the final allowlist; use `public` only as the fallback.
- [Existing worlds retain legacy `core.rollMode` values] → Map the four historical core values before validating against the V14 registry.
- [Package metadata gives tooling contradictory compatibility information] → Synchronize the Foundry block in `package.json` with the V14 manifest declaration.

## Testing Strategy

- Add pure-function cases in `scripts/apps/_spec_/` for each legacy mapping, a current V14 mode, and an empty/unknown value fallback.
- The module's existing specs use Node's `node:test` and `assert`; design the helper so it can be imported without a live Foundry application.
- Manually validate the UI in Foundry V14: open a standard Fertigkeitsprobe, select public/self/gm/blind, roll once per option, and confirm the expected chat visibility. Repeat after setting an old core roll preference to establish the migration path.

## Migration Plan

1. Release the module update with V14 metadata and the mode normalization.
2. Existing worlds require no data migration: their legacy client preference is converted at roll time.
3. If a regression occurs, revert the module update; no document or world data was transformed.

## Open Questions

Keine; the observed stack trace and documented V14 ChatMessage API define the needed module-side compatibility boundary.
