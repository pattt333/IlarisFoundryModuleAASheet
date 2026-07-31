/**
 * Initiative State Manager
 *
 * Shared logic for initiative dialogs (PC and mass NPC).
 * Handles state persistence, initiative calculation, dice rolling,
 * action modifiers, active effects, and chat messages.
 *
 * Both InitiativeDialog (single PC) and MassInitiativeDialog (multi NPC)
 * compose this manager instead of duplicating logic.
 */
export class InitiativeStateManager {
    /* -------------------------------------------- */
    /*  State Persistence                            */
    /* -------------------------------------------- */

    /**
     * Load persisted dialog state from actor flags.
     * @param {Actor} actor
     * @returns {Object} Structured state object with defaults
     */
    static loadState(actor) {
        const savedState = actor.getFlag('ilaris-alternative-actor-sheet', 'dialogState');

        if (!savedState) {
            return InitiativeStateManager._defaultState();
        }

        // Migration: detect old-format state (missing carryOver field)
        if (savedState.carryOver === undefined && savedState.movedAction) {
            const baseIni = InitiativeStateManager.getBaseInitiative(actor);
            return {
                ...InitiativeStateManager._defaultState(),
                iniMod: savedState.iniMod ?? 0,
                atMod: savedState.atMod ?? 0,
                vtMod: savedState.vtMod ?? 0,
                selectedActionIds: savedState.selectedActionIds ?? [],
                diceCount: savedState.diceCount ?? 1,
                diceResults: savedState.diceResults ?? [],
                selectedDiceIndex: savedState.selectedDiceIndex ?? null,
                hasRolled: savedState.hasRolled ?? false,
                movedAction: savedState.movedAction ?? false,
                movedActionRounds: savedState.movedActionRounds ?? 1,
                carryOver: (savedState.movedActionRounds || 1) * baseIni,
                lockedActionId: savedState.selectedActionIds?.[0] ?? null,
            };
        }

        return {
            iniMod: savedState.iniMod ?? 0,
            atMod: savedState.atMod ?? 0,
            vtMod: savedState.vtMod ?? 0,
            selectedActionIds: savedState.selectedActionIds ?? [],
            selectedWeaponId: savedState.selectedWeaponId ?? '',
            diceCount: savedState.diceCount ?? 1,
            diceResults: savedState.diceResults ?? [],
            selectedDiceIndex: savedState.selectedDiceIndex ?? null,
            hasRolled: savedState.hasRolled ?? false,
            movedAction: savedState.movedAction ?? false,
            movedActionRounds: savedState.movedActionRounds ?? 0,
            carryOver: savedState.carryOver ?? 0,
            lockedActionId: savedState.lockedActionId ?? null,
            lockedWeaponId: savedState.lockedWeaponId ?? null,
        };
    }

    /**
     * Persist state to actor flags.
     * @param {Actor} actor
     * @param {Object} state
     */
    static async persistState(actor, state) {
        await actor.setFlag('ilaris-alternative-actor-sheet', 'dialogState', {
            iniMod: state.iniMod,
            atMod: state.atMod,
            vtMod: state.vtMod,
            selectedActionIds: state.selectedActionIds,
            selectedWeaponId: state.selectedWeaponId ?? '',
            diceCount: state.diceCount,
            diceResults: state.diceResults,
            selectedDiceIndex: state.selectedDiceIndex,
            hasRolled: state.hasRolled,
            movedAction: state.movedAction,
            movedActionRounds: state.movedActionRounds,
            carryOver: state.carryOver,
            lockedActionId: state.lockedActionId,
            lockedWeaponId: state.lockedWeaponId ?? null,
        });
    }

    /**
     * Clear persisted state from actor flags.
     * @param {Actor} actor
     */
    static async clearState(actor) {
        await actor.unsetFlag('ilaris-alternative-actor-sheet', 'dialogState');
    }

    /**
     * Get default state object.
     * @returns {Object}
     * @private
     */
    static _defaultState() {
        return {
            iniMod: 0,
            atMod: 0,
            vtMod: 0,
            selectedActionIds: [],
            selectedWeaponId: '',
            diceCount: 1,
            diceResults: [],
            selectedDiceIndex: null,
            hasRolled: false,
            movedAction: false,
            movedActionRounds: 0,
            carryOver: 0,
            lockedActionId: null,
            lockedWeaponId: null,
        };
    }

