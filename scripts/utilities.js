/**
 * Utility Functions for Ilaris Alternative Actor Sheet
 * 
 * This module contains all async utility functions used throughout the module,
 * including weapon management, effect stacking, and ammunition tracking.
 */

// ==========================================
// Weapon Management
// ==========================================

/**
 * Check if a weapon is a throwable weapon (Wurfwaffen skill)
 * @param {Item} item - The item to check
 * @returns {boolean} - True if weapon uses Wurfwaffen skill
 */
export function isThrowableWeapon(item) {
  return item.type === "fernkampfwaffe" && item.system.fertigkeit === "Wurfwaffen";
}

/**
 * Automatically adds the corresponding Fernkampfwaffe when a Nahkampfwaffe 
 * with the "Fernkampfoption" property is added to an actor
 * @param {Item} nahkampfwaffe - The melee weapon with Fernkampfoption
 * @param {Actor} actor - The actor to add the ranged weapon to
 */
export async function addFernkampfoption(nahkampfwaffe, actor) {
  if(actor.type !== "held") {
    return; // Only for "held" actors
  }
  try {
    // Find Fernkampfoption property
    const fernkampfOption = nahkampfwaffe.system.eigenschaften?.find(
      e => e.key === "Fernkampfoption"
    );
    
    if (!fernkampfOption || !fernkampfOption.parameters?.[0]) {
      return; // No Fernkampfoption or no parameter specified
    }
    
    const fernkampfName = fernkampfOption.parameters[0];
    
    // Check if THIS specific melee weapon already triggered an addition
    const existingWeapon = actor.items.find(
      i => i.type === "fernkampfwaffe" && 
           i.name === fernkampfName && 
           i.getFlag("ilaris-alternative-actor-sheet", "linkedMeleeId") === nahkampfwaffe.id
    );
    
    if (existingWeapon) {
      console.log(`Ilaris Alternative Actor Sheet | Fernkampfoption: ${fernkampfName} already added for this specific melee weapon`);
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
    const createdItems = await actor.createEmbeddedDocuments("Item", [fernkampfWeapon.toObject()], {
      fernkampfOptionAutoAdded: true
    });
    
    const createdFernkampfwaffe = createdItems[0];
    
    // Establish bidirectional flag links
    await nahkampfwaffe.setFlag("ilaris-alternative-actor-sheet", "linkedRangedId", createdFernkampfwaffe.id);
    await createdFernkampfwaffe.setFlag("ilaris-alternative-actor-sheet", "linkedMeleeId", nahkampfwaffe.id);
    
    ui.notifications.info(`${fernkampfName} automatisch hinzugefügt`);
    
  } catch (error) {
    console.error(`Ilaris Alternative Actor Sheet | Error adding Fernkampfoption:`, error);
  }
}

/**
 * Delete linked weapon when one weapon of a linked pair is deleted
 * @param {Item} item - The deleted item
 * @param {Actor} actor - The actor owning the item
 */
export async function deleteLinkedWeapon(item, actor) {
  try {
    // Check for linked weapon ID based on item type
    let linkedId = null;
    if (item.type === "nahkampfwaffe") {
      linkedId = item.getFlag("ilaris-alternative-actor-sheet", "linkedRangedId");
    } else if (item.type === "fernkampfwaffe") {
      linkedId = item.getFlag("ilaris-alternative-actor-sheet", "linkedMeleeId");
    }
    
    if (!linkedId) {
      return; // No linked weapon
    }
    
    // Find and delete linked item
    const linkedItem = actor.items.get(linkedId);
    if (linkedItem) {
      await linkedItem.delete({ linkedWeaponDeletion: true });
    }
  } catch (error) {
    console.error(`Ilaris Alternative Actor Sheet | Error deleting linked weapon:`, error);
  }
}

/**
 * Create item pile with thrown weapon next to actor token
 * @param {Actor} actor - The actor throwing the weapon
 * @param {Item} weapon - The thrown weapon
 * @param {Token} token - The actor's token
 */
export async function createThrowableWeaponPile(actor, weapon, token) {
  try {
    // Check if Item Piles module is active
    if (!game.modules.get("item-piles")?.active) {
      console.log("Ilaris Alternative Actor Sheet | Item Piles module not active, skipping pile creation");
      return;
    }

    // Fetch linked melee weapon via flag
    const linkedMeleeId = weapon.getFlag("ilaris-alternative-actor-sheet", "linkedMeleeId");
    let linkedMeleeWeapon = null;
    if (linkedMeleeId) {
      linkedMeleeWeapon = actor.items.get(linkedMeleeId);
    }

    // Calculate hex grid position offset (one square to the right)
    const pileX = token.x + canvas.grid.size;
    const pileY = token.y;

    // Determine which item to put in pile
    let pileItem;
    if (linkedMeleeWeapon) {
      // Use melee weapon instead of thrown weapon
      pileItem = linkedMeleeWeapon.toObject();
    } else {
      // Use thrown weapon
      pileItem = weapon.toObject();
    }

    // Create item pile using Item Piles API
    // API expects position object and optional config with items
    await game.itempiles.API.createItemPile({
       position: {x: pileX, y: pileY },
       items: [pileItem] 
      }
    );

    // Handle quantity consumption and cleanup
    if (linkedMeleeWeapon) {
      // Consume melee weapon quantity
      await consumeAmmunition(actor, linkedMeleeWeapon.name, 1);
      // Delete thrown weapon without consuming
      await weapon.delete();
    } else {
      // Consume thrown weapon quantity
      await consumeAmmunition(actor, weapon.name, 1);
    }

    // Show notification
    ui.notifications.info(`${weapon.name} zu Boden gefallen`);

  } catch (error) {
    console.error(`Ilaris Alternative Actor Sheet | Error creating throwable weapon pile:`, error);
  }
}

// ==========================================
// Effect Stacking Utilities
// ==========================================

/**
 * Increase the stack count of a stack effect
 * Stack count is determined by changes.length
 * @param {ActiveEffect} effect - The effect to increase
 * @returns {Promise<void>}
 */
export async function increaseEffectStack(effect) {
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
export async function addEffectWithStacking(actor, effectData) {
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

/**
 * Apply bleeding effect to actor from effect-library pack
 * Uses the shared stacking logic
 * @param {Actor} actor - The actor to apply bleeding to
 */
export async function applyBleedingEffect(actor) {
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

// ==========================================
// Ammunition Tracking for Ranged Weapons
// ==========================================

export const AMMUNITION_TYPES = ["Kugel", "Pfeil", "Bolzen"];

/**
 * Helper function to consume ammunition from actor inventory
 * @param {Actor} actor - The actor consuming ammunition
 * @param {string} ammunitionType - The type of ammunition to consume ("Kugel", "Pfeil", or "Bolzen")
 * @param {number} amount - Number of ammunition to consume (default: 1)
 * @returns {Promise<boolean>} - True if ammunition was consumed, false if not found
 */
export async function consumeAmmunition(actor, ammunitionType, amount = 1) {
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
export async function showNoAmmunitionWarning(actor, weapon, ammunitionType) {
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
export async function handleFumble(rollResult, actor, weapon, ammunitionType, isHeld = true) {
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

// ==========================================
// Effect Time Management
// ==========================================

/**
 * Advance effect time for a single actor by decrementing temporary effect durations
 * @param {Actor} actor - The actor whose effects should be advanced
 * @returns {Promise<number>} - Number of effects that were updated
 */
export async function advanceEffectTime(actor) {
  // Filter effects with valid positive integer duration.turns or duration.rounds
  const temporaryEffects = actor.effects.filter(effect => {
    const turns = effect.duration?.turns;
    const rounds = effect.duration?.rounds;
    return (Number.isInteger(turns) && turns > 0) || 
           (Number.isInteger(rounds) && rounds > 0);
  });
  
  if (temporaryEffects.length === 0) {
    return 0;
  }
  
  // Create update array - decrement both turns and rounds
  const updates = temporaryEffects.map(effect => ({
    _id: effect.id,
    "duration.turns": Math.max(0, (effect.duration.turns || 0) - 1),
    "duration.rounds": Math.max(0, (effect.duration.rounds || 0) - 1)
  }));
  
  // Batch update all effects
  await actor.updateEmbeddedDocuments("ActiveEffect", updates);
  
  return updates.length;
}

/**
 * Advance effect time for all token actors on the active scene
 * @returns {Promise<Object>} - Statistics about the operation {actorsProcessed, effectsReduced}
 */
export async function advanceEffectTimeForAllActors() {
  // Check if there's an active scene
  if (!canvas.scene) {
    throw new Error("No active scene");
  }
  
  let totalActorsProcessed = 0;
  let totalEffectsReduced = 0;
  
  // Get all tokens on the current scene
  const tokens = canvas.scene.tokens;
  
  for (const tokenDoc of tokens) {
    const actor = tokenDoc.actor;
    if (!actor) continue;
    
    // Use shared logic to advance time for this actor
    const effectsReduced = await advanceEffectTime(actor);
    
    if (effectsReduced > 0) {
      totalActorsProcessed++;
      totalEffectsReduced += effectsReduced;
    }
  }
  
  return {
    actorsProcessed: totalActorsProcessed,
    effectsReduced: totalEffectsReduced
  };
}
