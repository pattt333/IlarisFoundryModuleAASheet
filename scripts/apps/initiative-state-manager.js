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
                kombinierteAktion: savedState.kombinierteAktion ?? false,
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
            kombinierteAktion: savedState.kombinierteAktion ?? false,
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
            kombinierteAktion: state.kombinierteAktion,
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
            kombinierteAktion: false,
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
     * Load available actions from compendium.
     * Computes iniMod from each action's effects.
     * @returns {Promise<Object[]>} Array of action objects with id, name, img, iniMod, effects
     */
    static async loadAvailableActions() {
        const actions = [];

        try {
            const pack = game.packs.get('ilaris-alternative-actor-sheet.nenneke-aktionen');
            if (pack) {
                const documents = await pack.getDocuments();
                for (const item of documents) {
                    actions.push({
                        id: item._id,
                        name: item.name,
                        description: item.system?.description ?? '',
                        img: item.img,
                        source: 'compendium',
                        uuid: item.uuid,
                        effects: item.effects?.contents ?? [],
                        iniMod: 0,
                    });
                }
            }
        } catch (error) {
            console.warn('InitiativeStateManager | Could not load actions compendium:', error);
        }

        // Compute INI modifier from each action's effects
        for (const action of actions) {
            if (action?.effects) {
                for (const effect of action.effects) {
                    const iniChange = effect.changes?.find(
                        c => c.key === 'system.abgeleitete.ini' || c.key === 'system.kampfwerte.ini' || c.key.includes('ini')
                    );
                    if (iniChange) {
                        action.iniMod = parseInt(iniChange.value) || 0;
                    }
                }
            }
        }

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
     * Calculate AT/VT modifiers from selected actions' effects.
     * @param {string[]} actionIds - Selected action IDs
     * @param {Object[]} availableActions - Loaded actions array
     * @returns {{at: number, vt: number}}
     */
    static calculateActionModifiers(actionIds, availableActions) {
        let atMod = 0;
        let vtMod = 0;

        for (const actionId of actionIds) {
            const action = availableActions.find(a => a.id === actionId);
            if (action?.effects) {
                for (const effect of action.effects) {
                    for (const change of effect.changes || []) {
                        if (change.key === 'system.modifikatoren.nahkampfmod' || change.key.includes('nahkampfmod')) {
                            atMod += parseInt(change.value) || 0;
                        }
                        if (
                            change.key === 'system.modifikatoren.verteidigungmod' ||
                            change.key.includes('verteidigungmod')
                        ) {
                            vtMod += parseInt(change.value) || 0;
                        }
                    }
                }
            }
        }

        return { at: atMod, vt: vtMod };
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

        return [
            { label: 'Basis', value: String(baseIni) },
            { label: 'Aktion', value: String(actionIniMod) },
            { label: 'Mod', value: String(state.iniMod) },
            { label: 'Würfel', value: state.hasRolled ? String(state.diceResults[state.selectedDiceIndex ?? 0] ?? '?') : '?' },
        ];
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
     * Build changes array for an ActiveEffect based on state.
     * @param {Object} state
     * @param {Actor} actor
     * @param {Object[]} availableActions
     * @returns {Object[]} Array of change objects for ActiveEffect
     */
    static buildEffectChanges(state, actor, availableActions) {
        const changes = [];
        const baseIni = InitiativeStateManager.getBaseInitiative(actor);
        const totalIni = InitiativeStateManager.calculateTotalInitiative(state, availableActions, actor);

        // Determine AT/VT modifiers
        let finalAtMod = state.atMod;
        let finalVtMod = state.vtMod;

        if (state.movedAction) {
            // LOCKED: use locked action's modifiers
            const lockedMods = InitiativeStateManager._getLockedActionModifiers(
                state.lockedActionId,
                availableActions
            );
            finalAtMod += lockedMods.at;
            finalVtMod += lockedMods.vt;
        } else {
            // FRESH: calculate from selected actions
            const actionMods = InitiativeStateManager.calculateActionModifiers(
                state.selectedActionIds,
                availableActions
            );
            finalAtMod += actionMods.at;
            finalVtMod += actionMods.vt;
            if (state.kombinierteAktion) {
                finalAtMod -= 4;
                finalVtMod -= 4;
            }
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
            duration: duration,
            origin: actor.uuid,
        };

        await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        return effectData;
    }

    /**
     * Get AT/VT modifiers from a locked action.
     * @param {string|null} lockedActionId
     * @param {Object[]} availableActions
     * @returns {{at: number, vt: number}}
     * @private
     */
    static _getLockedActionModifiers(lockedActionId, availableActions) {
        if (!lockedActionId) return { at: 0, vt: 0 };

        const action = availableActions.find(a => a.id === lockedActionId);
        if (!action?.effects) return { at: 0, vt: 0 };

        let atMod = 0;
        let vtMod = 0;

        for (const effect of action.effects) {
            for (const change of effect.changes || []) {
                if (change.key === 'system.modifikatoren.nahkampfmod' || change.key.includes('nahkampfmod')) {
                    atMod += parseInt(change.value) || 0;
                }
                if (
                    change.key === 'system.modifikatoren.verteidigungmod' ||
                    change.key.includes('verteidigungmod')
                ) {
                    vtMod += parseInt(change.value) || 0;
                }
            }
        }

        return { at: atMod, vt: vtMod };
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
            const { actor, totalIni, baseIni, iniMod, diceResult, actionIds, atMod, vtMod, isLocked } = data;

            // Build action names
            const actionNames = actionIds
                .map(id => availableActions.find(a => a.id === id)?.name)
                .filter(Boolean)
                .join(', ');

            // Build compact formula
            const actionIniMod = actionIds.length > 0
                ? Math.min(...actionIds.map(id => availableActions.find(a => a.id === id)?.iniMod ?? 0))
                : 0;
            const formula = `${baseIni} + (${actionIniMod}) + ${iniMod} + ${diceResult}`;

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
        const atMod = state.atMod + actionMods.at + (state.kombinierteAktion ? -4 : 0);
        const vtMod = state.vtMod + actionMods.vt + (state.kombinierteAktion ? -4 : 0);

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
}
