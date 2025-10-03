# Technical Implementation Notes

## Inheritance Strategy

Based on research of the Ilaris system repository and popular Foundry modules, we implemented a clean inheritance pattern:

### Original Complex Approach (Removed)
- Multiple fallback import paths
- Dynamic imports with complex error handling
- Attempts to import classes directly from system files

### Current Proper Import Approach
Based on repository analysis of the Ilaris system, the module now uses direct imports from the correct system paths:

```javascript
// Import system classes directly from the Ilaris system paths
// Based on repository analysis: https://github.com/Ilaris-Tools/IlarisFoundryVTT

// IlarisActorSheet from /scripts/sheets/actor.js
const actorModule = await import('/systems/Ilaris/scripts/sheets/actor.js');
IlarisActorSheet = actorModule.IlarisActorSheet;

// IlarisItem from /scripts/items/item.js
const itemModule = await import('/systems/Ilaris/scripts/items/item.js');
IlarisItem = itemModule.IlarisItem;

// IlarisItemSheet from /scripts/sheets/items/item.js
const itemSheetModule = await import('/systems/Ilaris/scripts/sheets/items/item.js');
IlarisItemSheet = itemSheetModule.IlarisItemSheet;
```

### Why This Is The Correct Approach

1. **Direct System Imports**: Uses the actual file paths from the Ilaris system repository
2. **Proper Class Access**: Gets the real system classes with all methods and functionality
3. **Repository-Based**: Paths verified through GitHub repository analysis of Ilaris-Tools/IlarisFoundryVTT
4. **Fallback Safety**: Still includes fallbacks to registered sheets and base classes
5. **Follows System Patterns**: Matches how the Ilaris system itself handles imports

## Key Features Implemented

### Tidy 5e-Inspired Layout
- Vertical stacking of components
- Actor portrait prominently displayed
- Einschränkungen (wounds/exhaustion) below portrait
- Energy bars with slider-style progress indication

### Interactive Elements
- **Hexagon Attributes**: Rotated 90° with overlapping design
  - Large hex: Click to roll
  - Small hex: Click to edit value
  - Hover effects and cursor changes
- **Einschränkungen Boxes**: Click to cycle through wound/exhaustion states
- **Energy Bars**: Visual progress indicators with percentage calculations

### Custom Handlebars Helpers
- `percentage`: Calculate percentage for progress bars
- `add`: Simple addition for template calculations
- `gte`: Greater-than-or-equal comparison
- `range`: Generate arrays for iteration
- `multiply`/`divide`: Mathematical operations

### CSS Features
- Hexagon shapes using `clip-path: polygon()`
- Smooth transitions and hover effects
- CSS Grid layouts for responsive design
- Custom scrollbars and styling

## File Structure
```
/scripts/sheets/alternative-actor-sheet.js  - Main sheet class
/templates/sheets/alternative-actor-sheet.hbs - Main template
/templates/sheets/tabs/ - Tab-specific templates
/templates/sheets/energy-resources.hbs - Energy bar component  
/templates/sheets/health-resources.hbs - Einschränkungen component
/styles/module.css - All styling including hexagons
```

## Integration Status
✅ UI Layout Complete
✅ Interactive Elements Working  
✅ Attribute Rolling Integrated
✅ Einschränkungen Management  
✅ Energy Bar Visualization
✅ Proper System Inheritance
✅ Error-Free Operation