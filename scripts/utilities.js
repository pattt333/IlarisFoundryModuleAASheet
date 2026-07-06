/**
 * Utility Functions for Ilaris Alternative Actor Sheet
 *
 * This module contains all async utility functions used throughout the module,
 * including weapon management, effect stacking, and ammunition tracking.
 */

// ==========================================
// Weapon Management
// ==========================================

import { IlarisActiveEffect } from '../../../../systems/Ilaris/scripts/effects/active-effect.js'
/**
 * Check if a weapon is a throwable weapon (Wurfwaffen skill)
 * @param {Item} item - The item to check
 * @returns {boolean} - True if weapon uses Wurfwaffen skill
 */
export function isThrowableWeapon(item) {
    return item.type === 'fernkampfwaffe' && item.system.fertigkeit === 'Wurfwaffen';
}

/**
 * Automatically adds the corresponding Fernkampfwaffe when a Nahkampfwaffe
 * with the "Fernkampfoption" property is added to an actor
 * @param {Item} nahkampfwaffe - The melee weapon with Fernkampfoption
 * @param {Actor} actor - The actor to add the ranged weapon to
 */
export async function addFernkampfoption(nahkampfwaffe, actor) {
    if (actor.type !== 'held') {
        return; // Only for "held" actors
    }
    try {
        // Find Fernkampfoption property
        const fernkampfOption = nahkampfwaffe.system.eigenschaften?.find(e => e.key === 'Fernkampfoption');

        if (!fernkampfOption || !fernkampfOption.parameters?.[0]) {
            return; // No Fernkampfoption or no parameter specified
        }

        const fernkampfName = fernkampfOption.parameters[0];

        // Check if THIS specific melee weapon already triggered an addition
        const existingWeapon = actor.items.find(
            i =>
                i.type === 'fernkampfwaffe' &&
                i.name === fernkampfName &&
                i.getFlag('ilaris-alternative-actor-sheet', 'linkedMeleeId') === nahkampfwaffe.id
        );

        if (existingWeapon) {
            console.log(
                `Ilaris Alternative Actor Sheet | Fernkampfoption: ${fernkampfName} already added for this specific melee weapon`
            );
            return;
        }

        // Get the weapon compendium
        const pack = game.packs.get('ilaris-alternative-actor-sheet.nenneke_regeln-waffen');
        if (!pack) {
            console.error(`Ilaris Alternative Actor Sheet | Weapon compendium not found`);
            ui.notifications.warn(`Waffe nicht gefunden: ${fernkampfName}`);
            return;
        }

        // Search for the fernkampfwaffe in the compendium
        const index = await pack.getIndex({ fields: ['name', 'type'] });
        const fernkampfEntry = index.find(e => e.name === fernkampfName && e.type === 'fernkampfwaffe');

        if (!fernkampfEntry) {
            ui.notifications.warn(`Waffe nicht gefunden: ${fernkampfName}`);
            return;
        }

        // Get the full document and add it to the actor
        const fernkampfWeapon = await pack.getDocument(fernkampfEntry._id);
        const createdItems = await actor.createEmbeddedDocuments('Item', [fernkampfWeapon.toObject()], {
            fernkampfOptionAutoAdded: true,
        });

        const createdFernkampfwaffe = createdItems[0];

        // Establish bidirectional flag links
        await nahkampfwaffe.setFlag('ilaris-alternative-actor-sheet', 'linkedRangedId', createdFernkampfwaffe.id);
        await createdFernkampfwaffe.setFlag('ilaris-alternative-actor-sheet', 'linkedMeleeId', nahkampfwaffe.id);

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
        if (item.type === 'nahkampfwaffe') {
            linkedId = item.getFlag('ilaris-alternative-actor-sheet', 'linkedRangedId');
        } else if (item.type === 'fernkampfwaffe') {
            linkedId = item.getFlag('ilaris-alternative-actor-sheet', 'linkedMeleeId');
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
        if (!game.modules.get('item-piles')?.active) {
            console.log('Ilaris Alternative Actor Sheet | Item Piles module not active, skipping pile creation');
            return;
        }

        // Fetch linked melee weapon via flag
        const linkedMeleeId = weapon.getFlag('ilaris-alternative-actor-sheet', 'linkedMeleeId');
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
            position: { x: pileX, y: pileY },
            items: [pileItem],
        });

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
    const originalValue = effect.system?.ilarisTiming?.originalValue || 3;

    // Maximum check (5 stacks max)
    if (currentStacks >= 5) {
        ui.notifications.warn(`${effect.name} hat bereits maximale Stacks (5). Nur Duration aufgefrischt.`);
        await effect.update({ 'system.ilarisTiming.remaining': originalValue });
        return;
    }

    // Copy the first change as template
    const changeTemplate = foundry.utils.deepClone(effect.changes[0]);

    // Add new change to the array
    const updatedChanges = [...effect.changes, changeTemplate];

    // Update effect with new changes and refresh ilaris duration
    await effect.update({
        changes: updatedChanges,
        'system.ilarisTiming.durationType': 'ownerTurns',
        'system.ilarisTiming.remaining': originalValue,
        'system.ilarisTiming.originalValue': originalValue,
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
    if (effectData.name && effectData.name.includes('Stack')) {
        // Check if a stack effect with the same name already exists
        const existingStack = actor.effects.find(e => e.name === effectData.name);

        if (existingStack) {
            // Effect exists - increase stack instead of creating new
            await increaseEffectStack(existingStack);
            return;
        }
    }
    // Create new effect (non-stack or first stack)
    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
}

/**
 * Consume an inventory item by a fixed amount and delete it at zero.
 * @param {Actor} actor
 * @param {string} itemId
 * @param {number} amount
 * @returns {Promise<{status: string, quantity?: number, itemName?: string}>}
 */
export async function consumeInventoryItem(actor, itemId, amount = 1) {
    if (!actor || !itemId || !Number.isFinite(amount) || amount <= 0) {
        return { status: 'invalid' };
    }

    const item = actor.items.get(itemId);
    if (!item) {
        return { status: 'missing' };
    }

    const currentQuantity = Number(item.system.quantity ?? 0);
    if (!Number.isFinite(currentQuantity) || currentQuantity <= 0) {
        await item.delete();
        return { status: 'removed-empty', itemName: item.name };
    }

    const nextQuantity = currentQuantity - amount;
    if (nextQuantity <= 0) {
        await item.delete();
        return { status: 'deleted', itemName: item.name };
    }

    await item.update({ 'system.quantity': nextQuantity });
    return { status: 'updated', quantity: nextQuantity, itemName: item.name };
}

/**
 * Build the socket and hook payload for a shared item application event.
 * @param {Actor} actor
 * @param {Item} item
 * @param {Array<object>} targets
 * @returns {object}
 */
export function createItemApplicationPayload(actor, item, targets = []) {
    const effectPayloads = (item?.effects?.contents || item?.effects || []).map(effect => {
        const effectData = effect.toObject();
        delete effectData._id;
        effectData.origin = item.uuid;
        return effectData;
    });

    return {
        sourceActorId: actor?.id || null,
        sourceActorName: actor?.name || 'Unbekannt',
        itemId: item?.id || null,
        itemUuid: item?.uuid || null,
        itemName: item?.name || 'Unbekannter Gegenstand',
        itemImg: item?.img || 'icons/svg/item-bag.svg',
        effects: effectPayloads,
        targets: targets.map(target => ({
            actorId: target.actorId || null,
            tokenId: target.tokenId || null,
            name: target.name || 'Unbekanntes Ziel',
            distance: Number(target.distance ?? 0),
        })),
    };
}

/**
 * Apply an item to a target actor. Effect transfer is intentionally a placeholder.
 * @param {Actor|null} sourceActor
 * @param {Actor} targetActor
 * @param {object} payload
 * @param {object} target
 * @returns {Promise<{status: string, effectCount: number}>}
 */
export async function applyItemToTarget(sourceActor, targetActor, payload, target) {
    const effectCount = Array.isArray(payload?.effects) ? payload.effects.length : 0;
    const effectNames = (payload?.effects || []).map(effect => effect.name).filter(Boolean);
    const effectText = effectNames.length > 0 ? effectNames.join(', ') : 'Noch ohne Effektuebertragung';

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: sourceActor || targetActor }),
        content: `
            <div class="iaas-item-apply-chat">
                <div class="iaas-item-apply-chat__title"><strong>${payload.itemName}</strong> auf <strong>${targetActor.name}</strong> angewendet</div>
                <div class="iaas-item-apply-chat__meta">Quelle: ${sourceActor?.name || payload.sourceActorName || 'Unbekannt'}</div>
                <div class="iaas-item-apply-chat__meta">Ziel: ${target?.name || targetActor.name}${Number.isFinite(target?.distance) ? ` (${target.distance} Schritt)` : ''}</div>
                <div class="iaas-item-apply-chat__meta">Effektstatus: ${effectText}</div>
            </div>`,
    });

    globalThis.ui.notifications.info(`${payload.itemName} wurde auf ${targetActor.name} angewendet.`);
    return { status: 'placeholder', effectCount };
}

