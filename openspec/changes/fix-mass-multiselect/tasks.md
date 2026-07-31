## 1. Fix multi-select event handler

- [x] 1.1 In `scripts/apps/mass-initiative-dialog.js`, fix `_onActionsChange`: (a) use `event.currentTarget.getAttribute('name')` for the name attribute instead of `event.target`, (b) add `if (!event.isTrusted) return;` guard to ignore programmatic change events fired during re-render that would wipe state

## 2. Verify

- [ ] 2.1 Manually test: open mass initiative dialog with multiple NPCs, select actions via multi-select, verify chips appear and can be removed
- [ ] 2.2 Verify no regressions: dice rolling, batch apply, INI ansagen, filter toggle all still work
