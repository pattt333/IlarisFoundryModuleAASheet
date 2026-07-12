/**
 * Mass Initiative Dialog — Card-Grid Dashboard for NPCs
 *
 * Massen-Dialog für den GM zur Bearbeitung aller NPCs im Encounter.
 * Card-grid Interface mit Action Chips, visuellen Stati und Batch-Operationen.
 * Delegiert gemeinsame Logik an InitiativeStateManager.
 */
import { InitiativeStateManager } from './initiative-state-manager.js';

const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MassInitiativeDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(combat, npcCombatants, options = {}) {
        super(options);
        this.combat = combat;
        this.npcCombatants = npcCombatants;
        this.npcStates = new Map();
        this.availableActions = [];
        this.filterDefault = game.settings.get(
            'ilaris-alternative-actor-sheet',
            'massInitiativeFilterDefault'
        ) ?? false;

        // Initialize state for each NPC via StateManager
        for (const combatant of npcCombatants) {
            const state = InitiativeStateManager.loadState(combatant.actor);
            this.npcStates.set(combatant.id, state);
        }
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        tag: 'div',
        id: 'mass-initiative-dialog',
        classes: ['ilaris', 'mass-initiative-dialog'],
        position: { width: 900, height: 600 },
        window: {
            title: 'NPC Initiative',
            resizable: true,
        },
        actions: {
            iniAnsagen: MassInitiativeDialog.#onIniAnsagen,
            cancelIni: MassInitiativeDialog.#onCancel,
            rollAllDice: MassInitiativeDialog.#onRollAllDice,
            applyBatch: MassInitiativeDialog.#onBatchApply,
        },
    };

    /** @override */
    static PARTS = {
        form: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/mass-initiative-dialog.hbs',
        },
    };

    /** @override */
    get title() {
        return `NPC Initiative - Runde ${this.combat?.round ?? 1}`;
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Load available actions once
        if (this.availableActions.length === 0) {
            this.availableActions = await InitiativeStateManager.loadAvailableActions();
        }

        // Build NPC data for template, sorted alphabetically by name
        const npcs = [];
        const sortedCombatants = [...this.npcCombatants].sort((a, b) =>
            (a.actor?.name ?? a.name).localeCompare(b.actor?.name ?? b.name)
        );

        let processedCount = 0;

        for (const combatant of sortedCombatants) {
            const state = this.npcStates.get(combatant.id);
            const actor = combatant.actor;
            if (!state || !actor) continue;

            const baseIni = InitiativeStateManager.getBaseInitiative(actor);
            const totalIni = InitiativeStateManager.calculateTotalInitiative(
                state,
                this.availableActions,
                actor
            );
            const needsDiceSelection =
                state.diceCount === 2 && state.hasRolled && state.selectedDiceIndex === null;

            // Build action chips for display
            const actionChips = state.selectedActionIds.map(id => {
                const action = this.availableActions.find(a => a.id === id);
                return {
                    id: id,
                    name: action?.name ?? 'Unbekannt',
                    img: action?.img ?? '',
                    iniMod: action?.iniMod ?? 0,
                    isLocked: state.movedAction && id === state.lockedActionId,
                };
            });

            // Determine if NPC is processed
            const isProcessed = state.hasRolled && !needsDiceSelection;
            if (isProcessed) processedCount++;

            // Filter state
            const isFiltered =
                this.filterDefault && isProcessed && !state.movedAction;

            // Build dice data with selection state baked in (avoids Handlebars path issues)
            const diceData = state.hasRolled
                ? state.diceResults.map((value, i) => ({
                      value: value,
                      selected: state.selectedDiceIndex === i,
                      index: i,
                  }))
                : [];

            npcs.push({
                combatantId: combatant.id,
                actorId: actor?.id,
                name: actor?.name ?? combatant.name,
                img: actor?.img ?? combatant.img,
                baseIni: baseIni,
                state: state,
                totalIni: totalIni,
                actionChips: actionChips,
                diceData: diceData,
                needsDiceSelection: needsDiceSelection,
                isFiltered: isFiltered,
            });
        }

        context.npcs = npcs;
        context.availableActions = this.availableActions;
        context.round = this.combat?.round ?? 1;
        context.processedCount = processedCount;
        context.totalCount = this.npcCombatants.length;
        context.progressPercent =
            this.npcCombatants.length > 0
                ? Math.round((processedCount / this.npcCombatants.length) * 100)
                : 0;
        context.filterDefault = this.filterDefault;

        return context;
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        const el = this.element;

        // Dice rolling per NPC
        el.querySelectorAll('.roll-dice-btn').forEach(btn => {
            btn.addEventListener('click', event => this._onRollDice(event));
        });

        // Dice result selection
        el.querySelectorAll('.dice-results:not(.dice-placeholder) .dice-result').forEach(dr => {
            dr.addEventListener('click', event => this._onSelectDice(event));
        });

        // Multi-select action changes
        el.querySelectorAll('multi-select').forEach(ms => {
            ms.addEventListener('change', event => this._onActionsChange(event));
        });

        // Chip remove buttons
        el.querySelectorAll('.chip-remove').forEach(chip => {
            chip.addEventListener('click', event => this._onChipRemove(event));
        });

        // Filter toggle
        el.querySelector('.filter-toggle input')?.addEventListener('change', event => this._onFilterToggle(event));

        // Form change handling for modifier inputs
        el.querySelectorAll('input[type="number"], input[type="checkbox"], select.dice-count-select').forEach(input => {
            input.addEventListener('change', event => this._onFormChange(event));
        });

        // Tooltip hover for formula breakdown
        el.querySelectorAll('.result-info').forEach(info => {
            info.addEventListener('mouseenter', event => this._onTooltipShow(event));
            info.addEventListener('mouseleave', event => this._onTooltipHide(event));
        });
    }

    /* -------------------------------------------- */
    /*  Event Handlers                               */
    /* -------------------------------------------- */

    /**
     * Handle form changes for modifiers and dice count.
     * @param {Event} event
     * @private
     */
    async _onFormChange(event) {
        const element = event.currentTarget;
        const name = element.name;
        if (!name || name.startsWith('actions-')) return;

        const parts = name.split('-');
        if (parts.length < 2) return;

        const combatantId = parts[parts.length - 1];
        const fieldBase = parts.slice(0, -1).join('-');
        const state = this.npcStates.get(combatantId);
        if (!state) return;

        const combatant = this.npcCombatants.find(c => c.id === combatantId);

        switch (fieldBase) {
            case 'iniMod':
                state.iniMod = parseInt(element.value) || 0;
                break;
            case 'atMod':
                state.atMod = parseInt(element.value) || 0;
                break;
            case 'vtMod':
                state.vtMod = parseInt(element.value) || 0;
                break;
            case 'diceCount':
                state.diceCount = parseInt(element.value) || 1;
                state.diceResults = [];
                state.selectedDiceIndex = null;
                state.hasRolled = false;
                break;
        }

        if (combatant?.actor) {
            await InitiativeStateManager.persistState(combatant.actor, state);
        }

        this._updateCardDisplay(combatantId);
    }

    /**
     * Handle action selection via Foundry multi-select.
     * @param {Event} event
     * @private
     */
    async _onActionsChange(event) {
        const name = event.target.getAttribute('name');
        if (!name) return;

        const parts = name.split('-');
        const combatantId = parts[parts.length - 1];
        const state = this.npcStates.get(combatantId);
        if (!state) return;

        // Get selected values from the multi-select
        const selectedOptions = Array.from(event.target.selectedOptions || []);
        const selectedIds = selectedOptions.map(opt => opt.value).slice(0, 2);

        state.selectedActionIds = selectedIds;
        const combatant = this.npcCombatants.find(c => c.id === combatantId);

        if (combatant?.actor) {
            await InitiativeStateManager.persistState(combatant.actor, state);
        }

        // Re-render to update chips and multi-select state
        this.render();
    }

    /**
     * Handle chip remove button click.
     * @param {Event} event
     * @private
     */
    async _onChipRemove(event) {
        event.stopPropagation();
        const chip = event.currentTarget.closest('.action-chip');
        const actionId = chip?.dataset.actionId;
        const card = chip?.closest('.npc-card');
        const combatantId = card?.dataset.combatantId;

        if (!actionId || !combatantId) return;

        const state = this.npcStates.get(combatantId);
        if (!state) return;

        state.selectedActionIds = state.selectedActionIds.filter(id => id !== actionId);
        const combatant = this.npcCombatants.find(c => c.id === combatantId);

        if (combatant?.actor) {
            await InitiativeStateManager.persistState(combatant.actor, state);
        }

        this.render();
    }

    /**
     * Handle dice rolling for single NPC.
     * @param {Event} event
     * @private
     */
    async _onRollDice(event) {
        event.preventDefault();
        const combatantId = event.currentTarget.dataset.combatantId;
        const state = this.npcStates.get(combatantId);
        if (!state) return;

        state.diceResults = await InitiativeStateManager.rollDice(state.diceCount);

        if (state.diceCount === 1) {
            state.selectedDiceIndex = 0;
        } else {
            state.selectedDiceIndex = null;
        }
        state.hasRolled = true;

        const combatant = this.npcCombatants.find(c => c.id === combatantId);
        if (combatant?.actor) {
            await InitiativeStateManager.persistState(combatant.actor, state);
        }

        this.render();
    }

    /**
     * Handle selecting a die result (for 2-dice mode).
     * @param {Event} event
     * @private
     */
    async _onSelectDice(event) {
        event.preventDefault();
        // Read combatantId from the parent npc-card div — more reliable than
        // Handlebars path traversal inside nested #each loops.
        const card = event.currentTarget.closest('.npc-card');
        const combatantId = card?.dataset.combatantId;
        const index = parseInt(event.currentTarget.dataset.index);
        const state = this.npcStates.get(combatantId);

        if (state && state.diceCount === 2) {
            state.selectedDiceIndex = index;
            const combatant = this.npcCombatants.find(c => c.id === combatantId);
            if (combatant?.actor) {
                await InitiativeStateManager.persistState(combatant.actor, state);
            }
            this.render();
        }
    }

    /**
     * Handle rolling dice for all NPCs (skip already-rolled).
     * @param {Event} event
     * @private
     */
    static async #onRollAllDice(event, _target) {
        event.preventDefault();

        for (const [combatantId, state] of this.npcStates) {
            if (state.hasRolled) continue;

            state.diceResults = await InitiativeStateManager.rollDice(state.diceCount);
            if (state.diceCount === 1) {
                state.selectedDiceIndex = 0;
            } else {
                state.selectedDiceIndex = null;
            }
            state.hasRolled = true;

            const combatant = this.npcCombatants.find(c => c.id === combatantId);
            if (combatant?.actor) {
                await InitiativeStateManager.persistState(combatant.actor, state);
            }
        }

        this.render();
    }

    /**
     * Handle batch apply: add selected action to all eligible NPCs.
     * @param {Event} event
     * @private
     */
    static async #onBatchApply(event, _target) {
        event.preventDefault();
        const batchSelect = this.element.querySelector('.batch-action-select');
        const actionId = batchSelect?.value;
        if (!actionId) return;

        let appliedCount = 0;

        for (const [combatantId, state] of this.npcStates) {
            if (state.selectedActionIds.length >= 2) continue;
            if (state.selectedActionIds.includes(actionId)) continue;

            state.selectedActionIds = [...state.selectedActionIds, actionId];
            const combatant = this.npcCombatants.find(c => c.id === combatantId);
            if (combatant?.actor) {
                await InitiativeStateManager.persistState(combatant.actor, state);
            }
            appliedCount++;
        }

        if (appliedCount > 0) {
            const actionName =
                this.availableActions.find(a => a.id === actionId)?.name ?? 'Aktion';
            ui.notifications.info(
                `"${actionName}" auf ${appliedCount} NPC${appliedCount !== 1 ? 's' : ''} angewendet.`
            );
        }

        this.render();
    }

    /**
     * Handle filter toggle.
     * @param {Event} event
     * @private
     */
    _onFilterToggle(event) {
        this.filterDefault = event.target.checked;
        this.render();
    }

    /**
     * Handle INI ansagen — validate, warn, commit all NPCs.
     * @param {Event} event
     * @private
     */
    static async #onIniAnsagen(event, _target) {
        event.preventDefault();

        // Find unprocessed NPCs
        const unprocessed = [];
        for (const [combatantId, state] of this.npcStates) {
            const needsSelection =
                state.diceCount === 2 && state.hasRolled && state.selectedDiceIndex === null;
            if (!state.hasRolled || needsSelection) {
                const combatant = this.npcCombatants.find(c => c.id === combatantId);
                unprocessed.push(combatant?.actor?.name ?? combatantId);
            }
        }

        if (unprocessed.length > 0) {
            const action = await this._showUnprocessedDialog(unprocessed);
            if (action === 'roll-missing') {
                for (const [combatantId, state] of this.npcStates) {
                    const needsSelection =
                        state.diceCount === 2 &&
                        state.hasRolled &&
                        state.selectedDiceIndex === null;
                    if (!state.hasRolled || needsSelection) {
                        state.diceResults = await InitiativeStateManager.rollDice(state.diceCount);
                        if (state.diceCount === 1) {
                            state.selectedDiceIndex = 0;
                        } else {
                            state.selectedDiceIndex = null;
                        }
                        state.hasRolled = true;

                        const combatant = this.npcCombatants.find(c => c.id === combatantId);
                        if (combatant?.actor) {
                            await InitiativeStateManager.persistState(combatant.actor, state);
                        }
                    }
                }
            } else if (action === 'cancel') {
                return;
            }
        }

        await this._commitAllInitiatives();
    }

    /**
     * Show dialog warning about unprocessed NPCs.
     * @param {string[]} names
     * @returns {Promise<string>} 'roll-missing', 'proceed', or 'cancel'
     * @private
     */
    async _showUnprocessedDialog(names) {
        const nameList = names.join(', ');
        const content = `
            <p>${names.length} NPC${names.length !== 1 ? 's' : ''} ${names.length !== 1 ? 'haben' : 'hat'} noch nicht gewürfelt:</p>
            <p><em>${nameList}</em></p>
        `;

        const result = await DialogV2.prompt({
            window: { title: 'NPCs nicht fertig' },
            content: content,
            buttons: [
                { action: 'roll-missing', label: 'Fehlende würfeln', icon: 'fas fa-dice', default: true },
                { action: 'proceed', label: 'Trotzdem fortsetzen', icon: 'fas fa-arrow-right' },
                { action: 'cancel', label: 'Abbrechen', icon: 'fas fa-times' },
            ],
        });

        return result ?? 'cancel';
    }

    /**
     * Commit all NPC initiatives: create effects, set initiative, post summary.
     * @private
     */
    async _commitAllInitiatives() {
        const combatData = [];
        const initiativeUpdates = [];

        for (const combatant of this.npcCombatants) {
            const state = this.npcStates.get(combatant.id);
            const actor = combatant.actor;
            if (!state || !actor) continue;

            const totalIni = InitiativeStateManager.calculateTotalInitiative(
                state,
                this.availableActions,
                actor
            );
            const diceResult =
                state.selectedDiceIndex !== null
                    ? (state.diceResults[state.selectedDiceIndex] ?? 0)
                    : (state.diceResults[0] ?? 0);

            // Handle negative/locked state
            if (totalIni < 0) {
                if (!state.movedAction) {
                    state.movedActionRounds = 1;
                    state.lockedActionId = state.selectedActionIds[0] ?? null;
                } else {
                    state.movedActionRounds += 1;
                }
                state.movedAction = true;
                state.carryOver = totalIni;

                await InitiativeStateManager.createCombatEffects(
                    actor,
                    state,
                    this.combat?.round ?? 1,
                    this.availableActions
                );

                // Reset dice for next round, persist locked state
                state.diceResults = [];
                state.selectedDiceIndex = null;
                state.hasRolled = false;
                await InitiativeStateManager.persistState(actor, state);
            } else {
                // Positive INI: create effect, then clear state
                await InitiativeStateManager.createCombatEffects(
                    actor,
                    state,
                    this.combat?.round ?? 1,
                    this.availableActions
                );
                await InitiativeStateManager.clearState(actor);
            }

            initiativeUpdates.push({ combatantId: combatant.id, value: totalIni });

            combatData.push({
                actor: actor,
                totalIni: totalIni,
                baseIni: InitiativeStateManager.getBaseInitiative(actor),
                iniMod: state.iniMod,
                diceResult: diceResult,
                actionIds: state.selectedActionIds,
                atMod: state.atMod,
                vtMod: state.vtMod,
                isLocked: totalIni < 0,
            });
        }

        // Batch set initiatives
        for (const { combatantId, value } of initiativeUpdates) {
            await this.combat.setInitiative(combatantId, value);
        }

        // Post summary chat message
        await InitiativeStateManager.postSummaryChatMessage(
            combatData,
            this.combat?.round ?? 1,
            this.availableActions
        );

        this.close();
    }

    /**
     * Handle cancel — discard changes without persisting.
     * @param {Event} event
     * @private
     */
    static #onCancel(event, _target) {
        event.preventDefault();
        // State is not persisted on cancel — previously saved state from last
        // "INI ansagen" commit remains untouched in actor flags. The current
        // session's changes live only in this.npcStates (memory) and are discarded.
        this.close();
    }

    /* -------------------------------------------- */
    /*  Display Updates                              */
    /* -------------------------------------------- */

    /**
     * Update a single card's display in-place without full re-render.
     * @param {string} combatantId
     * @private
     */
    _updateCardDisplay(combatantId) {
        const state = this.npcStates.get(combatantId);
        const combatant = this.npcCombatants.find(c => c.id === combatantId);
        if (!state || !combatant?.actor) return;

        const totalIni = InitiativeStateManager.calculateTotalInitiative(
            state,
            this.availableActions,
            combatant.actor
        );

        const card = this.element.querySelector(`[data-combatant-id="${combatantId}"]`);
        if (!card) return;
        const resultEl = card.querySelector('.result-value');
        if (resultEl) {
            resultEl.textContent = state.hasRolled ? totalIni : '?';
            resultEl.classList.remove('positive', 'negative', 'unknown');
            resultEl.classList.add(
                state.hasRolled
                    ? totalIni < 0
                        ? 'negative'
                        : 'positive'
                    : 'unknown'
            );
        }
    }

    /**
     * Show formula tooltip on hover.
     * @param {Event} event
     * @private
     */
    _onTooltipShow(event) {
        const combatantId = event.currentTarget.dataset.combatantId;
        const state = this.npcStates.get(combatantId);
        const combatant = this.npcCombatants.find(c => c.id === combatantId);
        if (!state || !combatant?.actor) return;

        const parts = InitiativeStateManager.getFormulaParts(
            state,
            this.availableActions,
            combatant.actor
        );

        const totalIni = InitiativeStateManager.calculateTotalInitiative(
            state,
            this.availableActions,
            combatant.actor
        );

        const actionMods = InitiativeStateManager.calculateActionModifiers(
            state.selectedActionIds,
            this.availableActions
        );
        const { malus: combinationMalus } = InitiativeStateManager.deriveCombination(
            state.selectedActionIds,
            this.availableActions
        );

        let tooltipHTML = '<div class="formula-tooltip">';

        for (const part of parts) {
            const numVal = parseInt(part.value);
            const cssClass = !isNaN(numVal) && numVal < 0 ? 'negative' : '';
            tooltipHTML += `
                <div class="tooltip-row">
                    <span class="tooltip-label">${part.label}</span>
                    <span class="tooltip-value ${cssClass}">${part.value}</span>
                </div>`;
        }

        tooltipHTML += '<div class="tooltip-divider"></div>';
        tooltipHTML += `
            <div class="tooltip-row">
                <span class="tooltip-label">AT</span>
                <span class="tooltip-value">${state.atMod + actionMods.at + (state.movedAction ? 0 : combinationMalus)}</span>
            </div>`;
        tooltipHTML += `
            <div class="tooltip-row">
                <span class="tooltip-label">VT</span>
                <span class="tooltip-value">${state.vtMod + actionMods.vt + (state.movedAction ? 0 : combinationMalus)}</span>
            </div>`;
        tooltipHTML += '<div class="tooltip-divider"></div>';
        tooltipHTML += `
            <div class="tooltip-row">
                <span class="tooltip-label">Ergebnis</span>
                <span class="tooltip-total">${state.hasRolled ? totalIni : '?'}</span>
            </div>`;
        tooltipHTML += '</div>';

        // Create tooltip element
        const wrapper = document.createElement('div');
        wrapper.innerHTML = tooltipHTML;
        const tip = wrapper.firstElementChild;
        const targetRect = event.currentTarget.getBoundingClientRect();
        tip.style.position = 'absolute';
        tip.style.top = `${targetRect.top - 8}px`;
        tip.style.left = `${targetRect.left}px`;
        tip.style.zIndex = '9999';
        tip.classList.add('formula-tooltip-active');
        document.body.appendChild(tip);

        // Store reference for removal
        event.currentTarget._tooltip = tip;
    }

    /**
     * Hide formula tooltip.
     * @param {Event} event
     * @private
     */
    _onTooltipHide(event) {
        if (event.currentTarget._tooltip) {
            event.currentTarget._tooltip.remove();
            event.currentTarget._tooltip = null;
        }
    }
}
