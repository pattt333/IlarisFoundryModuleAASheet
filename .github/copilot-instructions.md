# Copilot Instructions for IlarisFoundryModuleAASheet

## Project Overview

This repository contains an alternative actor sheet module for the **Ilaris** tabletop RPG system in **Foundry Virtual Tabletop (VTT)**. The module provides custom character sheets and actor management functionality specifically designed for the Ilaris game system.

## About Foundry VTT

Foundry Virtual Tabletop is a self-hosted, one-time purchase software for tabletop RPG gaming. This module is built for **Foundry VTT v12**.

### Key Foundry VTT Concepts:
- **Modules**: Add-on packages that extend Foundry's functionality
- **Actor Sheets**: UI components that display and manage character/NPC data
- **Systems**: Game-specific rulesets (Ilaris in this case)
- **Applications**: Foundry's window/dialog framework
- **Hooks**: Event system for module integration

## API Documentation

- **Primary Reference**: [Foundry VTT v12 API Documentation](https://foundryvtt.com/api/v12/index.html)
- **Actor Sheets**: Focus on `ActorSheet` class and related APIs
- **Application Framework**: `Application` and `FormApplication` classes

## Ilaris System Context

Ilaris is a German tabletop RPG system. When working on this module:
- Understand that this provides an **alternative** actor sheet to the default Ilaris system sheet
- Character data structure should be compatible with the existing Ilaris system
- UI/UX should follow Ilaris game conventions and terminology

## Development Guidelines

### Module Structure
```
module.json          # Module manifest (defines module metadata)
module.js           # Main module entry point
styles/             # CSS/SCSS stylesheets
templates/          # Handlebars templates for actor sheets
scripts/            # JavaScript modules
lang/              # Localization files
```

### Foundry VTT Module Best Practices

1. **Module Manifest (module.json)**:
   - Always include proper version, compatibility, and dependency information
   - Use semantic versioning
   - Include proper esmodules or scripts declarations

2. **Actor Sheet Development**:
   - Extend `ActorSheet` class, not generic `Application`
   - Use `actor.system` for game-specific data
   - Implement proper form submission handling
   - Use Foundry's templating system with Handlebars

3. **Event Handling**:
   - Use Foundry's event delegation patterns
   - Handle form submissions through `_updateObject()` method
   - Implement proper drag-and-drop functionality

4. **Data Management**:
   - Never modify `actor.data` directly, use `actor.update()`
   - Use `prepareData()` for computed values
   - Handle async operations properly

5. **UI/UX**:
   - Follow Foundry's CSS class conventions
   - Use Foundry's icon fonts and styling
   - Ensure responsive design for different screen sizes
   - Implement proper accessibility features

### Code Conventions

- Use ES6+ modules and modern JavaScript
- Follow Foundry's naming conventions (camelCase for methods, kebab-case for CSS)
- Use JSDoc comments for public methods
- Implement proper error handling and logging
- Use Foundry's localization system for all user-facing text

### Common Foundry VTT Patterns

```javascript
// Registering an actor sheet
Actors.registerSheet("ilaris", MyActorSheet, {
  types: ["character"],
  makeDefault: true
});

// Basic actor sheet structure
export default class MyActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ilaris", "sheet", "actor"],
      template: "modules/my-module/templates/actor-sheet.hbs",
      width: 600,
      height: 680,
      tabs: [...]
    });
  }

  getData() {
    const context = super.getData();
    // Add custom data processing
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    // Add custom event listeners
  }
}
```

### Testing and Development

- Test in Foundry VTT v12 environment
- Verify compatibility with the base Ilaris system
- Test with different actor types if applicable
- Ensure proper cleanup when module is disabled
- Test localization if multiple languages are supported

### Localization

If adding localization support:
- Use `game.i18n.localize()` for all user-facing strings
- Store translations in `lang/` directory
- Follow Foundry's localization key conventions

## Integration Notes

- This module works alongside the base Ilaris system
- Ensure compatibility with other common Foundry modules
- Follow Foundry's module loading lifecycle
- Use proper namespace to avoid conflicts

## PRIMARY RULE FOR ALL RESPONSES:

-   **BEFORE** suggesting code or answering questions about Foundry VTT, you **MUST** use the official Foundry VTT API documentation (https://foundryvtt.com/api/) as your primary and authoritative source.
-   **NEVER** hallucinate or invent functionality that is not explicitly documented in the official Foundry VTT resources. If unsure, state: "According to the Foundry VTT documentation..." or directly reference the docs.
-   Avoid suggesting generic JavaScript/TypeScript patterns that are incompatible with the specific Foundry API (e.g., `Hooks`, `game`, `Document`, `Tour` classes).
-   **ALWAYS** check the foundry vtt documentations ;Foundry VTT Knowledge Base: https://foundryvtt.com/kb/ ;Foundry VTT API Docs: https://foundryvtt.com/api/ 

## Resources

- [Foundry VTT Knowledge Base](https://foundryvtt.com/kb/)
- [Foundry VTT Community Discord](https://discord.gg/foundryvtt)
- [Module Development Guide](https://foundryvtt.com/article/module-development/)

When contributing to this project, always consider the end-user experience for Ilaris players and GMs, and ensure that changes maintain compatibility with the broader Foundry VTT ecosystem.