/**
 * Apply bleeding effect to actor from effect-library pack
 * Uses the shared stacking logic
 * @param {Actor} actor - The actor to apply bleeding to
 */
export async function applyBleedingEffect(actor) {
    try {
        const pack = game.packs.get('ilaris-alternative-actor-sheet.effect-library');
        if (!pack) {
            console.error('Ilaris Alternative Actor Sheet | Effect library pack not found');
            ui.notifications.warn('Blutung-Effekt konnte nicht gefunden werden. Bitte manuell hinzufügen.');
            return;
        }

        const documents = await pack.getDocuments();
        const blutungEffect = documents.find(d => d.name === 'Blutung Stack');

        if (!blutungEffect) {
            console.error('Ilaris Alternative Actor Sheet | Blutung Stack not found in pack');
            ui.notifications.warn('Blutung-Effekt konnte nicht gefunden werden. Bitte manuell hinzufügen.');
            return;
        }

        const effectData = blutungEffect.toObject();
        delete effectData._id;
        effectData.origin = actor.uuid;

        await addEffectWithStacking(actor, effectData);
    } catch (error) {
        console.error('Ilaris Alternative Actor Sheet | Error applying bleeding effect:', error);
        ui.notifications.warn('Blutung-Effekt konnte nicht angewendet werden. Bitte manuell hinzufügen.');
    }
}

