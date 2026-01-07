# Alternative Creature Sheet Specification

**Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Planning Phase

---

## Overview

An alternative actor sheet specifically designed for creature-type actors in the Ilaris system for Foundry VTT v12. This sheet provides a streamlined, combat-focused interface optimized for GM use with NPCs and monsters.

### Design Philosophy

- **Combat-First**: Most important information (attacks, effects, spells) in the default "Kampf" tab
- **Statblock-Style**: Dense, text-focused presentation for quick reference during play
- **Component Reuse**: Leverages existing health-resources, energy-resources, and effect-card components
- **Visual Consistency**: Maintains the same hexagon attributes and styling as the alternative character sheet
- **Flat Structure**: No accordions - all information immediately visible for fast access

---

## Architecture

### Inheritance Hierarchy

```
ActorSheet (Foundry)
  └─ IlarisActorSheet (Ilaris System)
      ├─ IlarisAlternativeActorSheet (this module - for "held" actors)
      └─ IlarisAlternativeCreatureSheet (this module - for "kreatur" actors) [NEW]
```

### File Structure

```
scripts/sheets/
  ├── alternative-actor-sheet.js          [MODIFIED - inherit from IlarisActorSheet]
  └── alternative-creature-sheet.js       [NEW]

templates/sheets/
  ├── alternative-creature-sheet.hbs      [NEW]
  └── tabs/
      ├── creature-kampf-tab.hbs          [NEW]
      └── creature-allgemein-tab.hbs      [NEW]

styles/
  └── creature-sheet.css                  [NEW]

.specs/
  └── creature-sheet-spec.md              [NEW - this file]
```

---

## UI Layout

### Sticky Header (Always Visible)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐  ┌────────────────────────────────────────────────────┐  │
│ │          │  │  Name: [Editable Input]                            │  │
│ │ Portrait │  │                                                      │  │
│ │ 120x120  │  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │  │
│ │          │  │  │MU │ │KL │ │IN │ │CH │ │FF │ │GE │ │KO │ │KK │ │  │
│ └──────────┘  │  │ 12│ │ 14│ │ 13│ │ 10│ │ 11│ │ 15│ │ 14│ │ 16│ │  │
│               │  │ 3 │ │ 4 │ │ 3 │ │ 2 │ │ 3 │ │ 4 │ │ 4 │ │ 5 │ │  │
│ ┌──────────┐  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │  │
│ │LeP: ████░│  │                                                      │  │
│ │ 35/45    │  │  [WS Shield Icon]                                   │  │
│ │   [⚙][x] │  │                                                      │  │
│ └──────────┘  └────────────────────────────────────────────────────┘  │
│               ┌────────────────────────────────────────────────────┐  │
│ ┌──────────┐  │ MR: 8 | GS: 10 | INI: 13 | Mod: +0 | HP-Max: [45] │  │
│ │Eng: ████░│  │ Typ: [Humanoid] | Gesundheit: [Leicht verwundet]  │  │
│ │ 18/25    │  └────────────────────────────────────────────────────┘  │
│ │      [⚙]│  ┌──[ Kampf ]──┬──[ Allgemein ]─────────────────────┐  │
│ └──────────┘  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tab Structure

#### Tab 1: Kampf (Default/Initial)

**Content Sections:**
1. **Effekte Grid** - Active effects using effect-card component (80x100px cards)
2. **Angriffe/Waffen** - Flat list with inline stats, larger dice buttons
3. **Zauber/Liturgien/Anrufungen** - If creature is caster

#### Tab 2: Allgemein

**Content Sections:**
1. **Kurzbeschreibung** - Text area for creature description
2. **Eigenschaften** - Comma-separated list with item-edit links
3. **Vorteile** - All categories (allgemein, profan, kampf, etc.)
4. **Fertigkeiten** - Simple list with PW values and dice rolls
5. **Kampfwerte** - Input fields for FK, GW, AW, etc.
6. **Item-Hinzufügen** - Dropdown + button at bottom

---

## Component Mapping

### Reused Components (No Modification)

| Component | Template Path | Usage |
|-----------|--------------|-------|
| Health Resources | `templates/components/health-resources.hbs` | Shows LeP bar with condition display |
| Energy Resources | `templates/components/energy-resources.hbs` | Shows "Eng" bar for casters |
| Effect Card | `templates/components/effect-card.hbs` | Displays active effects in grid |

