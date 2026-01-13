/**
 * Ilaris Alternative Actor Sheet Module
 * 
 * This module provides an alternative actor sheet for the Ilaris Foundry VTT system.
 * Following the proven patterns of successful character sheet modules like 13th Age
 * and others, this extends the base ActorSheet directly without complex imports.
 */

import { IlarisAlternativeActorSheet } from './scripts/sheets/alternative-actor-sheet.js';
import { IlarisAlternativeCreatureSheet } from './scripts/sheets/alternative-creature-sheet.js';
import { InitiativeDialog } from './scripts/apps/initiative-dialog.js';
import { MassInitiativeDialog } from './scripts/apps/mass-initiative-dialog.js';
import { NegativeInitiativeDialog } from './scripts/apps/negative-initiative-dialog.js';

/**
 * Automatically adds the corresponding Fernkampfwaffe when a Nahkampfwaffe 
 * with the "Fernkampfoption" property is added to an actor
 */
async function addFernkampfoption(nahkampfwaffe, actor) {
  try {
    // Find Fernkampfoption property
    const fernkampfOption = nahkampfwaffe.system.eigenschaften?.find(
      e => e.key === "Fernkampfoption"
    );
    
    if (!fernkampfOption || !fernkampfOption.parameters?.[0]) {
      return; // No Fernkampfoption or no parameter specified
    }
    
    const fernkampfName = fernkampfOption.parameters[0];
    
    // Check if actor already has this fernkampfwaffe (prevent duplicates)
    const existingWeapon = actor.items.find(
      i => i.name === fernkampfName && i.type === "fernkampfwaffe"
    );
    
    if (existingWeapon) {
      console.log(`Ilaris Alternative Actor Sheet | Fernkampfoption: ${fernkampfName} already exists on actor`);
      return;
    }
    
    // Get the weapon compendium
    const pack = game.packs.get("ilaris-alternative-actor-sheet.nenneke_regeln-waffen");
    if (!pack) {
      console.error(`Ilaris Alternative Actor Sheet | Weapon compendium not found`);
      ui.notifications.warn(`Waffe nicht gefunden: ${fernkampfName}`);
      return;
    }
    
    // Search for the fernkampfwaffe in the compendium
    const index = await pack.getIndex({ fields: ["name", "type"] });
    const fernkampfEntry = index.find(
      e => e.name === fernkampfName && e.type === "fernkampfwaffe"
    );
    
    if (!fernkampfEntry) {
      ui.notifications.warn(`Waffe nicht gefunden: ${fernkampfName}`);
      return;
    }
    
    // Get the full document and add it to the actor
    const fernkampfWeapon = await pack.getDocument(fernkampfEntry._id);
    await actor.createEmbeddedDocuments("Item", [fernkampfWeapon.toObject()], {
      fernkampfOptionAutoAdded: true
    });
    
    ui.notifications.info(`${fernkampfName} automatisch hinzugefügt`);
    
  } catch (error) {
    console.error(`Ilaris Alternative Actor Sheet | Error adding Fernkampfoption:`, error);
  }
}

/**
 * Hook: Automatically add Fernkampfwaffe when Nahkampfwaffe with Fernkampfoption is added
 */
Hooks.on("createItem", (item, options, userId) => {
  // Skip if this item was automatically added (prevent circular dependencies)
  if (options.fernkampfOptionAutoAdded) {
    return;
  }
  
  // Only process items added to actors
  if (!item.parent || item.parent.documentName !== "Actor") {
    return;
  }
  
  // Only process nahkampfwaffe (allow all other item types to proceed normally)
  if (item.type !== "nahkampfwaffe") {
    return;
  }
  
  // Fire and forget - don't await
  addFernkampfoption(item, item.parent);
});

