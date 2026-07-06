## 1. Fix CSS Class Activation

- [x] 1.1 Add `'kreaturen'` to `DEFAULT_OPTIONS.classes` — DONE, `['alternative', 'kreaturen']`

## 2. Custom Tab Template

- [x] 2.1 Create `templates/sheets/npc/creature-tab-navigation.hbs` — DONE, Ilaris-styled with icon + label
- [x] 2.2 Update `PARTS.tabs.template` to custom path — DONE in alternative-creature-sheet.js

## 3. Tab CSS in creature-sheet.css

- [x] 3.1 Add `.sheet-tabs` base styles — DONE, flex layout with border-bottom
- [x] 3.2 Add `.sheet-tabs .item` styles — DONE, hover + active states with `var(--primary-color)` border
- [x] 3.3 Dark mode via CSS custom properties — DONE, all colors use `var(--color-*)`

## 4. Verify and Clean Up

- [x] 4.1 Verify creature-sheet.css rules now apply — CONFIRMED, `.kreaturen` class added
- [x] 4.2 Template preloaded in module.js — CONFIRMED, added to init preload list
- [x] 4.3 Character sheet tabs unaffected — CONFIRMED, only `.kreaturen` namespaced