### Component Modifications

#### Health Resources Enhancement
- **Add**: Wundenignorieren toggle button
- **Placement**: `<a class="icon-small toggle-bool" data-togglevariable="system.gesundheit.wundenignorieren">`
- **Position**: Next to settings cog icon
- **Text**: "ignorieren" / "aktivieren" conditional

#### Energy Resources Usage
- **Condition**: Only show if `actor.system.abgeleitete.zauberer` OR `actor.system.abgeleitete.geweihter`
- **Label**: Always display as "Eng" (not AsP/KaP)
- **GuP**: Not used for creatures (omit completely)

---

## Data Structure

### Actor System Schema

```javascript
actor.system = {
  // Basic Info
  kurzbeschreibung: String,        // Brief description
  kreaturentyp: String,            // e.g., "humanoid", "bestie", "dämon"
  
  // Health
  gesundheit: {
    hp: { value: Number, max: Number },
    wunden: Number,
    erschoepfung: Number,
    display: String,               // e.g., "Leicht verwundet"
    wundenignorieren: Boolean      // Toggle for ignoring wound penalties
  },
  
  // Attributes (identical to character)
  attribute: {
    MU: { wert: Number, pw: Number },
    KL: { wert: Number, pw: Number },
    // ... all 8 attributes
  },
  
  // Combat Stats
  kampfwerte: {
    fk: Number,  // Fernkampf
    gw: Number,  // Geistwert
    aw: Number,  // Ausweichen
    mr: Number,  // Magieresistenz
    // etc.
  },
  
  // Derived Values
  abgeleitete: {
    ws_stern: Number,     // Current armor
    ws_kopf/torso/arme/beine: Number,
    be: Number,           // Encumbrance
    mr: Number,
    gs: Number,
    ini: Number,
    zauberer: Boolean,    // Has magical abilities
    geweihter: Boolean,   // Has blessed abilities
    asp_stern/asp: Number,
    kap_stern/kap: Number,
    gasp/gkap: Number,
    globalermod: Number,
    globalermoddisplay: String,
    nahkampfmod: Number,
    nahkampfmoddisplay: String
  },
  
  // Modifiers
  modifikatoren: {
    manuellermod: Number
  },
  
  // Energies
  energien: {
    asp: { value: Number, max: Number },
    kap: { value: Number, max: Number },
    gup: { value: Number, max: Number }  // Not used for creatures
  },
  
  // Item dropdown selection
  additemtype: String  // Selected item type for creation
}

// Computed Arrays (from getData())
actor.eigenschaften = []          // Property items
actor.vorteil = {                 // Advantages by category
  allgemein: [],
  profan: [],
  kampf: [],
  kampfstil: [],
  magie: [],
  zaubertraditionen: [],
  karma: [],
  geweihtentradition: [],
  tiergeist: []
}
actor.freietalente = []           // Profane skills
actor.uebernatuerlich = {
  fertigkeiten: [],               // Supernatural skills
  zauber: [],                     // Spells
  liturgien: [],                  // Liturgies
  anrufungen: []                  // Invocations
}
actor.angriffe = []               // Weapon attacks
actor.appliedEffects = []         // Active effects
actor.kreaturItemOptions = {}     // Dropdown options from CONFIG.ILARIS
```

---

## Detailed Component Specifications

### 1. Sticky Header

#### Portrait Section (Left)
- **Image**: 120x120px, clickable to edit
- **Health Bar**: LeP progress bar with current/max display
  - Settings cog for wound editing
  - Wundenignorieren toggle: `<a class="icon-small toggle-bool" data-togglevariable="system.gesundheit.wundenignorieren">`
  - Condition display below (e.g., "Leicht verwundet")
- **Energy Bar**: Only if zauberer/geweihter
  - Always labeled "Eng"
  - Settings cog for energy editing

#### Center Section
- **Name Input**: `<input name="name" value="{{actor.name}}">`
- **Hexagon Attributes**: 8 hexagons (MU, KL, IN, CH, FF, GE, KO, KK)
  - `.hex-main` (large): Rollable, shows PW value
  - `.hex-small` (bottom): Editable, shows Wert value
  - Identical styling to character sheet
- **WS/BE Shield**: Armor value display with tooltip for body parts