    /* -------------------------------------------- */
    /*  Base Initiative                              */
    /* -------------------------------------------- */

    /**
     * Get base initiative for an actor.
     * PC (held) uses system.abgeleitete.baseIni.
     * NPC (kreatur) uses system.kampfwerte.ini.
     * @param {Actor} actor
     * @returns {number}
     */
    static getBaseInitiative(actor) {
        if (actor.type === 'held') {
            return actor.system.abgeleitete?.baseIni ?? 0;
        } else if (actor.type === 'kreatur') {
            return actor.system.kampfwerte?.ini ?? 0;
        }
        return 0;
    }

    /* -------------------------------------------- */
    /*  Action Loading                               */
    /* -------------------------------------------- */

    /**
     * Load available aktion items from actor items, world items, and all world compendiums.
     * Deduplicates by name with priority: actor > world > compendium.
     * Uses typed access: item.system.iniMod, .atMod, .vtMod, .aktionstyp, .bedingungen
     * @param {Actor} [actor] - Optional actor to include actor-specific aktion items
     * @returns {Promise<Object[]>} Array of action objects with typed fields
     */
    static async loadAvailableActions(actor) {
        const actionMap = new Map();

        // Priority 3: All world compendiums of type Item
        for (const pack of game.packs) {
            if (pack.metadata.type !== 'Item') continue;
            try {
                const index = await pack.getIndex();
                const aktionEntries = index.filter(e => e.type === 'aktion');
                if (aktionEntries.length === 0) continue;

                const documents = await pack.getDocuments();
                for (const item of documents) {
                    if (item.type !== 'aktion') continue;
                    if (!actionMap.has(item.name)) {
                        actionMap.set(item.name, {
                            id: item._id,
                            name: item.name,
                            text: item.system?.text ?? '',
                            img: item.img,
                            source: 'compendium',
                            uuid: item.uuid,
                            iniMod: item.system?.iniMod ?? 0,
                            atMod: item.system?.atMod ?? 0,
                            vtMod: item.system?.vtMod ?? 0,
                            aktionstyp: item.system?.aktionstyp ?? 'einfach',
                            bedingungen: item.system?.bedingungen ?? { waffentyp: '', eigenschaften: [] },
                        });
                    }
                }
            } catch (error) {
                console.warn(`InitiativeStateManager | Could not load from pack ${pack.metadata.id}:`, error);
            }
        }

        // Priority 2: World items (game.items)
        for (const item of game.items) {
            if (item.type !== 'aktion') continue;
            actionMap.set(item.name, {
                id: item._id,
                name: item.name,
                text: item.system?.text ?? '',
                img: item.img,
                source: 'world',
                uuid: item.uuid,
                iniMod: item.system?.iniMod ?? 0,
                atMod: item.system?.atMod ?? 0,
                vtMod: item.system?.vtMod ?? 0,
                aktionstyp: item.system?.aktionstyp ?? 'einfach',
                bedingungen: item.system?.bedingungen ?? { waffentyp: '', eigenschaften: [] },
            });
        }

        // Priority 1 (highest): Actor items
        if (actor) {
            const actorActions = actor.items.filter(i => i.type === 'aktion');
            for (const item of actorActions) {
                actionMap.set(item.name, {
                    id: item._id,
                    name: item.name,
                    text: item.system?.text ?? '',
                    img: item.img,
                    source: 'actor',
                    uuid: item.uuid,
                    iniMod: item.system?.iniMod ?? 0,
                    atMod: item.system?.atMod ?? 0,
                    vtMod: item.system?.vtMod ?? 0,
                    aktionstyp: item.system?.aktionstyp ?? 'einfach',
                    bedingungen: item.system?.bedingungen ?? { waffentyp: '', eigenschaften: [] },
                });
            }
        }

        const actions = Array.from(actionMap.values());

        console.log(
            'InitiativeStateManager | Loaded actions:',
            actions.map(a => ({ name: a.name, aktionstyp: a.aktionstyp, iniMod: a.iniMod }))
        );

        return actions;
    }

