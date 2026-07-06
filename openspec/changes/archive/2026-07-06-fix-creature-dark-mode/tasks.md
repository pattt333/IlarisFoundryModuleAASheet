## 1. Revert Tab Template

- [x] 1.1 Revert `PARTS.tabs.template` back to `templates/generic/tab-navigation.hbs` — DONE

## 2. Fix Dark Mode Text Colors

- [x] 2.1 Replace `var(--text-dark)` → `var(--color-text-primary)` in `.section-header h3` — DONE
- [x] 2.2 Replace in `.statblockreihe b` — DONE
- [x] 2.3 Replace in `.weapon-name a` — DONE
- [x] 2.4 Replace in `.weapon-eigenschaften` — DONE
- [x] 2.5 Replace in `.spell-entry a.item-edit` etc. — DONE (also caught bonus 6th occurrence)

## 3. Cleanup

- [x] 3.1 Remove `templates/sheets/npc/creature-tab-navigation.hbs` — DONE
- [x] 3.2 Remove template from preload list in `module.js` — DONE

All `--text-dark` removed from creature-sheet.css — verified zero remaining.