// ==========================================
// Ammunition Tracking for Ranged Weapons
// ==========================================

export const AMMUNITION_TYPES = ['Kugel', 'Pfeil', 'Bolzen'];

/**
 * Helper function to consume ammunition from actor inventory
 * @param {Actor} actor - The actor consuming ammunition
 * @param {string} ammunitionType - The type of ammunition to consume ("Kugel", "Pfeil", or "Bolzen")
 * @param {number} amount - Number of ammunition to consume (default: 1)
 * @returns {Promise<boolean>} - True if ammunition was consumed, false if not found
 */
export async function consumeAmmunition(actor, ammunitionType, amount = 1) {
    const ammoItem = actor.items.find(
        i => i.type === 'gegenstand' && i.name === ammunitionType && i.system.quantity > 0
    );

    if (!ammoItem) {
        return false;
    }

    await consumeInventoryItem(actor, ammoItem.id, amount);

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
    </div>`,
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
    const fumbleRoll = new Roll('2d6');
    await fumbleRoll.evaluate();
    const fumbleResult = fumbleRoll.total;

    let effectText = '';
    let ammoToConsume = isHeld ? 1 : 0; // Creatures don't consume ammo

    switch (fumbleResult) {
        case 2:
            // Bleeding effect
            effectText = 'Du erhältst einen Stack <strong>Blutung</strong>!';
            await applyBleedingEffect(actor);
            break;

        case 3:
            // Double ammunition consumption (only for "held" actors)
            if (isHeld) {
                effectText = 'Du verbrauchst doppelt so viel Munition!';
                ammoToConsume = 2;
            } else {
                // For creatures, show generic fumble text instead
                effectText = 'Fehlschuss durch Patzer!';
            }
            break;

        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
            // Weapon needs to be readied
            effectText = 'Fehlschuss! Du musst deine Waffe mit einer Aktion <strong>Bereit machen</strong>.';
            break;

        case 9:
        case 10:
        case 11:
            // Collateral damage to ally
            // Convert German dice notation (W) to English (d)
            const damageFormula = weapon.system.tp.replace(/(\d+)W(\d+)/gi, '$1d$2');
            const damageRoll = new Roll(damageFormula);
            await damageRoll.evaluate();
            const halfDamage = Math.ceil(damageRoll.total / 2);
            effectText = `Ein Verbündetes Ziel in Reichweite (vom Spielleiter gewählt oder nächstes Ziel in der Schusslinie) erleidet <strong>${halfDamage} Schaden</strong> (Waffenschaden ${damageRoll.total}, Hälfte aufgerundet). Falls keines vorhanden ist, verfehlt der Schuss knapp deinen eigenen Fuß.`;
            break;

        case 12:
            // Self damage
            // Convert German dice notation (W) to English (d)
            const selfDamageFormula = weapon.system.tp.replace(/(\d+)W(\d+)/gi, '$1d$2');
            const selfDamageRoll = new Roll(selfDamageFormula);
            await selfDamageRoll.evaluate();
            effectText = `Du erleidest deinen Waffenschaden: <strong>${selfDamageRoll.total} Schaden</strong>!`;

            // Apply damage to actor's wounds
            const currentWounds = actor.system.gesundheit.wunden || 0;
            await actor.update({ 'system.gesundheit.wunden': currentWounds + selfDamageRoll.total });
            break;
    }

    // Post fumble chat message with semantic styling classes
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<div class="ilaris-chat-fumble">
            <h3 class="ilaris-chat-fumble__title">
                <i class="fas fa-skull-crossbones ilaris-chat-fumble__icon"></i>
        Fernkampf-Fumble!
      </h3>
      <p style="margin: 0 0 8px 0;"><strong>2W6 Ergebnis:</strong> ${fumbleResult}</p>
      <p style="margin: 0;">${effectText}</p>
    </div>`,
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
    // Filter Ilaris-timed effects that still have remaining duration
    const ilarisEffects = actor.effects.filter(
        e => e.system?.ilarisTiming?.durationType === 'ownerTurns' && e.system.ilarisTiming.remaining > 0,
    );

    if (ilarisEffects.length === 0) {
        return 0;
    }


    const updates = [];
    const deletions = [];

    for (const effect of ilarisEffects) {
        const newRemaining = effect.system.ilarisTiming.remaining - 1;

        // Apply DOT damage at end of owner's turn (after flagging)
        if (effect.hasDotChanges) {
            for (const change of effect.dotChanges) {
                await IlarisActiveEffect.applyDotDamage(actor, change, effect)
            }
        }

        if (newRemaining <= 0) {
            deletions.push(effect.id);
        } else {
            updates.push({ _id: effect.id, 'system.ilarisTiming.remaining': newRemaining });
        }
    }

    if (updates.length) await actor.updateEmbeddedDocuments('ActiveEffect', updates);
    for (const id of deletions) await actor.deleteEmbeddedDocuments('ActiveEffect', [id]);

    return ilarisEffects.length;
}