    /* -------------------------------------------- */
    /*  Initiative Calculation                       */
    /* -------------------------------------------- */

    /**
     * Calculate total initiative value.
     * LOCKED state: carryOver + baseIni + iniMod + diceResult.
     * FRESH state: baseIni + actionIniMod + iniMod + diceResult.
     * @param {Object} state - The NPC/PC state object
     * @param {Object[]} availableActions - Loaded actions array
     * @param {Actor} actor - The actor (for getBaseInitiative)
     * @param {number} [weaponIniMod=0] - Weapon INI modifier (PC only)
     * @returns {number}
     */
    static calculateTotalInitiative(state, availableActions, actor, weaponIniMod = 0) {
        const baseIni = InitiativeStateManager.getBaseInitiative(actor);

        const diceResult =
            state.selectedDiceIndex !== null
                ? (state.diceResults[state.selectedDiceIndex] ?? 0)
                : (state.diceResults[0] ?? 0);

        // LOCKED state: carryOver + baseIni + iniMod + diceResult
        if (state.movedAction) {
            return (state.carryOver ?? 0) + baseIni + state.iniMod + diceResult;
        }

        // FRESH state: baseIni + actionIniMod + weaponIniMod + iniMod + diceResult
        let actionIniMod = 0;
        if (state.selectedActionIds.length > 0) {
            const mods = state.selectedActionIds.map(id => {
                const action = availableActions.find(a => a.id === id);
                return action?.iniMod ?? 0;
            });
            actionIniMod = Math.min(...mods);
        }

        return baseIni + actionIniMod + weaponIniMod + state.iniMod + diceResult;
    }

    /**
     * Calculate AT/VT modifiers from selected actions' typed data.
     * @param {string[]} actionIds - Selected action IDs
     * @param {Object[]} availableActions - Loaded actions array
     * @returns {{at: number, vt: number}}
     */
    static calculateActionModifiers(actionIds, availableActions) {
        let atMod = 0;
        let vtMod = 0;

        for (const actionId of actionIds) {
            const action = availableActions.find(a => a.id === actionId);
            if (action) {
                atMod += action.atMod ?? 0;
                vtMod += action.vtMod ?? 0;
            }
        }

        return { at: atMod, vt: vtMod };
    }

    /**
     * Derive combination state from selected actions' aktionstyp.
     * @param {string[]} actionIds - Selected action IDs
     * @param {Object[]} availableActions - Loaded actions array
     * @returns {{isCombined: boolean, malus: number}}
     */
    static deriveCombination(actionIds, availableActions) {
        if (actionIds.length < 2) return { isCombined: false, malus: 0 };

        const selected = actionIds.map(id => availableActions.find(a => a.id === id)).filter(Boolean);
        const allEinfach = selected.every(a => a.aktionstyp === 'einfach');

        return {
            isCombined: allEinfach,
            malus: allEinfach ? -4 : 0,
        };
    }

    /**
     * Build formula parts array for tooltip/display.
     * @param {Object} state
     * @param {Object[]} availableActions
     * @param {Actor} actor
     * @param {number} [weaponIniMod=0]
     * @returns {{label: string, value: string}[]}
     */
    static getFormulaParts(state, availableActions, actor, weaponIniMod = 0) {
        const baseIni = InitiativeStateManager.getBaseInitiative(actor);

        if (state.movedAction) {
            return [
                { label: 'Übertrag', value: String(state.carryOver ?? 0) },
                { label: 'Basis', value: String(baseIni) },
                { label: 'Mod', value: String(state.iniMod) },
                { label: 'Würfel', value: state.hasRolled ? String(state.diceResults[state.selectedDiceIndex ?? 0] ?? '?') : '?' },
            ];
        }

        let actionIniMod = 0;
        if (state.selectedActionIds.length > 0) {
            const mods = state.selectedActionIds.map(id => {
                const action = availableActions.find(a => a.id === id);
                return action?.iniMod ?? 0;
            });
            actionIniMod = Math.min(...mods);
        }

        const hasWeaponReq = InitiativeStateManager.hasWeaponRequiredAction(
            state.selectedActionIds,
            availableActions
        );

        const parts = [
            { label: 'Basis', value: String(baseIni) },
            { label: 'Aktion', value: String(actionIniMod) },
        ];

        if (hasWeaponReq && weaponIniMod !== 0) {
            parts.push({ label: 'Waffe', value: String(weaponIniMod) });
        }

        parts.push({ label: 'Mod', value: String(state.iniMod) });
        parts.push({ label: 'Würfel', value: state.hasRolled ? String(state.diceResults[state.selectedDiceIndex ?? 0] ?? '?') : '?' });

        return parts;
    }