#### Right Section (Secondary Stats)
- **Row 1**: MR | GS | INI | Manueller Mod (editable via `.editable-stat`)
- **Row 2**: 
  - Kreaturentyp: `<div class="profile-stat editable-stat" data-stat-field="system.kreaturentyp">` displays `{{capitalize actor.system.kreaturentyp}}`
- **Gesundheitsmod Display**: `{{actor.system.abgeleitete.globalermoddisplay}}` with color coding

#### Tab Navigation
- **Tabs**: [ Kampf ] [ Allgemein ]
- **Sticky**: Remains visible when scrolling
- **Initial**: Opens to "Kampf" tab by default

---

### 2. Kampf Tab

#### Section A: Effekte Grid

```handlebars
<div class="effects-grid">
  {{#each actor.appliedEffects as |effect|}}
    {{> modules/ilaris-alternative-actor-sheet/templates/components/effect-card.hbs effect=effect}}
  {{/each}}
</div>
```

- **Layout**: CSS Grid, auto-fit columns
- **Card Size**: 80x100px (same as character sheet)
- **Features**: Stack controls, edit/delete, duration display
- **Empty State**: "Keine aktiven Effekte"

#### Section B: Angriffe/Waffen

```handlebars
<div class="angriffe statblockreihe">
  <b>Angriffe: </b>
  {{#each actor.angriffe as |angriff|}}
    <div class="flexrow weapon-row">
      {{#if (waffe_ist_fernkampf angriff)}}
        <a class="rollable icon-large" data-rolltype="fernkampf_diag" data-itemid="{{angriff.id}}">
          <i class="fas fa-dice-d20"></i>
        </a>
      {{else}}
        <a class="rollable icon-large" data-rolltype="angriff_diag" data-itemid="{{angriff.id}}">
          <i class="fas fa-dice-d20"></i>
        </a>
      {{/if}}
      <label><b><a class="item-edit" data-itemid="{{angriff.id}}">{{angriff.name}}</a></b></label>
      {{#if (waffe_ist_fernkampf angriff)}}
        <label>LZ: {{angriff.system.lz}}</label>
      {{/if}}
      <label>RW: {{angriff.system.rw}}</label>
      <label>AT: {{angriff.system.at}}</label>
      <label>VT: {{angriff.system.vt}}</label>
      <label>TP: 
        <a class="rollable icon-small" data-rolltype="basic" data-formula="{{translate_formula angriff.system.tp}}" data-label="Schaden ({{angriff.name}})">
          {{angriff.system.tp}}
        </a>
      </label>
    </div>
    <div class="weapon-eigenschaften">
      {{#each angriff.system.eigenschaften as |eig|}}
        <span>{{eig.name}}, </span>
      {{/each}}
    </div>
  {{/each}}
</div>
```

**Styling Notes:**
- **`.icon-large`**: Larger dice buttons (1.5em font-size)
- **Flat List**: No accordion, all weapons visible
- **Inline Stats**: AT/VT/TP/RW in same row

#### Section C: Zauber/Liturgien/Anrufungen

Only show if `{{#if (isCaster actor)}}`:

```handlebars
<div class="uebernatuerlich statblockreihe">
  <b>Übernatürliche Fertigkeiten: </b>
  {{#each actor.uebernatuerlich.fertigkeiten as |fertigkeit|}}
    <a class="item-edit" data-itemid="{{fertigkeit.id}}">{{fertigkeit.name}}</a> ({{fertigkeit.system.pw}}
    <a class="rollable icon-small" data-rolltype="fertigkeit_diag" data-probetype="simple" data-fertigkeit="{{fertigkeit.name}}" data-pw="{{fertigkeit.system.pw}}">
      <i class="fas fa-dice-d20"></i>
    </a>), 
  {{/each}}
</div>

<div class="zauber statblockreihe">
  <b>Zauber: </b>
  {{#each actor.uebernatuerlich.zauber as |zauber|}}
    <a class="item-edit" data-itemid="{{zauber.id}}">{{zauber.name}}</a> ({{zauber.system.pw}}
    <a class="rollable icon-small" data-rolltype="magie_diag" data-itemid="{{zauber.id}}">
      <i class="fas fa-dice-d20"></i>
    </a>), 
  {{/each}}
</div>

<div class="liturgien statblockreihe">
  <b>Liturgien: </b>
  {{#each actor.uebernatuerlich.liturgien as |liturgie|}}
    <a class="item-edit" data-itemid="{{liturgie.id}}">{{liturgie.name}}</a> ({{liturgie.system.pw}}
    <a class="rollable icon-small" data-rolltype="karma_diag" data-itemid="{{liturgie.id}}">
      <i class="fas fa-dice-d20"></i>
    </a>), 
  {{/each}}
</div>

<div class="anrufungen statblockreihe">
  <b>Anrufungen: </b>
  {{#each actor.uebernatuerlich.anrufungen as |anrufung|}}
    <a class="item-edit" data-itemid="{{anrufung.id}}">{{anrufung.name}}</a> ({{anrufung.system.pw}}
    <a class="rollable icon-small" data-rolltype="magie_diag" data-itemid="{{anrufung.id}}">
      <i class="fas fa-dice-d20"></i>
    </a>), 
  {{/each}}
</div>
```

