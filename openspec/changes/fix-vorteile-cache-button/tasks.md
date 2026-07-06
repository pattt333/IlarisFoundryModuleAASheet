## 1. Create FormApplication Class

- [x] 1.1 Create `scripts/apps/vorteile-cache-refresh.js` — DONE, `VorteileCacheRefresh` extends `FormApplication`, auto-closes

## 2. Register via registerMenu

- [x] 2.1 Add `game.settings.registerMenu()` in `Hooks.once('init')` — DONE, label "Vorteile-Cache aktualisieren", icon `fa-sync`, restricted true
- [x] 2.2 Import `VorteileCacheRefresh` in `module.js` — DONE

## 3. Remove Old Hook

- [x] 3.1 Remove `Hooks.on('renderSettingsConfig', ...)` block — DONE
- [x] 3.2 Remove `.ai-vorteile-cache-btn` CSS class — DONE