    /* -------------------------------------------- */
    /*  Dice Rolling                                 */
    /* -------------------------------------------- */

    /**
     * Roll a number of d6 dice.
     * @param {number} [count=1]
     * @returns {Promise<number[]>} Array of dice results
     */
    static async rollDice(count = 1) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const roll = await new Roll('1d6').evaluate();
            results.push(roll.total);
        }
        return results;
    }

    /* -------------------------------------------- */
    /*  Active Effect Management                     */
    /* -------------------------------------------- */

    /**
     * Build changes array for an ActiveEffect based on state with typed aktion data.
     * @param {Object} state
     * @param {Actor} actor
     * @param {Object[]} availableActions
     * @returns {Object[]} Array of change objects for ActiveEffect
     */
    static buildEffectChanges(state, actor, availableActions) {
        const changes = [];
        const baseIni = InitiativeStateManager.getBaseInitiative(actor);
        const totalIni = InitiativeStateManager.calculateTotalInitiative(state, availableActions, actor);

        // Determine AT/VT modifiers from typed aktion data
        let finalAtMod = state.atMod;
        let finalVtMod = state.vtMod;

        if (state.movedAction) {
            // LOCKED: use locked action's typed modifiers
            const lockedMods = InitiativeStateManager._getLockedActionModifiers(
                state.lockedActionId,
                availableActions
            );
            finalAtMod += lockedMods.at;
            finalVtMod += lockedMods.vt;
        } else {
            // FRESH: calculate from selected actions' typed data
            const actionMods = InitiativeStateManager.calculateActionModifiers(
                state.selectedActionIds,
                availableActions
            );
            finalAtMod += actionMods.at;
            finalVtMod += actionMods.vt;

            // Auto-derived combination malus
            const { malus } = InitiativeStateManager.deriveCombination(
                state.selectedActionIds,
                availableActions
            );
            finalAtMod += malus;
            finalVtMod += malus;
        }

        // INI delta
        const iniDelta = totalIni - baseIni;
        if (iniDelta !== 0) {
            const iniKey = actor.type === 'kreatur' ? 'system.kampfwerte.ini' : 'system.abgeleitete.ini';
            changes.push({
                key: iniKey,
                mode: "add",
                value: iniDelta.toString(),
            });
        }

        if (finalAtMod !== 0) {
            changes.push({
                key: 'system.modifikatoren.nahkampfmod',
                mode: "add",
                value: finalAtMod.toString(),
            });
        }

        if (finalVtMod !== 0) {
            changes.push({
                key: 'system.modifikatoren.verteidigungmod',
                mode: "add",
                value: finalVtMod.toString(),
            });
        }

        return changes;
    }

    /**
     * Create combat modifier effect for an actor.
     * Deletes existing effect with same name first.
     * @param {Actor} actor
     * @param {Object} state
     * @param {number} combatRound
     * @param {Object[]} availableActions
     * @returns {Promise<Object>} The created effect data
     */
    static async createCombatEffects(actor, state, combatRound, availableActions) {
        const effectName = `Kampf-Modifikatoren Runde ${combatRound}`;
        const changes = InitiativeStateManager.buildEffectChanges(state, actor, availableActions);

        // Remove existing effect with same name
        const existingEffect = actor.effects.find(e => e.name === effectName);
        if (existingEffect) {
            await actor.deleteEmbeddedDocuments('ActiveEffect', [existingEffect.id]);
        }

        if (changes.length === 0) return null;

        const totalIni = InitiativeStateManager.calculateTotalInitiative(state, availableActions, actor);
        const duration = totalIni < 0 ? { turns: 2 } : { turns: 1 };

        const effectData = {
            name: effectName,
            icon: 'icons/svg/dice-target.svg',
            changes: changes,
            system: {
                ilarisTiming: {
                    durationType: 'ownerTurns',
                    remaining: 1,
                    originalValue: 1,
                    expiresOn: 'turnEnd',
                }
            },
            origin: actor.uuid,
        };

        await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        return effectData;
    }

    /**
     * Get AT/VT modifiers from a locked action using typed data.
     * @param {string|null} lockedActionId
     * @param {Object[]} availableActions
     * @returns {{at: number, vt: number}}
     * @private
     */
    static _getLockedActionModifiers(lockedActionId, availableActions) {
        if (!lockedActionId) return { at: 0, vt: 0 };

        const action = availableActions.find(a => a.id === lockedActionId);
        if (!action) return { at: 0, vt: 0 };

        return {
            at: action.atMod ?? 0,
            vt: action.vtMod ?? 0,
        };
    }

    /* -------------------------------------------- */
    /*  Chat Messages                                */
    /* -------------------------------------------- */

    /**
     * Post a single summary chat message for all NPC initiatives.
     * @param {Object[]} combatData - Array of { actor, totalIni, baseIni, iniMod, diceResult, actionIds, atMod, vtMod, isLocked }
     * @param {number} round - Combat round number
     * @param {Object[]} availableActions - Loaded actions for name resolution
     */
    static async postSummaryChatMessage(combatData, round, availableActions) {
        if (combatData.length === 0) return;

        let content = `<h3><i class="fas fa-users"></i> NPC Initiative — Runde ${round}</h3>`;
        content += '<table style="width:100%; border-collapse: collapse;">';
        content += '<thead><tr>';
        content += '<th style="text-align:left; padding:4px 8px;">NPC</th>';
        content += '<th style="text-align:right; padding:4px 8px;">INI</th>';
        content += '<th style="text-align:left; padding:4px 8px;">Formel</th>';
        content += '</tr></thead><tbody>';

        for (const data of combatData) {
            const { actor, totalIni, baseIni, iniMod, diceResult, actionIds, atMod, vtMod, isLocked, weaponName } = data;

            // Build action names
            const actionNames = actionIds
                .map(id => availableActions.find(a => a.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Build compact formula
            const actionIniMod = actionIds.length > 0
                ? Math.min(...actionIds.map(id => availableActions.find(a => a.id === id)?.iniMod ?? 0))
                : 0;
            const formulaParts = [`${baseIni}`, `(${actionIniMod})`, `${iniMod}`, `${diceResult}`];
            const formula = formulaParts.join(' + ');

            const lockIcon = isLocked ? ' 🔒' : '';

            content += '<tr>';
            content += `<td style="padding:4px 8px;"><img src="${actor.img}" alt="" width="24" height="24" style="border:none; vertical-align:middle; margin-right:6px;"/>${actor.name}${lockIcon}</td>`;
            content += `<td style="text-align:right; padding:4px 8px; font-weight:bold;">${totalIni}</td>`;
            content += `<td style="padding:4px 8px; font-size:0.85em; color:var(--color-text-soft);">${formula}</td>`;
            content += '</tr>';

            if (actionNames) {
                content += `<tr><td colspan="3" style="padding:0 8px 4px 36px; font-size:0.78em; color:var(--color-text-muted);">Aktionen: ${actionNames}</td></tr>`;
            }
        }

        content += '</tbody></table>';

        await ChatMessage.create({
            content: content,
            speaker: ChatMessage.getSpeaker({ actor: combatData[0].actor }),
        });
    }

    /**
     * Post an individual chat message for a single actor (PC or NPC).
     * @param {Actor} actor
     * @param {Object} state
     * @param {Object[]} availableActions
     * @param {number} combatRound
     */
    static async postIndividualChatMessage(actor, state, availableActions, combatRound) {
        const baseIni = InitiativeStateManager.getBaseInitiative(actor);
        const totalIni = InitiativeStateManager.calculateTotalInitiative(state, availableActions, actor);
        const diceResult =
            state.selectedDiceIndex !== null
                ? (state.diceResults[state.selectedDiceIndex] ?? 0)
                : (state.diceResults[0] ?? 0);

        // Build action names
        const actionNames = state.selectedActionIds
            .map(id => availableActions.find(a => a.id === id)?.name)
            .filter(Boolean);

        let content = `<img src="${actor.img}" alt="${actor.name}" width="36" height="36" style="border: none; vertical-align: middle; margin-right: 8px;"/>`;
        content += `<strong>${actor.name}</strong> Initiative: ${totalIni} (Basis: ${baseIni}, Mod: ${state.iniMod >= 0 ? '+' : ''}${state.iniMod}, Würfel: ${diceResult})`;

        if (actionNames.length > 0) {
            content += `<br>Aktionen: ${actionNames.join(', ')}`;
        }

        const actionMods = InitiativeStateManager.calculateActionModifiers(
            state.selectedActionIds,
            availableActions
        );
        const { malus: combinationMalus } = InitiativeStateManager.deriveCombination(
            state.selectedActionIds,
            availableActions
        );
        const atMod = state.atMod + actionMods.at + combinationMalus;
        const vtMod = state.vtMod + actionMods.vt + combinationMalus;

        if (atMod !== 0 || vtMod !== 0) {
            const modifiers = [];
            if (atMod !== 0) modifiers.push(`AT ${atMod >= 0 ? '+' : ''}${atMod}`);
            if (vtMod !== 0) modifiers.push(`VT ${vtMod >= 0 ? '+' : ''}${vtMod}`);
            content += `<br>Modifikatoren: ${modifiers.join(', ')}`;
        }

        await ChatMessage.create({
            content: content,
            speaker: ChatMessage.getSpeaker({ actor: actor }),
        });
    }

    /* -------------------------------------------- */
    /*  Weapon / Angriff                             */
    /* -------------------------------------------- */

    /**
     * Load available weapons/Angriffe for an actor.
     * For held (PC): loads nahkampfwaffe/fernkampfwaffe items with hauptwaffe/nebenwaffe.
     * For kreatur (NPC): normalizes system.angriffe to virtual weapon shape.
     * @param {Actor} actor
     * @returns {Object[]} Array of weapon/Angriff objects with {id, name, type, system}
     */
    static loadAvailableWeapons(actor) {
        if (actor.type === 'held') {
            return InitiativeStateManager._loadPcWeapons(actor);
        } else if (actor.type === 'kreatur') {
            return InitiativeStateManager._loadNpcAngriffe(actor);
        }
        return [];
    }

    /**
     * Load PC weapons from actor items.
     * @param {Actor} actor
     * @returns {Object[]}
     * @private
     */
    static _loadPcWeapons(actor) {
        const weapons = [];
        const weaponItems = actor.items.filter(i => {
            if (i.type !== 'nahkampfwaffe' && i.type !== 'fernkampfwaffe') return false;
            return i.system?.hauptwaffe === true || i.system?.nebenwaffe === true;
        });

        for (const weapon of weaponItems) {
            weapons.push({
                id: weapon._id,
                name: weapon.name,
                img: weapon.img,
                type: weapon.type,    // 'nahkampfwaffe' or 'fernkampfwaffe'
                system: weapon.system,
            });
        }

        return weapons;
    }

    /**
     * Normalize NPC angriffe from system.angriffe to virtual weapon objects.
     * Infers nah/fern type from rw and eigenschaften.
     * @param {Actor} actor
     * @returns {Object[]}
     * @private
     */
    static _loadNpcAngriffe(actor) {
        const angriffe = actor.angriffe || [];
        console.log('InitiativeStateManager | Loading NPC Angriffe:', angriffe);
        return angriffe.map((a, index) => {
            console.log('InitiativeStateManager | Normalizing NPC Angriff:', a);
            const eigenschaften = a.eigenschaften || [];
            const melee = a.typ == 'Nah';
            return {
                id: `angriff-${index}`,
                name: a.name || 'Angriff',
                type: melee ? 'nahkampfwaffe' : 'fernkampfwaffe',
                system: { eigenschaften },
            };
        });
    }

    /**
     * Get the INI modifier from a weapon or Angriff.
     * For PC weapons: extracts from system.computed.actorModifiers (actionNegAugment/actionAugment on 'ini').
     * For NPC angriffe: returns 0 (no INI modifiers on angriffe).
     * @param {Object} weapon - Normalized weapon/Angriff object
     * @returns {number}
     */
    static getWeaponIniModifier(weapon) {
        if (!weapon) return 0;

        const hasModifiers = weapon.system?.computed?.hasActorModifiers === true;
        const actorModifiers = weapon.system?.computed?.actorModifiers;

        if (!hasModifiers || !actorModifiers) return 0;

        const modifiersArray = Object.values(actorModifiers);

        for (const modifier of modifiersArray) {
            if (modifier.property === 'ini') {
                if (modifier.mode === 'actionNegAugment') {
                    return -(modifier.value ?? 0);
                } else if (modifier.mode === 'actionAugment') {
                    return modifier.value ?? 0;
                }
            }
        }

        return 0;
    }

    /**
     * Check whether any selected action requires a weapon type.
     * @param {string[]} selectedActionIds
     * @param {Object[]} availableActions
     * @returns {boolean}
     */
    static hasWeaponRequiredAction(selectedActionIds, availableActions) {
        return selectedActionIds.some(id => {
            const action = availableActions.find(a => a.id === id);
            return action?.bedingungen?.waffentyp && action.bedingungen.waffentyp !== '';
        });
    }

    /* -------------------------------------------- */
    /*  Weapon Gating                                */
    /* -------------------------------------------- */

    /**
     * Apply weapon gating to available actions.
     * Marks non-matching actions with grayedOut and grayedOutReason.
     * Mutates the availableActions array in place.
     * @param {Object|null} weapon - Selected weapon/Angriff object (or null)
     * @param {Object[]} availableActions - Actions array to gate (mutated in place)
     */
    static applyWeaponGating(weapon, availableActions) {
        for (const action of availableActions) {
            action.grayedOut = false;
            action.grayedOutReason = '';

            if (!weapon) {
                // No weapon selected: gate out actions that require a weapon type
                if (action.bedingungen?.waffentyp && action.bedingungen.waffentyp !== '') {
                    action.grayedOut = true;
                    action.grayedOutReason = action.bedingungen.waffentyp === 'nahkampfwaffe'
                        ? 'Erfordert Nahkampfwaffe'
                        : 'Erfordert Fernkampfwaffe';
                }
                continue;
            }

            const weaponType = weapon.type;  // 'nahkampfwaffe' or 'fernkampfwaffe'
            const hasFernkampfoption = weapon.system?.eigenschaften?.some(
                e => (typeof e === 'string' ? e : e.key) === 'Fernkampfoption'
            );

            // Check waffentyp
            if (action.bedingungen?.waffentyp && action.bedingungen.waffentyp !== '') {
                let typeMatch = false;
                if (action.bedingungen.waffentyp === 'nahkampfwaffe') {
                    typeMatch = weaponType === 'nahkampfwaffe' || (weaponType === 'fernkampfwaffe' && hasFernkampfoption);
                } else if (action.bedingungen.waffentyp === 'fernkampfwaffe') {
                    typeMatch = weaponType === 'fernkampfwaffe' || (weaponType === 'nahkampfwaffe' && hasFernkampfoption);
                }
                if (!typeMatch) {
                    action.grayedOut = true;
                    action.grayedOutReason = action.bedingungen.waffentyp === 'nahkampfwaffe'
                        ? 'Erfordert Nahkampfwaffe'
                        : 'Erfordert Fernkampfwaffe';
                    continue;
                }
            }

            // Check eigenschaften
            if (action.bedingungen?.eigenschaften?.length > 0) {
                const weaponEigenschaften = (weapon.system?.eigenschaften || []).map(
                    e => (typeof e === 'string' ? e : e.key)
                );
                for (const required of action.bedingungen.eigenschaften) {
                    if (!weaponEigenschaften.includes(required)) {
                        action.grayedOut = true;
                        action.grayedOutReason = `Erfordert Eigenschaft: ${required}`;
                        break;
                    }
                }
            }
        }
    }
}
