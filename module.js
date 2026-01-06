/**
 * Ilaris Alternative Actor Sheet Module
 * 
 * This module provides an alternative actor sheet for the Ilaris Foundry VTT system.
 * Following the proven patterns of successful character sheet modules like 13th Age
 * and others, this extends the base ActorSheet directly without complex imports.
 */

import { IlarisAlternativeActorSheet } from './scripts/sheets/alternative-actor-sheet.js';
import { InitiativeDialog } from './scripts/apps/initiative-dialog.js';
import { MassInitiativeDialog } from './scripts/apps/mass-initiative-dialog.js';
import { NegativeInitiativeDialog } from './scripts/apps/negative-initiative-dialog.js';

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
  
  Handlebars.registerHelper('subtract', function(a, b) {
    return (a || 0) - (b || 0);
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
  
  // Array join helper
  Handlebars.registerHelper('join', function(array, separator) {
    if (!array || !Array.isArray(array)) return '';
    return array.join(separator || ', ');
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

  // Helper for extracting true properties from eigenschaften object
  Handlebars.registerHelper('eigenschaften', function(eigenschaften) {
    if (!eigenschaften || typeof eigenschaften !== 'object') return '';
    
    const trueProperties = Object.keys(eigenschaften).filter(key => eigenschaften[key] === true);
    return trueProperties.join(', ');
  });

  // Helper for checking if any item in an array has a truthy property
  Handlebars.registerHelper('some', function(array, property) {
    if (!Array.isArray(array)) return false;
    return array.some(item => {
      // Handle nested properties like "system.hauptwaffe"
      const props = property.split('.');
      let value = item;
      for (const prop of props) {
        value = value?.[prop];
        if (value === undefined) return false;
      }
      return !!value;
    });
  });

  // Helper for extracting names from an array of items
  Handlebars.registerHelper('itemNames', function(items) {
    if (!Array.isArray(items)) return '';
    return items.map(item => item?.name || '').filter(name => name).join(', ');
  });
  
  // Preload Handlebars templates
  await loadTemplates([
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/main-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/skills-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/kampf-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/items-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/spells-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/effects-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/biography-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/energy-resources.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/health-resources.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/item-accordion.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/favorites-component.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/carrying.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/supporting.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/handcart.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/components/effect-card.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/apps/initiative-dialog.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/apps/mass-initiative-dialog.hbs"
  ]);

  // Load component CSS files
  const accordionLink = document.createElement('link');
  accordionLink.rel = 'stylesheet';
  accordionLink.href = 'modules/ilaris-alternative-actor-sheet/styles/item-accordion.css';
  document.head.appendChild(accordionLink);
  
  const favoritesLink = document.createElement('link');
  favoritesLink.rel = 'stylesheet';
  favoritesLink.href = 'modules/ilaris-alternative-actor-sheet/styles/favorites-component.css';
  document.head.appendChild(favoritesLink);
  
  // Register the alternative actor sheet using the standard pattern
  Actors.registerSheet("Ilaris", IlarisAlternativeActorSheet, {
    types: ["held", "kreatur"],
    makeDefault: false,
    label: "Alternative Actor Sheet"
  });
  
  console.log('Ilaris Alternative Actor Sheet | Module initialized successfully');
});

// Handlebars helper for includes check (arrays)
Handlebars.registerHelper('includes', function(array, value) {
  if (!array || !Array.isArray(array)) return false;
  return array.includes(value);
});

// Handlebars helper for string includes check (for Stack detection)
Handlebars.registerHelper('stringIncludes', function(str, search) {
  if (!str || typeof str !== 'string') return false;
  return str.includes(search);
});

// Handlebars helper for equality check
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

/**
 * Initiative Dialog Manager
 * Handles opening initiative dialogs for combatants
 */
const InitiativeDialogManager = {
  /**
   * Open the appropriate initiative dialog
   * @param {Combat} combat - The combat instance
   * @param {Combatant|Combatant[]} combatants - The combatant(s) to process
   */
  async openDialog(combat, combatants) {
    const combatantArray = Array.isArray(combatants) ? combatants : [combatants];

    console.log('Ilaris Alternative Actor Sheet | Opening initiative dialogs for combatants:', combatantArray);
    
    // Separate PCs and NPCs
    const pcs = combatantArray.filter(c => c.actor?.hasPlayerOwner);
    const npcs = combatantArray.filter(c => !c.actor?.hasPlayerOwner);
    
    // Open PC dialogs (one per PC, only for the owner)
    for (const pc of pcs) {
      // Only show to the owner of the actor
      if (pc.actor?.isOwner && !game.user.isGM) {
        const dialog = new InitiativeDialog(pc);
        dialog.render(true);
      }
    }
    
    // Open NPC mass dialog for GM
    if (npcs.length > 0 && game.user.isGM) {
      const dialog = new MassInitiativeDialog(combat, npcs);
      dialog.render(true);
    }
  },
  
  /**
   * Check if a combatant needs initiative dialog
   * @param {Combatant} combatant
   * @returns {boolean}
   */
  needsDialog(combatant) {
    return combatant.initiative === null;
  }
};

// Hook: Combat updates - Handle round changes and negative initiative checks
// Note: Using updateCombat instead of combatRound because:
// - combatRound only fires on the client that triggered the action
// - updateCombat fires on ALL connected clients (needed for dialog display)
Hooks.on("updateCombat", async (combat, updateData, options, userId) => {
  // Early exit if neither turn nor round changed
  if (!("turn" in updateData) && !("round" in updateData)) return;
  
  // Handle new round start
  if ("round" in updateData) {
    console.log(`Ilaris Alternative Actor Sheet | Combat update hook triggered on ${game.user.name} (isGM: ${game.user.isGM}) - Round: ${combat.round}`);
    
    // Only GM should update combatants to avoid permission errors
    if (game.user.isGM) {
      console.log('Ilaris Alternative Actor Sheet | GM is resetting initiative for all combatants');
      // Reset initiative to null for all combatants, except those with negative initiative
      const updates = [];
      for (const combatant of combat.combatants) {
        // Skip if initiative is negative (actor continues action)
        if (combatant.initiative !== null && combatant.initiative < 0) {
          console.log('Ilaris Alternative Actor Sheet | Skipping negative initiative combatant:', combatant.name);
          continue;
        }
        
        // Reset initiative to null
        updates.push({
          _id: combatant.id,
          initiative: null
        });
      }
      
      // Apply initiative resets
      if (updates.length > 0) {
        console.log('Ilaris Alternative Actor Sheet | Applying initiative resets for', updates.length, 'combatants');
        await combat.updateEmbeddedDocuments("Combatant", updates);
        console.log('Ilaris Alternative Actor Sheet | Initiative resets completed');
      }
    } else {
      console.log('Ilaris Alternative Actor Sheet | Non-GM client, skipping initiative reset');
    }
    
    // Open dialogs for ALL combatants (including those with negative INI)
    const allCombatants = combat.combatants.contents;
    if (allCombatants.length > 0) {
      InitiativeDialogManager.openDialog(combat, allCombatants);
    }
  }
  
  // Handle negative initiative at round end
  // Only the GM should handle this
  if (game.user.isGM && "round" in updateData && updateData.round > combat.previous?.round) {
    // Check for combatants with negative initiative that haven't acted
    for (const combatant of combat.combatants) {
      if (combatant.initiative === null) continue;
      if (combatant.initiative >= 0) continue;
      
      const actor = combatant.actor;
      if (!actor) continue;
      
      // Check if this actor has the combat modifier effect
      const hasEffect = actor.effects.some(e => 
        e.name.startsWith("Kampf-Modifikatoren Runde")
      );
      
      if (!hasEffect) continue;
      
      // Show the negative initiative dialog to the owner
      const owners = game.users.filter(u => actor.testUserPermission(u, "OWNER"));
      
      for (const owner of owners) {
        if (owner.active) {
          // Only show to active owners
          if (game.user.id === owner.id) {
            const dialog = new NegativeInitiativeDialog(actor, combat);
            dialog.render(true);
          }
        }
      }
    }
  }
});

// Hook: Combat Start - Open dialogs for initial round
Hooks.on("combatStart", (combat, updateData) => {
  console.log('Ilaris Alternative Actor Sheet | Combat start hook triggered');
  
  const allCombatants = combat.combatants.contents;
  if (allCombatants.length > 0) {
    InitiativeDialogManager.openDialog(combat, allCombatants);
  }
});

// Hook: Override the default initiative roll button
Hooks.on("renderCombatTracker", (app, html, data) => {
  // Find initiative roll buttons
  html.find('.combatant-control[data-control="rollInitiative"]').each((i, btn) => {
    const li = btn.closest('.combatant');
    const combatantId = li?.dataset?.combatantId;
    
    if (!combatantId) return;
    
    const combat = game.combat;
    if (!combat) return;
    
    const combatant = combat.combatants.get(combatantId);
    if (!combatant) return;
    
    // Replace click handler
    $(btn).off('click').on('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Check if initiative already set
      if (combatant.initiative !== null) {
        ui.notifications.info("Initiative wurde bereits angesagt. Lösche den INI-Wert um erneut zu würfeln.");
        return;
      }
      
      if(!game.user.isGM) {
      // Open the appropriate dialog
      InitiativeDialogManager.openDialog(combat, combatant);
      } else {
        const allCombatants = combat.combatants.contents;
        // For GM, open mass dialog for NPCs or single dialog for PCs
        InitiativeDialogManager.openDialog(combat, allCombatants);
      }
    });
  });
});

// Hook: Turn-Index correction after combatant initiative update
Hooks.on("updateCombatant", async (combatant, updateData, options, userId) => {
  console.log('Ilaris Alternative Actor Sheet | Combatant update hook triggered', combatant.name, updateData);
  // Only proceed if initiative was updated
  if (!("initiative" in updateData)) return;
  
  // Only GM should handle this
  if (!game.user.isGM) return;
  
  const combat = combatant.parent;
  if (!combat || !combat.started) return;
  
  console.log('Ilaris Alternative Actor Sheet | Adjusting turn order after initiative update',combat);
  // Wait a tick to ensure combat.turns is fully updated and sorted
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // The first combatant in turns array has highest initiative (Foundry sorts descending)
  // Set turn to index 0 (first position = highest initiative)
  if (combat.turns.length > 0 && combat.turn !== 0) {
    await combat.update({ turn: 0 });
  }
});

// Hook: Check for negative initiative when a combatant's turn starts
Hooks.on("combatTurn", async (combat, updateData, options) => {
  // Get the current combatant
  const currentCombatant = combat.combatant;
  if (!currentCombatant) return;
  
  const actor = currentCombatant.actor;
  if (!actor) return;
  
  // Check if this combatant has negative initiative
  if (currentCombatant.initiative === null || currentCombatant.initiative >= 0) return;
  
  // Check if this actor has the combat modifier effect
  const hasEffect = actor.effects.some(e => 
    e.name.startsWith("Kampf-Modifikatoren Runde")
  );
  
  if (!hasEffect) return;
  
  // Only show to the owner of the actor
  if (!actor.testUserPermission(game.user, "OWNER")) return;
  
  // Show the negative initiative dialog
  const dialog = new NegativeInitiativeDialog(actor, combat, {}, {
    close: async () => {
      // After dialog closes (either yes or no), advance to next combatant
      await combat.nextTurn();
    }
  });
  dialog.render(true);
});