/**
 * Advance effect time for all token actors on the active scene
 * @returns {Promise<Object>} - Statistics about the operation {actorsProcessed, effectsReduced}
 */
export async function advanceEffectTimeForAllActors() {
    // Check if there's an active scene
    if (!canvas.scene) {
        throw new Error('No active scene');
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
        effectsReduced: totalEffectsReduced,
    };
}

// ==========================================
// AI Creature Generator Utilities
// ==========================================

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const CREATURE_RELEVANT_VORTEIL_CATEGORIES = ['allgemein', 'profan', 'kampf', 'kampfstil'];

const STRENGTH_TABLE = {
    schwach: { attrMin: 0, attrMax: 2, hpMin: 60, hpMax: 120, iniMin: 0, iniMax: 2, atMin: 1, atMax: 4 },
    mittel:  { attrMin: 2, attrMax: 4, hpMin: 80, hpMax: 140, iniMin: 2, iniMax: 5, atMin: 4, atMax: 13 },
    stark:   { attrMin: 5, attrMax: 7, hpMin: 100, hpMax: 160, iniMin: 6, iniMax: 8, atMin: 10, atMax: 16 },
    boss:    { attrMin: 7, attrMax: 10, hpMin: 180, hpMax: 300, iniMin: 7, iniMax: 10, atMin: 12, atMax: 22 },
};

