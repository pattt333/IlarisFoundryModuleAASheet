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
import { registerHandlebarsHelpers } from './scripts/handlebars-helpers.js';
import {
  addFernkampfoption,
  deleteLinkedWeapon,
  increaseEffectStack,
  addEffectWithStacking,
  consumeAmmunition,
  showNoAmmunitionWarning,
  handleFumble,
  advanceEffectTimeForAllActors,
  isThrowableWeapon,
  createThrowableWeaponPile,
  AMMUNITION_TYPES
} from './scripts/utilities.js';

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

    // Only process if user is owner of the actor
  const user = game.users.get(userId);
  if (!user || !item.parent.testUserPermission(user, "OWNER") || game.user.isGM) {
    return;
  }
  
  // Fire and forget - don't await
  addFernkampfoption(item, item.parent);
});

/**
 * Hook: Automatically delete linked weapon when one is deleted
 */
Hooks.on("deleteItem", (item, options, userId) => {
  // Skip if this deletion was triggered by linked weapon deletion (prevent infinite loop)
  if (options.linkedWeaponDeletion) {
    return;
  }
  
  // Only process items deleted from actors
  if (!item.parent || item.parent.documentName !== "Actor") {
    return;
  }
  
  // Only process nahkampfwaffe or fernkampfwaffe
  if (item.type !== "nahkampfwaffe" && item.type !== "fernkampfwaffe") {
    return;
  }
  
  // Only process if user is owner of the actor
  const user = game.users.get(userId);
  if (!user || !item.parent.testUserPermission(user, "OWNER") || game.user.isGM) {
    return;
  }
  
  // Fire and forget - don't await
  deleteLinkedWeapon(item, item.parent);
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
  registerHandlebarsHelpers();
  
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

// Hook: asking for negative initiative dialog on turn change
Hooks.on("combatTurnChange", async (combat, prior, current) => {
  console.log('Ilaris Alternative Actor Sheet | Combatant turn changed hook triggered', combat, prior, current);

  const currentCombatant = combat.combatants.get(current.combatantId);
  if (!currentCombatant) return;

  console.log('Ilaris Alternative Actor Sheet | Combat turn hook triggered for', currentCombatant);

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
  if (actor.type === "held" && game.user.isGM) return;
  
  // Show the negative initiative dialog
  const dialog = new NegativeInitiativeDialog(actor, combat, {}, {
    close: async () => {
      // After dialog closes (either yes or no), advance to next combatant
      await combat.nextTurn();
    }
  });
  dialog.render(true);
});

// Export for use in actor sheets
window.IlarisAlternativeActorSheet = window.IlarisAlternativeActorSheet || {};
window.IlarisAlternativeActorSheet.addEffectWithStacking = addEffectWithStacking;
window.IlarisAlternativeActorSheet.increaseEffectStack = increaseEffectStack;

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
  
  // Check if weapon is throwable and handle item pile creation
  if (isThrowableWeapon(item)) {
    // Validate token exists on canvas
    const activeTokens = actor.getActiveTokens();
    if (activeTokens.length === 0) {
      console.log("Ilaris Alternative Actor Sheet | No token on scene for thrown weapon, skipping");
      return;
    }
    
    const token = canvas.tokens.get(activeTokens[0].id);
    if (!token) {
      console.log("Ilaris Alternative Actor Sheet | Token not found on canvas, skipping");
      return;
    }
    
    // Fire and forget - create pile without awaiting
    createThrowableWeaponPile(actor, item, token);
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

// ==========================================
// Scene Control: Advance Time for All Actors
// ==========================================

/**
 * Hook: Add scene control button for advancing time on all actors
 */
Hooks.on("getSceneControlButtons", (controls) => {
  // Only show for GM
  if (!game.user.isGM) return;
  
  // Find the token controls
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;
  
  // Add button at the end of the tools list
  tokenControls.tools.push({
    name: "advance-time-all",
    title: "Zeit vorrücken (Alle Actoren)",
    icon: "fas fa-stopwatch",
    button: true,
    onClick: async () => {
      try {
        // Use shared utility function
        const stats = await advanceEffectTimeForAllActors();
        
        // Show success notification
        if (stats.actorsProcessed > 0) {
          ui.notifications.info("Zeit für alle Actoren wurde vorgerückt");
          console.log(`Ilaris Alternative Actor Sheet | Advanced time: ${stats.actorsProcessed} actors, ${stats.effectsReduced} effects reduced`);
        } else {
          ui.notifications.info("Keine temporären Effekte auf der Szene vorhanden");
        }
        
      } catch (error) {
        if (error.message === "No active scene") {
          ui.notifications.warn("Keine aktive Szene vorhanden");
        } else {
          console.error("Ilaris Alternative Actor Sheet | Error advancing time for all actors:", error);
          ui.notifications.error("Fehler beim Vorrücken der Zeit");
        }
      }
    }
  });
});