---

### 3. Allgemein Tab

#### Section A: Kurzbeschreibung

```handlebars
<div class="kurzbeschreibung-section">
  <label>Beschreibung:</label>
  <textarea name="system.kurzbeschreibung" rows="3">{{actor.system.kurzbeschreibung}}</textarea>
</div>
```

#### Section B: Eigenschaften

```handlebars
{{#if actor.eigenschaften}}
<div class="eigenschaften statblockreihe">
  <b>Eigenschaften: </b>
  {{#each actor.eigenschaften as |eigenschaft|}}
    <a class="item-edit" data-itemid="{{eigenschaft.id}}">{{eigenschaft.name}}</a>, 
  {{/each}}
</div>
{{/if}}
```

#### Section C: Vorteile (All Categories)

```handlebars
<div class="vorteile statblockreihe">
  <b>Vorteile: </b>
  {{#each actor.vorteil.allgemein as |vorteil|}}
    <a class="item-edit" data-itemid="{{vorteil.id}}">{{vorteil.name}}</a>, 
  {{/each}}
  {{#each actor.vorteil.profan as |vorteil|}}
    <a class="item-edit" data-itemid="{{vorteil.id}}">{{vorteil.name}}</a>, 
  {{/each}}
  {{#each actor.vorteil.kampf as |vorteil|}}
    <a class="item-edit" data-itemid="{{vorteil.id}}">{{vorteil.name}}</a>, 
  {{/each}}
  {{!-- Continue for all categories --}}
</div>
```

#### Section D: Fertigkeiten

```handlebars
{{#if actor.freietalente}}
<div class="fertigkeiten statblockreihe">
  <b>Fertigkeiten: </b>
  {{#each actor.freietalente as |fertigkeit|}}
    <a class="item-edit" data-itemid="{{fertigkeit.id}}">{{fertigkeit.name}}</a> ({{fertigkeit.system.pw}}
    <a class="rollable icon-small" data-rolltype="fertigkeit_diag" data-probetype="simple" data-fertigkeit="{{fertigkeit.name}}" data-pw="{{fertigkeit.system.pw}}">
      <i class="fas fa-dice-d20"></i>
    </a>), 
  {{/each}}
</div>
{{/if}}
```

#### Section E: Kampfwerte

```handlebars
{{#if actor.system.kampfwerte}}
<div class="kampfwerte statblockreihe">
  <div class="flexrow">
    {{#each actor.system.kampfwerte as |wert key|}}
      <div class="kampfwert-input">
        <label>{{get_stat_short key}}</label>
        <input name="system.kampfwerte.{{key}}" type="text" value="{{wert}}" data-dtype="Number">
      </div>
    {{/each}}
  </div>
</div>
{{/if}}
```

**Note**: Kampfwerte are **not rollable** in creature sheet (unlike character sheet where MR is rollable)

#### Section F: Item-Hinzufügen Controls

```handlebars
<div class="item-controls">
  <div class="form-group">
    <select name="system.additemtype">
      {{selectOptions kreaturItemOptions selected=actor.system.additemtype}}
    </select>
    <button class="item-create" data-itemclass="{{actor.system.additemtype}}" type="button">
      Hinzufügen
    </button>
  </div>
</div>
```

---

## CSS Specifications

### Namespace

All styles prefixed with: `.ilaris.sheet.actor.alternative.kreatur`