const CREATURE_TYPE_OPTIONS = ['humanoid', 'bestie', 'dämon', 'untoter', 'geist', 'drache', 'elementar'];

const WEAPON_PROPERTY_KEYS = [
    'Wuchtwaffe', 'Fernkampfoption', 'Parierwaffe', 'Reichweite', 'Präzision',
    'Schild', 'Zweihand', 'Wurfspeer', 'Armbrust', 'Kugel', 'Pfeil', 'Bolzen',
];

const ATTRIBUTE_KEYS = ['MU', 'KL', 'IN', 'CH', 'FF', 'GE', 'KO', 'KK'];

/**
 * Refresh the vorteile cache from the Ilaris system compendium
 * @returns {Promise<number>} Number of vorteile cached
 */
export async function refreshVorteileCache() {
    try {
        const pack = game.packs.get('Ilaris.vorteile');
        if (!pack) {
            console.warn('Ilaris Alternative Actor Sheet | Vorteile compendium not found');
            return 0;
        }

        const index = await pack.getIndex();
        const filtered = {};

        for (const entry of index) {
            const document = await pack.getDocument(entry._id);
            const category = document.system?.kategorie;
            if (category && CREATURE_RELEVANT_VORTEIL_CATEGORIES.includes(category)) {
                if (!filtered[category]) filtered[category] = [];
                filtered[category].push(document.name);
            }
        }

        const json = JSON.stringify(filtered);
        await game.settings.set('ilaris-alternative-actor-sheet', 'vorteileCache', json);

        const total = Object.values(filtered).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`Ilaris Alternative Actor Sheet | Vorteile cache updated: ${total} entries`);
        return total;
    } catch (err) {
        console.error('Ilaris Alternative Actor Sheet | Failed to refresh vorteile cache', err);
        return 0;
    }
}

/**
 * Build the system prompt for creature generation
 * @param {string} userDescription - Natural language description from the user
 * @param {string} strength - Strength tier (schwach/mittel/stark/boss)
 * @param {number} count - Number of creatures to generate
 * @param {string} type - Creature type filter
 * @returns {string} The complete system prompt
 */
