/**
 * Ilaris Alternative Actor Sheet Module
 * 
 * This module provides an alternative actor sheet for the Ilaris Foundry VTT system.
 * Following the proven patterns of successful character sheet modules like 13th Age
 * and others, this extends the base ActorSheet directly without complex imports.
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
  
  // Mathematical helpers for energy bars
  Handlebars.registerHelper('divide', function(a, b) {
    if (!b || b === 0) return 0;
    return (a || 0) / b;
  });
  
  Handlebars.registerHelper('multiply', function(a, b) {
    return (a || 0) * (b || 0);
  });
  
  Handlebars.registerHelper('percentage', function(current, max) {
    if (!max || max === 0) return 0;
    return Math.round(((current || 0) / max) * 100);
  });

  // Helper for creating arrays in templates
  Handlebars.registerHelper('array', function() {
    return Array.from(arguments).slice(0, -1); // Remove the Handlebars options object
  });

  // Helper for concatenating strings
  Handlebars.registerHelper('concat', function() {
    return Array.from(arguments).slice(0, -1).join(''); // Remove the Handlebars options object
  });

  // Helper for creating hash objects
  Handlebars.registerHelper('hash', function() {
    const options = arguments[arguments.length - 1];
    return options.hash;
  });
  
  // Preload Handlebars templates
  await loadTemplates([
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/main-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/skills-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/items-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/spells-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/biography-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/energy-resources.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/health-resources.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/item-accordion.hbs"
  ]);

  // Load accordion CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'modules/ilaris-alternative-actor-sheet/styles/item-accordion.css';
  document.head.appendChild(link);
  
  // Register the alternative actor sheet using the standard pattern
  Actors.registerSheet("Ilaris", IlarisAlternativeActorSheet, {
    types: ["held", "kreatur"],
    makeDefault: false,
    label: "Alternative Actor Sheet"
  });
  
  console.log('Ilaris Alternative Actor Sheet | Module initialized successfully');
});