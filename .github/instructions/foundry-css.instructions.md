---
applyTo: 'styles/**/*.css'
---

# CSS Variable Scoping Convention — Ilaris Alternative Actor Sheet

All module UI components share a single color schema defined in `styles/module.css`. Component CSS files do NOT define their own `--color-*` variables — they inherit them from the consolidated selector.

## Where Variables Are Defined

`styles/module.css` contains a combined selector covering all module UI components:

```css
.ilaris.sheet.actor.alternative,
.iaas-item-apply-window,
.target-selection-dialog,
.initiative-dialog,
.mass-initiative-dialog {
  --color-surface-header: #3c4658;
  /* ... all 50+ variables ... */
}

body.theme-dark .ilaris.sheet.actor.alternative,
body.theme-dark .iaas-item-apply-window,
body.theme-dark .target-selection-dialog,
body.theme-dark .initiative-dialog,
body.theme-dark .mass-initiative-dialog {
  --color-surface-header: #141d1b;
  /* ... dark variants ... */
}
```

This is the **single source of truth** for the module's color schema.

## Adding a New Component

1. Add the component's root CSS class to the combined selector in `module.css` (both light and dark mode blocks)
2. Write the component's CSS file using only `var(--color-*)` references — no `--color-*` definitions needed

```css
/* my-new-dialog.css — correct */
.my-new-dialog {
    background: var(--color-surface-base);
    color: var(--color-text-primary);
}
```

## What NOT to Do

- **Do NOT** define `--color-*` variables in component CSS files — they come from `module.css`
- **Do NOT** use `var(--header-bg-color)`, `var(--color-light-1)`, `var(--primary-color)`, `var(--text-dark)` — these are Ilaris system variables, not in scope
- **Do NOT** hardcode hex colors or rgba values — always use `var(--color-*)` or `var(--overlay-*)`

## Variable Names

- `--color-surface-header`, `--color-surface-base`, `--color-surface-panel`
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-soft`, `--color-text-inverse`
- `--color-accent-primary`, `--color-accent-primary-hover`, `--color-accent-primary-glow`
- `--color-border-default`, `--color-border-dark`
- `--color-danger`, `--color-danger-light`, `--color-danger-lighter`
- `--color-success`, `--color-success-strong`, `--color-success-glow`
- `--overlay-white-05`, `--overlay-white-10`, `--overlay-black-10`, `--overlay-black-20`

## Light / Dark Values

| Variable | Light | Dark |
|---|---|---|
| `--color-surface-header` | `#3c4658` | `#141d1b` |
| `--color-surface-base` | `#f8f8f8` | `#070a09` |
| `--color-text-primary` | `#2d3748` | `#eff1ef` |
| `--color-accent-primary` | `#4299e1` | `#007a75` |
| `--color-accent-primary-hover` | `#3182ce` | `#00908a` |
| `--color-border-default` | `#ccc` | `#3f4946` |
| `--color-border-dark` | `#444` | `#57605d` |
| `--color-danger` | `#e53e3e` | `#ffb4ab` |

Full set: see the combined selector in `styles/module.css`.