export function buildCreaturePrompt(userDescription, strength, count, type) {
    const strengthConfig = STRENGTH_TABLE[strength] || STRENGTH_TABLE.mittel;
    const vorteileJson = game.settings.get('ilaris-alternative-actor-sheet', 'vorteileCache') || '{}';

    // Filter type if not "beliebig"
    const typeConstraint = type && type !== 'beliebig'
        ? `Creature type MUST be "${type}".`
        : `Creature type from: ${CREATURE_TYPE_OPTIONS.join(', ')}.`;

    return `You are a creature generator for the Ilaris TTRPG system.
Output ONLY a JSON array, no markdown, no explanation.

${typeConstraint}
Strength tier: ${strength}
Number of creatures: ${count}

JSON SCHEMA (each creature):
{
  "name": "Creature Name",
  "system": {
    "kreaturentyp": "humanoid",
    "attribute": {
      "MU": {"pw": N}, "KL": {"pw": N}, "IN": {"pw": N}, "CH": {"pw": N},
      "FF": {"pw": N}, "GE": {"pw": N}, "KO": {"pw": N}, "KK": {"pw": N}
    },
    "kampfwerte": {"ws": N, "ini": N, "gs": N, "mr": N},
    "kurzbeschreibung": "Brief description",
    "vorteile": ["VorteilName"],
    "angriffe": [{"name": "Weapon", "at": N, "vt": N, "tp": "NWN+N", "rw": N, "eigenschaften": []}]
  }
}

STRENGTH RANGES (${strength}):
| Field        | Min | Max |
|-------------|-----|-----|
| Attributes  | ${strengthConfig.attrMin} | ${strengthConfig.attrMax} |
| HP (ws)     | ${strengthConfig.hpMin} | ${strengthConfig.hpMax} |
| INI         | ${strengthConfig.iniMin} | ${strengthConfig.iniMax} |
| AT / VT     | ${strengthConfig.atMin} | ${strengthConfig.atMax} |
| GS          | 1 | 8 |
| MR          | 0 | 12 |

DAMAGE FORMULA: "1W6+2", "2W6", "1W6+4" (NW+N format only).
RW (Reichweite): melee weapons 0-2, thrown weapons (Wurfwaffen) 4-16, ranged weapons (bows/guns) 16-64.
WEAPON PROPERTIES (eigenschaften): ${WEAPON_PROPERTY_KEYS.join(', ')}.
VORTEILE (by category, use EXACT names): ${vorteileJson}

EXAMPLE (mittel humanoid):
[{"name":"Goblin-Krieger","system":{"kreaturentyp":"humanoid","attribute":{"MU":{"pw":12},"KL":{"pw":10},"IN":{"pw":11},"CH":{"pw":9},"FF":{"pw":13},"GE":{"pw":13},"KO":{"pw":12},"KK":{"pw":11}},"kampfwerte":{"ws":30,"ini":11,"gs":6,"mr":3},"kurzbeschreibung":"Ein kleiner, agiler Goblin mit Kurzschwert.","angriffe":[{"name":"Kurzschwert","at":13,"vt":11,"tp":"1W6+2","rw":0,"eigenschaften":[]}]}}]

EXAMPLE (stark bestie):
[{"name":"Höhlenbär","system":{"kreaturentyp":"bestie","attribute":{"MU":{"pw":16},"KL":{"pw":6},"IN":{"pw":8},"CH":{"pw":6},"FF":{"pw":10},"GE":{"pw":12},"KO":{"pw":18},"KK":{"pw":18}},"kampfwerte":{"ws":55,"ini":14,"gs":6,"mr":6},"kurzbeschreibung":"Ein massiver Bär mit gewaltigen Pranken.","angriffe":[{"name":"Prankenhieb","at":15,"vt":12,"tp":"2W6+2","rw":0,"eigenschaften":["Wuchtwaffe"]}]}}]

User request: ${userDescription}`;
}

/**
 * Call the DeepSeek API
 * @param {string} prompt - The system prompt
 * @param {string} apiKey - DeepSeek API key
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function callDeepSeekApi(prompt, apiKey) {
    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: DEEPSEEK_MODEL,
                messages: [
                    { role: 'user', content: prompt },
                ],
                temperature: 0.8,
                max_tokens: 4096,
            }),
        });

        if (response.status === 401) {
            return { success: false, error: 'Ungültiger API-Key. Bitte in den Moduleinstellungen prüfen.' };
        }
        if (response.status === 429) {
            return { success: false, error: 'API-Limit erreicht. Bitte später erneut versuchen.' };
        }
        if (!response.ok) {
            const text = await response.text();
            return { success: false, error: `API-Fehler (${response.status}): ${text}` };
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
            return { success: false, error: 'Leere API-Antwort erhalten.' };
        }

        return { success: true, data: { content } };
    } catch (err) {
        return { success: false, error: `Netzwerkfehler: ${err.message}` };
    }
}

/**
 * Parse AI response text to creature data array
 * @param {string} responseText - Raw response from the AI
 * @returns {object[]|null} Parsed creature array or null on failure
 */
