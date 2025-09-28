/**
 * Ilaris Alternative Actor Sheet Module
 * 
 * This module provides an alternative actor sheet for the Ilaris Foundry VTT system.
 * It extends the base Ilaris actor sheet with enhanced layout and functionality.
 */

import { IlarisAlternativeActorSheet } from './scripts/sheets/alternative-actor-sheet.js';

// Module initialization hook
Hooks.once('init', async function() {
  console.log('Ilaris Alternative Actor Sheet | Initializing module');
  
  // Register Handlebars helpers
  Handlebars.registerHelper('range', function(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(i);
    }
    return result;
  });
  
  Handlebars.registerHelper('add', function(a, b) {
    return (a || 0) + (b || 0);
  });
  
  Handlebars.registerHelper('gte', function(a, b) {
    return (a || 0) >= (b || 0);
  });
  
  // Preload Handlebars templates
  await loadTemplates([
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/main-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/skills-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/items-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/spells-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/biography-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/energy-resources.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/health-resources.hbs"
  ]);
  
  // Register the alternative actor sheet
  Actors.registerSheet("Ilaris", IlarisAlternativeActorSheet, {
    types: ["held", "kreatur"],
    makeDefault: false,
    label: "Alternative Actor Sheet"
  });
  
  console.log('Ilaris Alternative Actor Sheet | Module initialized');
});

// Ready hook - called when the game is ready
Hooks.once('ready', async function() {
  console.log('Ilaris Alternative Actor Sheet | Module ready');
});