// Module initialization hook
Hooks.once('init', async function() {
  console.log('Ilaris Alternative Actor Sheet | Initializing module');
  
  // Register module settings
  game.settings.register("ilaris-alternative-actor-sheet", "ammunitionTracking", {
    name: "Munitionsverwaltung aktivieren",
    hint: "Aktiviert die automatische Munitionsverwaltung für Fernkampfwaffen mit den Eigenschaften Kugel, Pfeil oder Bolzen.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
  
  // Register Handlebars helpers
  Handlebars.registerHelper('range', function(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(i);
    }
    return result;
  });

  Handlebars.registerHelper('isCaster', function (actor) {
      return (
          actor.system.abgeleitete.zauberer || actor.system.abgeleitete.geweihter
      )
  })
  
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

  // Eigenschaften helper - handles both array and object formats
  Handlebars.registerHelper('eigenschaften', function(eigenschaften, separator = ', ') {
    if (!eigenschaften) return '';
    
    // Handle array format: [{key: "name", parameters: ["param1", "param2"]}, ...]
    if (Array.isArray(eigenschaften)) {
      return eigenschaften.map(e => {
        if (!e || !e.key) return '';
        
        // If parameters exist and array is not empty, add them in parentheses separated by semicolons
        if (e.parameters && Array.isArray(e.parameters) && e.parameters.length > 0) {
          return `${e.key}(${e.parameters.join(';')})`;
        }
        
        return e.key;
      }).filter(s => s).join(separator || ', ');
    }
    
    // Handle object format: {property1: true, property2: false, ...}
    if (typeof eigenschaften === 'object') {
      const trueProperties = Object.keys(eigenschaften).filter(key => eigenschaften[key] === true);
      return trueProperties.join(separator || ', ');
    }
    
    return '';
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

  // Capitalize helper for creature type display
  Handlebars.registerHelper('capitalize', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Uppercase helper for stat labels
  Handlebars.registerHelper('uppercase', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toUpperCase();
  });

  // Color modifier helper for health status
  Handlebars.registerHelper('modColor', function(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
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
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/creature-kampf-tab.hbs",
    "modules/ilaris-alternative-actor-sheet/templates/sheets/tabs/creature-allgemein-tab.hbs",
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

  // Load creature sheet CSS
  const creatureLink = document.createElement('link');
  creatureLink.rel = 'stylesheet';
  creatureLink.href = 'modules/ilaris-alternative-actor-sheet/styles/creature-sheet.css';
  document.head.appendChild(creatureLink);
  
  // Register the alternative actor sheet for "held" type only
  Actors.registerSheet("Ilaris", IlarisAlternativeActorSheet, {
    types: ["held"],
    makeDefault: false,
    label: "Alternative Actor Sheet"
  });

  // Register the alternative creature sheet for "kreatur" type only
  Actors.registerSheet("Ilaris", IlarisAlternativeCreatureSheet, {
    types: ["kreatur"],
    makeDefault: false,
    label: "Alternative Creature Sheet"
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
  
  // Check if movedAction flag is set (only show dialog if action was moved)
  const dialogState = actor.getFlag("ilaris-alternative-actor-sheet", "dialogState");
  if (!dialogState?.movedAction) return;
  
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

// ==========================================
// Effect Stacking Utilities
// ==========================================

/**
 * Increase the stack count of a stack effect
 * Stack count is determined by changes.length
 * @param {ActiveEffect} effect - The effect to increase
 * @returns {Promise<void>}
 */
async function increaseEffectStack(effect) {
  const currentStacks = effect.changes.length;
  
  // Maximum check (5 stacks max)
  if (currentStacks >= 5) {
    ui.notifications.warn(`${effect.name} hat bereits maximale Stacks (5). Nur Duration aufgefrischt.`);
    await effect.update({"duration.turns": 3});
    return;
  }
  
  // Copy the first change as template
  const changeTemplate = foundry.utils.deepClone(effect.changes[0]);
  
  // Add new change to the array
  const updatedChanges = [...effect.changes, changeTemplate];
  
  // Update effect with new changes and refreshed duration
  await effect.update({
    changes: updatedChanges,
    "duration.turns": 3
  });
  
  ui.notifications.info(`${effect.name} Stack erhöht auf ${updatedChanges.length}`);
}

/**
 * Add an effect to an actor with automatic stacking for effects with "Stack" in the name
 * @param {Actor} actor - The actor to add the effect to
 * @param {Object} effectData - The effect data to add
 * @returns {Promise<void>}
 */
async function addEffectWithStacking(actor, effectData) {
  if (effectData.name && effectData.name.includes("Stack")) {
    // Check if a stack effect with the same name already exists
    const existingStack = actor.effects.find(e => e.name === effectData.name);
    
    if (existingStack) {
      // Effect exists - increase stack instead of creating new
      await increaseEffectStack(existingStack);
      return;
    }
  }
  // Create new effect (non-stack or first stack)
  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

// Export for use in actor sheets
window.IlarisAlternativeActorSheet = window.IlarisAlternativeActorSheet || {};
window.IlarisAlternativeActorSheet.addEffectWithStacking = addEffectWithStacking;
window.IlarisAlternativeActorSheet.increaseEffectStack = increaseEffectStack;

// ==========================================
// Ammunition Tracking for Ranged Weapons
// ==========================================

const AMMUNITION_TYPES = ["Kugel", "Pfeil", "Bolzen"];

/**
 * Helper function to consume ammunition from actor inventory
 * @param {Actor} actor - The actor consuming ammunition
 * @param {string} ammunitionType - The type of ammunition to consume ("Kugel", "Pfeil", or "Bolzen")
 * @param {number} amount - Number of ammunition to consume (default: 1)
 * @returns {Promise<boolean>} - True if ammunition was consumed, false if not found
 */
async function consumeAmmunition(actor, ammunitionType, amount = 1) {
  const ammoItem = actor.items.find(
    i => i.type === "gegenstand" && i.name === ammunitionType && i.system.quantity > 0
  );
  
  if (!ammoItem) {
    return false;
  }
  
  const currentQty = ammoItem.system.quantity;
  const newQty = Math.max(0, currentQty - amount);
  
  if (newQty <= 0) {
    await ammoItem.delete();
  } else {
    await ammoItem.update({ "system.quantity": newQty });
  }
  
  return true;
}

/**
 * Show warning when no ammunition is available
 * @param {Actor} actor - The actor without ammunition
 * @param {Item} weapon - The weapon that needs ammunition
 * @param {string} ammunitionType - The type of ammunition needed
 */
async function showNoAmmunitionWarning(actor, weapon, ammunitionType) {
  ui.notifications.warn(`Keine ${ammunitionType} für ${weapon.name} vorhanden`);
  
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div style="display: flex; align-items: center; gap: 10px;">
      <img src="${actor.img}" alt="${actor.name}" style="width: 36px; height: 36px; border: none; border-radius: 4px;"/>
      <div>
        <strong>${actor.name}</strong> hat keine <strong>${ammunitionType}</strong> mehr für <strong>${weapon.name}</strong>!
      </div>
    </div>`
  });
}

/**
 * Handle fumble result on ranged attack
 * @param {Object} rollResult - The roll result from the attack
 * @param {Actor} actor - The actor who fumbled
 * @param {Item} weapon - The weapon used
 * @param {string} ammunitionType - The type of ammunition (can be null for creatures)
 * @param {boolean} isHeld - Whether the actor is of type "held" (true) or "kreatur" (false)
 * @returns {Promise<number>} - Amount of ammunition to consume (1 or 2, or 0 for creatures)
 */
async function handleFumble(rollResult, actor, weapon, ammunitionType, isHeld = true) {
  // Roll 2d6 for fumble table
  const fumbleRoll = new Roll("2d6");
  await fumbleRoll.evaluate();
  const fumbleResult = fumbleRoll.total;
  
  let effectText = "";
  let ammoToConsume = isHeld ? 1 : 0; // Creatures don't consume ammo
  
  switch (fumbleResult) {
    case 2:
      // Bleeding effect
      effectText = "Du erhältst einen Stack <strong>Blutung</strong>!";
      await applyBleedingEffect(actor);
      break;
      
    case 3:
      // Double ammunition consumption (only for "held" actors)
      if (isHeld) {
        effectText = "Du verbrauchst doppelt so viel Munition!";
        ammoToConsume = 2;
      } else {
        // For creatures, show generic fumble text instead
        effectText = "Fehlschuss durch Patzer!";
      }
      break;
      
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      // Weapon needs to be readied
      effectText = "Fehlschuss! Du musst deine Waffe mit einer Aktion <strong>Bereit machen</strong>.";
      break;
      
    case 9:
    case 10:
    case 11:
      // Collateral damage to ally
      // Convert German dice notation (W) to English (d)
      const damageFormula = weapon.system.schaden.replace(/(\d+)W(\d+)/gi, '$1d$2');
      const damageRoll = new Roll(damageFormula);
      await damageRoll.evaluate();
      const halfDamage = Math.ceil(damageRoll.total / 2);
      effectText = `Ein Verbündetes Ziel in Reichweite (vom Spielleiter gewählt oder nächstes Ziel in der Schusslinie) erleidet <strong>${halfDamage} Schaden</strong> (Waffenschaden ${damageRoll.total}, Hälfte aufgerundet). Falls keines vorhanden ist, verfehlt der Schuss knapp deinen eigenen Fuß.`;
      break;
      
    case 12:
      // Self damage
      // Convert German dice notation (W) to English (d)
      const selfDamageFormula = weapon.system.schaden.replace(/(\d+)W(\d+)/gi, '$1d$2');
      const selfDamageRoll = new Roll(selfDamageFormula);
      await selfDamageRoll.evaluate();
      effectText = `Du erleidest deinen Waffenschaden: <strong>${selfDamageRoll.total} Schaden</strong>!`;
      
      // Apply damage to actor's wounds
      const currentWounds = actor.system.gesundheit.wunden || 0;
      await actor.update({ "system.gesundheit.wunden": currentWounds + selfDamageRoll.total });
      break;
  }
  
  // Post fumble chat message with red border and icon
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<div style="border: 2px solid #ff0000; padding: 10px; border-radius: 5px; background: rgba(255, 0, 0, 0.05);">
      <h3 style="margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-skull-crossbones" style="color: #ff0000;"></i>
        Fernkampf-Fumble!
      </h3>
      <p style="margin: 0 0 8px 0;"><strong>2W6 Ergebnis:</strong> ${fumbleResult}</p>
      <p style="margin: 0;">${effectText}</p>
    </div>`
  });
  
  return ammoToConsume;
}

/**
 * Apply bleeding effect to actor from effect-library pack
 * Uses the shared stacking logic
 * @param {Actor} actor - The actor to apply bleeding to
 */
async function applyBleedingEffect(actor) {
  try {
    const pack = game.packs.get("ilaris-alternative-actor-sheet.effect-library");
    if (!pack) {
      console.error("Ilaris Alternative Actor Sheet | Effect library pack not found");
      ui.notifications.warn("Blutung-Effekt konnte nicht gefunden werden. Bitte manuell hinzufügen.");
      return;
    }
    
    const documents = await pack.getDocuments();
    const blutungItem = documents.find(d => d.name === "Blutung");
    
    if (!blutungItem) {
      console.error("Ilaris Alternative Actor Sheet | Blutung item not found in pack");
      ui.notifications.warn("Blutung-Effekt konnte nicht gefunden werden. Bitte manuell hinzufügen.");
      return;
    }
    
    // Get effects from the Blutung item
    const effects = blutungItem.effects?.contents || [];
    if (effects.length === 0) {
      console.error("Ilaris Alternative Actor Sheet | Blutung item has no effects");
      ui.notifications.warn("Blutung-Effekt hat keine Active Effects. Bitte manuell hinzufügen.");
      return;
    }
    
    // Transfer effects using shared utility
    for (const effect of effects) {
      const effectData = effect.toObject();
      effectData.origin = actor.uuid;
      await addEffectWithStacking(actor, effectData);
    }
    
  } catch (error) {
    console.error("Ilaris Alternative Actor Sheet | Error applying bleeding effect:", error);
    ui.notifications.warn("Blutung-Effekt konnte nicht angewendet werden. Bitte manuell hinzufügen.");
  }
}

// Hook: Handle ammunition consumption on ranged attack
Hooks.on("Ilaris.fernkampfAngriffClick", async (rollResult, actor, item) => {
  // Check if ammunition tracking is enabled
  if (!game.settings.get("ilaris-alternative-actor-sheet", "ammunitionTracking")) {
    return;
  }
  
  const isHeld = actor.type === "held";
  
  // Find ammunition property on weapon (for both held and kreatur)
  const ammoProperty = item.system.eigenschaften?.find(
    e => AMMUNITION_TYPES.includes(e.key)
  );
  
  // Implement simple locking mechanism to prevent race conditions
  const lockFlag = actor.getFlag("ilaris-alternative-actor-sheet", "processingAmmunition");
  if (lockFlag) {
    console.log("Ilaris Alternative Actor Sheet | Ammunition processing already in progress, skipping");
    return;
  }
  
  try {
    await actor.setFlag("ilaris-alternative-actor-sheet", "processingAmmunition", true);
    
    // Handle fumble (works for all actor types)
    if (rollResult.fumble === true) {
      const ammunitionType = ammoProperty?.key || null;
      const ammoToConsume = await handleFumble(rollResult, actor, item, ammunitionType, isHeld);
      
      // Only consume ammunition for "held" actors with ammunition property
      if (isHeld && ammoProperty && ammoToConsume > 0) {
        const consumed = await consumeAmmunition(actor, ammunitionType, ammoToConsume);
        if (!consumed) {
          await showNoAmmunitionWarning(actor, item, ammunitionType);
        }
      }
    } else {
      // Normal (non-fumble) attack: only consume ammo for "held" actors with ammo property
      if (isHeld && ammoProperty) {
        const ammunitionType = ammoProperty.key;
        const consumed = await consumeAmmunition(actor, ammunitionType, 1);
        if (!consumed) {
          await showNoAmmunitionWarning(actor, item, ammunitionType);
        }
      }
    }
    
  } catch (error) {
    console.error("Ilaris Alternative Actor Sheet | Error processing ammunition:", error);
  } finally {
    await actor.setFlag("ilaris-alternative-actor-sheet", "processingAmmunition", false);
  }
});