### Key Style Classes

#### Larger Dice Buttons (Weapons Only)

```css
.ilaris.sheet.actor.alternative.kreatur .rollable.icon-large {
  font-size: 1.5em;
  padding: 0.5em;
  min-width: 2em;
  min-height: 2em;
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease;
}

.ilaris.sheet.actor.alternative.kreatur .rollable.icon-large:hover {
  transform: scale(1.15);
  color: var(--primary-color);
}
```

#### Statblock Rows

```css
.ilaris.sheet.actor.alternative.kreatur .statblockreihe {
  padding: 0.5em;
  margin-bottom: 0.5em;
  background: #f8f8f8;
  border-left: 3px solid var(--primary-color);
  line-height: 1.6;
}

.ilaris.sheet.actor.alternative.kreatur .statblockreihe b {
  color: var(--text-dark);
  font-weight: 600;
}
```

#### Weapon Rows

```css
.ilaris.sheet.actor.alternative.kreatur .weapon-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-bottom: 0.25em;
}

.ilaris.sheet.actor.alternative.kreatur .weapon-eigenschaften {
  font-size: 0.9em;
  color: #666;
  margin-left: 2.5em;
  margin-bottom: 0.5em;
}
```

#### Kampfwerte Inputs

```css
.ilaris.sheet.actor.alternative.kreatur .kampfwert-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.ilaris.sheet.actor.alternative.kreatur .kampfwert-input label {
  font-weight: 600;
  font-size: 0.9em;
  margin-bottom: 0.25em;
}

.ilaris.sheet.actor.alternative.kreatur .kampfwert-input input {
  width: 3em;
  text-align: center;
}
```

#### Effects Grid

```css
.ilaris.sheet.actor.alternative.kreatur .effects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5em;
  margin-bottom: 1em;
}
```

### Reused Styles from module.css

- **Hexagons**: All `.hex-main`, `.hex-small` styles
- **Sticky Header**: `.sticky-header` positioning
- **Energy/Health Bars**: Progress bar animations and colors
- **WS/BE Shield**: Icon and badge styles
- **Secondary Stats**: `.profile-stat` layouts
- **Effect Cards**: All effect-card.css styles

### Color Scheme

Identical to character sheet:
- Primary: `#4299e1`
- Health: `#e53e3e` to `#fc8181` gradient
- Energy (AsP/KaP): Blue gradient matching primary
- Background: `#f8f8f8`, `#f7fafc`
- Borders: `#e2e8f0`, `#cbd5e0`

---

## JavaScript Implementation

### Class: IlarisAlternativeCreatureSheet

**File**: `scripts/sheets/alternative-creature-sheet.js`

```javascript
import { IlarisActorSheet } from "../../../../systems/Ilaris/scripts/sheets/actor.js";
import { AccordionManager } from "../components/accordion-manager.js";

export class IlarisAlternativeCreatureSheet extends IlarisActorSheet {
  
  constructor(...args) {
    super(...args);
    // AccordionManager optional - creatures use flat lists
    // this.accordionManager = new AccordionManager(this.actor.id);
  }
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ilaris", "sheet", "actor", "alternative", "kreatur"],
      template: "modules/ilaris-alternative-actor-sheet/templates/sheets/alternative-creature-sheet.hbs",
      width: 820,
      height: 900,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "kampf"
      }],
      resizable: true,
      scrollY: [".sheet-body"]
    });
  }
  
  /** @override */
  async getData() {
    const context = await super.getData();
    
    // Add creature-specific data
    context.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options);
    
    return context;
  }
  
  /** @override */
  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    
    // Remove labels for cleaner header
    buttons.forEach(btn => btn.label = '');
    
    // Add Copy UUID button
    buttons.unshift({
      label: "",
      class: "copy-uuid",
      icon: "fa-solid fa-passport",
      onclick: () => this._onCopyUUID()
    });
    
    return buttons;
  }
  
  /**
   * Copy actor UUID to clipboard
   */
  async _onCopyUUID() {
    await navigator.clipboard.writeText(this.actor.uuid);
    ui.notifications.info(`UUID copied to clipboard: ${this.actor.uuid}`);
  }
  
  // All other event handlers inherited from IlarisActorSheet:
  // - _onRollable (for dice rolls)
  // - _onItemEdit (for opening item sheets)
  // - _onItemCreate (for creating new items)
  // - _onItemDelete (for deleting items)
  // - _onToggleBool (for wundenignorieren toggle)
  // - _onEditStat (for editable stats like HP-Max, Kreaturentyp)
  // - _onDrop (for Effect Library drag-drop support)
  // - Energy/Health settings dialogs
}
```