export function parseAiCreatureResponse(responseText) {
    try {
        // Try direct parse first
        const parsed = JSON.parse(responseText);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') return [parsed];
        return null;
    } catch {
        // Try extracting from markdown code blocks
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1].trim());
                if (Array.isArray(parsed)) return parsed;
                if (parsed && typeof parsed === 'object') return [parsed];
            } catch { /* continue */ }
        }

        // Try finding a JSON array anywhere in the text
        const arrayMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (arrayMatch) {
            try {
                return JSON.parse(arrayMatch[0]);
            } catch { /* continue */ }
        }

        return null;
    }
}

/**
 * Validate and clamp a single creature's data
 * @param {object} creature - Raw creature data from AI
 * @returns {object} Validated and clamped creature data
 */
export function validateAndClampCreature(creature) {
    const vorteileJson = game.settings.get('ilaris-alternative-actor-sheet', 'vorteileCache') || '{}';
    let cachedVorteile;
    try {
        cachedVorteile = JSON.parse(vorteileJson);
    } catch {
        cachedVorteile = {};
    }
    const allCachedNames = Object.values(cachedVorteile).flat();

    // Clamp helper
    const clamp = (val, min, max, fallback) => {
        const n = Number(val);
        if (isNaN(n)) return fallback;
        return Math.max(min, Math.min(max, n));
    };

    const system = creature.system || {};

    // Clamp attributes
    const attributes = {};
    for (const key of ATTRIBUTE_KEYS) {
        const attr = (system.attribute && system.attribute[key]) || {};
        attributes[key] = { pw: clamp(attr.pw, 0, 10, 4) };
    }

    // Clamp Kampfwerte
    const kw = system.kampfwerte || {};
    const kampfwerte = {
        ws: clamp(kw.ws, 50, 300, 80),
        ini: clamp(kw.ini, 0, 10, 4),
        gs: clamp(kw.gs, 1, 20, 6),
        mr: clamp(kw.mr, 0, 20, 4),
    };

    // Validate damage formulas
    const damageRegex = /^\d+W\d+(\+\d+)?$/;
    const angriffe = (system.angriffe || []).map(a => {
        const eigenschaften = (a.eigenschaften || []).filter(e => WEAPON_PROPERTY_KEYS.includes(e));
        const isRanged = eigenschaften.some(e => ['Armbrust', 'Kugel', 'Pfeil', 'Bolzen'].includes(e)) || a.rw > 2;
        const isThrown = eigenschaften.includes('Wurfspeer') || (a.name && /wurf/i.test(a.name));
        const rw = clamp(a.rw, isThrown ? 4 : isRanged ? 16 : 0, isThrown ? 16 : isRanged ? 64 : 2, isRanged ? 16 : 0);
        return {
            name: a.name || 'Angriff',
            at: clamp(a.at, 0, 22, 10),
            vt: clamp(a.vt, 0, 22, 8),
            tp: damageRegex.test(a.tp) ? a.tp : '1W6',
            rw,
            eigenschaften,
        };
    });

    // Validate vorteile against cache
    const vorteile = (system.vorteile || [])
        .filter(v => allCachedNames.includes(v));
    const droppedVorteile = (system.vorteile || []).filter(v => !allCachedNames.includes(v));
    if (droppedVorteile.length > 0) {
        console.warn('Ilaris Alternative Actor Sheet | Dropped invalid vorteile:', droppedVorteile);
    }

    return {
        name: creature.name || 'Unbenannte Kreatur',
        type: 'kreatur',
        system: {
            kreaturentyp: CREATURE_TYPE_OPTIONS.includes(system.kreaturentyp) ? system.kreaturentyp : 'humanoid',
            attribute: attributes,
            kampfwerte,
            kurzbeschreibung: system.kurzbeschreibung || '',
            vorteile,
        },
        angriffe,
    };
}