---

## Handlebars Helpers

### Required Helpers

Most helpers already exist in the module or Ilaris system. Only one new helper needed:

#### capitalize Helper

**Registration in module.js:**

```javascript
Handlebars.registerHelper('capitalize', function(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});
```

**Usage**: `{{capitalize actor.system.kreaturentyp}}`

### Existing Helpers (from module or system)

- `percentage` - Calculate percentage for progress bars
- `modColor` - Color coding for modifiers
- `ifEq` - Equality comparison
- `waffe_ist_fernkampf` - Check if weapon is ranged
- `isCaster` - Check if creature has magical abilities
- `get_stat_short` - Get abbreviated stat name
- `selectOptions` - Generate select options
- `translate_formula` - Translate damage formula

---

## Module Registration

### module.js Changes

```javascript
// Import creature sheet class
import { IlarisAlternativeCreatureSheet } from './scripts/sheets/alternative-creature-sheet.js';

// Load CSS
const creatureStyleLink = document.createElement('link');
creatureStyleLink.rel = 'stylesheet';
creatureStyleLink.type = 'text/css';
creatureStyleLink.href = 'modules/ilaris-alternative-actor-sheet/styles/creature-sheet.css';
document.head.appendChild(creatureStyleLink);

// Register capitalize helper
Handlebars.registerHelper('capitalize', function(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

// Register character sheet (held only)
Actors.registerSheet("Ilaris", IlarisAlternativeActorSheet, {
  types: ["held"],
  makeDefault: false,
  label: "Alternative Actor Sheet"
});

// Register creature sheet (kreatur only)
Actors.registerSheet("Ilaris", IlarisAlternativeCreatureSheet, {
  types: ["kreatur"],
  makeDefault: false,
  label: "Alternative Creature Sheet"
});
```

---

## User Stories

### US-1: GM Views Creature in Combat
**As a** GM  
**I want** to quickly see a creature's attacks, effects, and HP in one view  
**So that** I can run combat efficiently without scrolling

**Acceptance Criteria:**
- Creature sheet opens to "Kampf" tab by default
- All attacks visible without expanding accordions
- Active effects displayed in grid at top
- Dice buttons are prominent and easy to click
- HP bar visible in sticky header

### US-2: GM Edits Creature Stats
**As a** GM  
**I want** to easily edit creature HP, attributes, and combat values  
**So that** I can adjust creature difficulty on-the-fly

**Acceptance Criteria:**
- HP-Max editable via secondary stats (click to open dialog)
- Attributes editable via small hexagon (click to open dialog)
- Kampfwerte have direct input fields in Allgemein tab
- Manual modifier editable in header

### US-3: GM Uses Creature Spells
**As a** GM  
**I want** to see and roll creature spells/liturgies  
**So that** I can use magical creature abilities

**Acceptance Criteria:**
- Spells shown in Kampf tab if creature is caster
- Each spell has PW display and dice button
- Spell rolls work identically to character sheet
- Energy bar shows "Eng" for magical creatures

### US-4: GM Manages Creature Effects
**As a** GM  
**I want** to add/remove effects from creature  
**So that** I can track conditions and buffs during play

**Acceptance Criteria:**
- Effects displayed as cards in grid layout
- Can drag-drop from Effect Library compendium
- Stack controls work for stackable effects
- Edit/delete buttons functional

### US-5: GM Adds Items to Creature
**As a** GM  
**I want** to add weapons, advantages, or properties to creature  
**So that** I can customize creature abilities

**Acceptance Criteria:**
- Item dropdown in Allgemein tab shows creature-appropriate options
- "Hinzufügen" button creates new item of selected type
- New items appear in appropriate sections
- Item edit links open item sheets

---

## Testing Checklist

### Visual Testing
- [ ] Sticky header remains visible when scrolling
- [ ] Hexagons display correctly with PW and Wert values
- [ ] Health/Energy bars show correct percentage fills
- [ ] Effect cards render at 80x100px
- [ ] Larger dice buttons on weapons are prominent
- [ ] WS/BE shield displays with tooltip
- [ ] Tabs switch correctly between Kampf and Allgemein
- [ ] Responsive layout works at different window sizes

### Functional Testing
- [ ] Attribute hexagons rollable (large hex)
- [ ] Attribute hexagons editable (small hex)
- [ ] Weapon attack rolls work (nahkampf and fernkampf)
- [ ] Damage rolls work with formula translation
- [ ] Spell/Liturgy rolls work for casters
- [ ] Fertigkeiten rolls work
- [ ] HP editing dialog opens and saves
- [ ] Energy editing dialog opens and saves (if caster)
- [ ] Wundenignorieren toggle works
- [ ] Manual modifier editing works
- [ ] HP-Max editing works
- [ ] Kreaturentyp editing works and capitalizes
- [ ] Item creation from dropdown works
- [ ] Item edit links open item sheets
- [ ] Item deletion works
- [ ] Effect drag-drop from Effect Library works
- [ ] Effect stack controls work
- [ ] Effect edit/delete works
- [ ] Copy UUID button works

### Data Integrity Testing
- [ ] getData() provides kreaturItemOptions correctly
- [ ] All actor.system fields save properly
- [ ] Computed arrays (angriffe, vorteil, etc.) populate
- [ ] Energy bars only show for zauberer/geweihter
- [ ] Capitalize helper works for kreaturentyp
- [ ] Sheet state persists (active tab remembered)

### Cross-Module Testing
- [ ] Works alongside standard Ilaris creature sheet
- [ ] Works alongside alternative character sheet
- [ ] Effect Library integration functional
- [ ] Dice rolls appear in chat correctly
- [ ] Damage application works from chat
- [ ] Token bar links work correctly

---

## Known Limitations

1. **No Inventory Management**: Creatures don't have carrying capacity tracking or item inventory sections (intentional simplification)
2. **No Favorites Sidebar**: Unlike character sheet, no sidebar for quick-access weapons (creatures have fewer items)
3. **No Biography Rich Text**: Kurzbeschreibung is simple textarea, not rich editor (creatures need less narrative space)
4. **Flat Lists Only**: No accordions for weapon details (trade-off for speed vs. detail)
5. **GuP Energy Not Supported**: GuP (Götterpunkte) omitted as it's rare for creatures

---

## Future Enhancements (Out of Scope for v1.0)

- Quick-add common effects (e.g., "Niederliegend", "Betäubt") via button menu
- Token art integration (drag token to sheet updates portrait)
- Creature template system (apply stat block templates)
- Compact mode toggle (hide all sections except attacks and HP)
- Print-friendly statblock export
- Creature size affects layout (larger creatures = larger sheet)
- Quick-roll all attacks button (for multi-attack creatures)

---

## Implementation Priority

### Phase 1: Core Structure (Must Have)
1. Create specification document ✅ (this file)
2. Refactor IlarisAlternativeActorSheet to inherit from IlarisActorSheet
3. Create IlarisAlternativeCreatureSheet class
4. Create main template with sticky header
5. Implement tab structure

### Phase 2: Component Integration (Must Have)
6. Integrate health-resources component with wundenignorieren toggle
7. Integrate energy-resources component
8. Integrate effect-card component
9. Create Kampf tab template
10. Create Allgemein tab template

### Phase 3: Styling (Must Have)
11. Create creature-sheet.css with namespace
12. Style larger dice buttons
13. Style statblock rows
14. Ensure visual consistency with character sheet

### Phase 4: Module Integration (Must Have)
15. Register capitalize helper in module.js
16. Update sheet registrations (split held/kreatur)
17. Load creature-sheet.css
18. Test in Foundry VTT

### Phase 5: Testing & Refinement (Must Have)
19. Functional testing (all user stories)
20. Visual testing (all layouts)
21. Bug fixes and polish
22. Documentation updates

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-06 | Initial specification created |

---

## References

- Foundry VTT v12 API: https://foundryvtt.com/api/v12/
- Ilaris System Documentation: (internal system files)
- Alternative Character Sheet: `scripts/sheets/alternative-actor-sheet.js`
- Effect Card Component: `templates/components/effect-card.hbs`
- Module CSS: `styles/module.css`
