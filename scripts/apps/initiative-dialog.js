/**
 * Initiative Dialog for PC Characters
 *
 * Einzeldialog für Spielercharaktere zur Erfassung von Initiativmodifikatoren,
 * Aktionen und Kampfmodifikatoren vor dem Initiativewurf.
 * Delegiert gemeinsame Logik an InitiativeStateManager.
 */
import { InitiativeStateManager } from './initiative-state-manager.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class InitiativeDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(combatant, options = {}) {
        super(options);
        this.combatant = combatant;
        this.actor = combatant.actor;
        this.combat = combatant.combat;
        this.diceResults = [];
        this.selectedDiceIndex = null;
        this.hasRolled = false;
        this.availableActions = [];
        this.movedAction = false;
        this.movedActionRounds = 0;
        this.carryOver = 0;
        this.lockedActionId = null;
        this.lockedWeaponId = null;

        // Load persisted state
        this._loadPersistedState();
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        tag: 'div',
        id: 'initiative-dialog',
        classes: ['ilaris', 'initiative-dialog'],
        position: { width: 520, height: 'auto' },
        window: {
            title: 'Initiative ansagen',
            resizable: true,
        },
        actions: {
            toggleAction: InitiativeDialog.#onActionCardClick,
            rollDice: InitiativeDialog.#onRollDice,
            iniAnsagen: InitiativeDialog.#onIniAnsagen,
            cancelIni: InitiativeDialog.#onCancel,
        },
    };

    /** @override */
    static PARTS = {
        form: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/initiative-dialog.hbs',
        },
    };

    /** @override */
    get title() {
        return `Initiative: ${this.actor.name}`;
    }

    /**
     * Load persisted dialog state from actor flags via StateManager.
     * @private
     */
    _loadPersistedState() {
        const savedState = InitiativeStateManager.loadState(this.actor);

        this.iniMod = savedState.iniMod;
        this.atMod = savedState.atMod;
        this.vtMod = savedState.vtMod;
        this.selectedActionIds = savedState.selectedActionIds;
        this.diceCount = savedState.diceCount;
        this.diceResults = savedState.diceResults;
        this.selectedDiceIndex = savedState.selectedDiceIndex;
        this.hasRolled = savedState.hasRolled;
        this.movedAction = savedState.movedAction;
        this.movedActionRounds = savedState.movedActionRounds;
        this.carryOver = savedState.carryOver;
        this.lockedActionId = savedState.lockedActionId;
        this.lockedWeaponId = savedState.lockedWeaponId;
        this.selectedWeaponId = savedState.selectedWeaponId ?? '';
    }

    /**
     * Save current dialog state to actor flags via StateManager.
     * @private
     */
    async _savePersistedState() {
        await InitiativeStateManager.persistState(this.actor, {
            iniMod: this.iniMod,
            atMod: this.atMod,
            vtMod: this.vtMod,
            selectedActionIds: this.selectedActionIds,
            diceCount: this.diceCount,
            diceResults: this.diceResults,
            selectedDiceIndex: this.selectedDiceIndex,
            hasRolled: this.hasRolled,
            selectedWeaponId: this.selectedWeaponId,
            movedAction: this.movedAction,
            movedActionRounds: this.movedActionRounds,
            carryOver: this.carryOver,
            lockedActionId: this.lockedActionId,
            lockedWeaponId: this.lockedWeaponId,
        });
    }

    /**
     * Clear persisted state from actor flags via StateManager.
     * @private
     */
    async _clearPersistedState() {
        await InitiativeStateManager.clearState(this.actor);
    }

    /**
     * Get base initiative for actor via StateManager.
     * @returns {number}
     * @private
     */
    _getBaseInitiative() {
        return InitiativeStateManager.getBaseInitiative(this.actor);
    }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Load available actions from actor inventory and compendium
        await this._loadAvailableActions();

        // Load available weapons (PC only)
        this._loadAvailableWeapons();

        // Calculate base initiative
        const baseIni = this._getBaseInitiative();

        // Check if manual rolling is enabled in core settings
        const manualRolling = game.settings.get('core', 'rollMode') === 'manual';

        context.actor = this.actor;
        context.combatant = this.combatant;
        context.baseIni = baseIni;
        context.iniMod = this.iniMod;
        context.atMod = this.atMod;
        context.vtMod = this.vtMod;
        context.diceCount = this.diceCount;
        context.availableActions = this.availableActions;
        context.selectedActionIds = this.selectedActionIds;
        context.diceResults = this.diceResults;
        context.selectedDiceIndex = this.selectedDiceIndex;
        context.hasRolled = this.hasRolled;
        context.manualRolling = manualRolling;
        context.movedAction = this.movedAction;
        context.round = this.combat?.round ?? 1;

        // Locked state context
        context.isLocked = this.movedAction;
        context.carryOver = this.carryOver;
        context.movedActionRounds = this.movedActionRounds;
        context.lockedAction = this.lockedActionId
            ? this.availableActions.find(a => (a.id || a._id) === this.lockedActionId)
            : null;
        context.lockedWeapon = this.lockedWeaponId
            ? this.availableWeapons.find(w => w.id === this.lockedWeaponId)
            : null;

        // Weapon data (only relevant in FRESH state)
        context.availableWeapons = this.availableWeapons;
        context.selectedWeaponId = this.selectedWeaponId;
        context.selectedWeaponData = this.selectedWeaponId
            ? this.availableWeapons.find(w => w.id === this.selectedWeaponId)
            : null;

        // Apply weapon gating
        this._applyWeaponGating(context.selectedWeaponData);

        // Auto-derived combination
        const { isCombined } = this._deriveCombination();
        context.isCombined = isCombined;

        // Get selected actions details for description display
        context.selectedActions = this.availableActions.filter(a => this.selectedActionIds.includes(a.id || a._id));
        context.calculatedIni = this._calculateTotalInitiative();
        context.negativeIni = context.calculatedIni < 0;

        // Build formula parts for the live breakdown
        context.formulaParts = this._getFormulaParts();
        context.dicePlaceholder = this.hasRolled
            ? (this.selectedDiceIndex !== null ? this.diceResults[this.selectedDiceIndex] : this.diceResults[0])
            : '▢';

        return context;
    }

    /**
     * Get formula parts for the breakdown display
     * @private
     * @returns {{label: string, value: string}[]}
     */
    _getFormulaParts() {
        if (this.movedAction) {
            return [
                { label: 'Übertrag', value: String(this.carryOver) },
                { label: 'Basis', value: String(this._getBaseInitiative()) },
                { label: 'Mod', value: String(this.iniMod) },
                { label: 'Würfel', value: this.hasRolled ? String(this.diceResults[this.selectedDiceIndex ?? 0] ?? '?') : '▢' },
            ];
        }
        const actionMod = this._getActionIniMod();
        const weaponMod = this.selectedWeaponId ? this._getWeaponIniModifier() : 0;
        return [
            { label: 'Basis', value: String(this._getBaseInitiative()) },
            { label: 'Aktion', value: String(actionMod) },
            { label: 'Waffe', value: String(weaponMod) },
            { label: 'Mod', value: String(this.iniMod) },
            { label: 'Würfel', value: this.hasRolled ? String(this.diceResults[this.selectedDiceIndex ?? 0] ?? '?') : '▢' },
        ];
    }

    /**
     * Get the action INI modifier (lowest among selected)
     * @private
     * @returns {number}
     */
    _getActionIniMod() {
        if (this.selectedActionIds.length === 0) return 0;
        const mods = this.selectedActionIds.map(id => {
            const action = this.availableActions.find(a => (a.id || a._id) === id);
            return action?.iniMod ?? 0;
        });
        return Math.min(...mods);
    }

    /**
     * Derive combination state from selected actions' aktionstyp.
     * @returns {{isCombined: boolean, malus: number}}
     * @private
     */
    _deriveCombination() {
        return InitiativeStateManager.deriveCombination(this.selectedActionIds, this.availableActions);
    }

    /**
     * Apply weapon gating to available actions.
     * Marks non-matching actions with grayedOut and grayedOutReason.
     * @param {Object|null} weapon - The selected weapon object (or null)
     * @private
     */
    _applyWeaponGating(weapon) {
        for (const action of this.availableActions) {
            action.grayedOut = false;
            action.grayedOutReason = '';

            if (!weapon) {
                // No weapon selected: only actions with no weapon restriction are available
                if (action.bedingungen?.waffentyp && action.bedingungen.waffentyp !== '') {
                    action.grayedOut = true;
                    action.grayedOutReason = action.bedingungen.waffentyp === 'nahkampfwaffe'
                        ? 'Erfordert Nahkampfwaffe'
                        : 'Erfordert Fernkampfwaffe';
                }
                continue;
            }

            const weaponType = weapon.system ? (weapon._type || weapon.type) : null;
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

    /**
     * Load available weapons from actor inventory (PC only)
     * @private
     */
    _loadAvailableWeapons() {
        this.availableWeapons = [];

        // Only for PC actors (type "held")
        if (this.actor.type !== 'held') {
            return;
        }

        // Load weapons with hauptwaffe or nebenwaffe = true
        const weapons = this.actor.items.filter(i => {
            if (i.type !== 'nahkampfwaffe' && i.type !== 'fernkampfwaffe') return false;
            return i.system?.hauptwaffe === true || i.system?.nebenwaffe === true;
        });

        for (const weapon of weapons) {
            this.availableWeapons.push({
                id: weapon._id,
                name: weapon.name,
                img: weapon.img,
                system: weapon.system,
            });
        }

        console.log(
            'InitiativeDialog | Loaded weapons:',
            this.availableWeapons.map(w => ({ name: w.name, id: w.id }))
        );
    }

    /**
     * Load available actions via InitiativeStateManager (universal discovery).
     * @private
     */
    async _loadAvailableActions() {
        this.availableActions = await InitiativeStateManager.loadAvailableActions(this.actor);
    }

    /**
     * Calculate total initiative value via StateManager.
     * @private
     * @returns {number} The calculated initiative
     */
    _calculateTotalInitiative() {
        let weaponIniMod = 0;
        if (this.selectedWeaponId && this.availableWeapons.length > 0) {
            weaponIniMod = this._getWeaponIniModifier();
        }

        return InitiativeStateManager.calculateTotalInitiative(
            {
                iniMod: this.iniMod,
                selectedActionIds: this.selectedActionIds,
                movedAction: this.movedAction,
                carryOver: this.carryOver,
                diceResults: this.diceResults,
                selectedDiceIndex: this.selectedDiceIndex,
            },
            this.availableActions,
            this.actor,
            weaponIniMod
        );
    }

    /**
     * Get INI modifier from selected weapon
     * @private
     * @returns {number}
     */
    _getWeaponIniModifier() {
        if (!this.selectedWeaponId) return 0;
        const weapon = this.availableWeapons.find(w => w.id === this.selectedWeaponId);
        if (!weapon) return 0;

        // Check if weapon has actor modifiers
        const hasModifiers = weapon.system?.computed?.hasActorModifiers === true;
        const actorModifiers = weapon.system?.computed?.actorModifiers;

        if (!hasModifiers || !actorModifiers) return 0;

        // Convert to array
        const modifiersArray = Object.values(actorModifiers);

        // Find INI modifiers with actionNegAugment or actionAugment mode
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
     * Calculate AT/VT modifiers from actions via StateManager.
     * @private
     * @returns {{at: number, vt: number}}
     */
    _calculateActionModifiers() {
        return InitiativeStateManager.calculateActionModifiers(
            this.selectedActionIds,
            this.availableActions
        );
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);

        const el = this.element;

        // Input fields for modifiers
        el.querySelector('input[name="iniMod"]')?.addEventListener('change', event => this._onIniModChange(event));
        el.querySelector('input[name="atMod"]')?.addEventListener('change', event => this._onModifierChange(event));
        el.querySelector('input[name="vtMod"]')?.addEventListener('change', event => this._onModifierChange(event));
        el.querySelector('select[name="diceCount"]')?.addEventListener('change', event => this._onModifierChange(event));

        // Weapon dropdown
        el.querySelector('select[name="selectedWeapon"]')?.addEventListener('change', event => this._onWeaponChange(event));

        // Dice result clicks (dynamic — bind after each render)
        el.querySelectorAll('.dice-result').forEach(resultEl => {
            resultEl.addEventListener('click', event => this._onSelectDice(event));
        });

        // Manual dice input
        el.querySelector('input[name="manualDice"]')?.addEventListener('change', event => this._onManualDiceChange(event));
    }

    /**
     * Check if dialog is in locked state
     * @returns {boolean}
     */
    get isLocked() {
        return this.movedAction === true;
    }

    /**
     * Handle action card click (toggle selection, max 2)
     * @param {Event} event
     * @param {HTMLElement} target
     * @private
     */
    static async #onActionCardClick(event, target) {
        event.preventDefault();
        const actionId = target.dataset.actionId;

        if (!actionId) return;

        const action = this.availableActions.find(a => (a.id || a._id) === actionId);
        const isSelected = this.selectedActionIds.includes(actionId);

        if (isSelected) {
            this.selectedActionIds = this.selectedActionIds.filter(id => id !== actionId);
        } else {
            // Don't allow clicking grayed-out actions
            if (action?.grayedOut) return;

            if (this.selectedActionIds.length >= 2) {
                ui.notifications.warn('Maximal 2 Aktionen auswählbar.');
                return;
            }

            // Block combining with komplex action
            if (this.selectedActionIds.length === 1) {
                const existingAction = this.availableActions.find(
                    a => (a.id || a._id) === this.selectedActionIds[0]
                );
                if (existingAction?.aktionstyp === 'komplex' || action?.aktionstyp === 'komplex') {
                    ui.notifications.warn('Komplexe Aktionen können nicht kombiniert werden.');
                    return;
                }
            }

            this.selectedActionIds.push(actionId);
        }

        await this._savePersistedState();
        this._updateFormulaBreakdown();
        this.render();
    }

    /**
     * Handle INI modifier change
     * @param {Event} event
     * @private
     */
    async _onIniModChange(event) {
        this.iniMod = parseInt(event.target.value) || 0;
        await this._savePersistedState();
        this._updateFormulaBreakdown();
    }

    /**
     * Handle other modifier changes (AT, VT, diceCount)
     * @param {Event} event
     * @private
     */
    async _onModifierChange(event) {
        const target = event.target;

        if (target.name === 'atMod') {
            this.atMod = parseInt(target.value) || 0;
            await this._savePersistedState();
            this._updateFormulaBreakdown();
        } else if (target.name === 'vtMod') {
            this.vtMod = parseInt(target.value) || 0;
            await this._savePersistedState();
            this._updateFormulaBreakdown();
        } else if (target.name === 'diceCount') {
            this.diceCount = parseInt(target.value) || 1;
            this.diceResults = [];
            this.selectedDiceIndex = null;
            this.hasRolled = false;
            await this._savePersistedState();
            this.render(); // re-render to show correct number of placeholder dice
        }
    }

    /**
     * Update the formula breakdown display in the DOM.
     * Updates both the formula parts and the total result.
     * @private
     */
    _updateFormulaBreakdown() {
        const el = this.element;
        if (!el) return;

        const totalIni = this._calculateTotalInitiative();

        // Update formula result total
        const resultEl = el.querySelector('.formula-result');
        if (resultEl) {
            resultEl.textContent = totalIni;
            resultEl.classList.toggle('negative', totalIni < 0);
            resultEl.classList.toggle('positive', totalIni >= 0);
        }

        // Update individual formula part values
        const parts = this._getFormulaParts();
        const partEls = el.querySelectorAll('.formula-part .formula-value');
        partEls.forEach((el, i) => {
            if (i < parts.length) {
                el.textContent = parts[i].value;
                const numVal = parseInt(parts[i].value);
                el.classList.toggle('negative', !isNaN(numVal) && numVal < 0);
            }
        });
    }

    /**
     * Handle weapon selection change
     * @param {Event} event
     * @private
     */
    async _onWeaponChange(event) {
        this.selectedWeaponId = event.target.value;
        const weapon = this.selectedWeaponId
            ? this.availableWeapons.find(w => w.id === this.selectedWeaponId)
            : null;
        // Re-apply weapon gating with the new weapon
        this._applyWeaponGating(weapon);
        await this._savePersistedState();
        this._updateFormulaBreakdown();
        // Re-render to show gated actions and weapon properties
        this.render();
    }

    /**
     * Handle dice count selection change
     * @param {Event} event
     * @private
     */
    async _onActionsChange(event) {
        const selectedOptions = Array.from(event.target.value);
        this.selectedActionIds = selectedOptions.slice(0, 2); // Max 2 actions
        await this._savePersistedState();

        // Update calculated INI display directly in DOM
        const totalIni = this._calculateTotalInitiative();
        const iniDisplay = this.element?.querySelector('.current-ini strong');
        if (iniDisplay) {
            iniDisplay.textContent = totalIni;
            iniDisplay.classList.toggle('negative', totalIni < 0);
        }
        this.render();
    }

    /**
     * Handle dice rolling
     * @param {Event} event
     * @private
     */
    static async #onRollDice(event, _target) {
        event.preventDefault();

        // Animate dice faces before showing results
        const diceFaces = this.element.querySelectorAll('.dice-face');
        diceFaces.forEach(el => el.classList.add('rolling'));
        await new Promise(resolve => setTimeout(resolve, 400));

        this.diceResults = await InitiativeStateManager.rollDice(this.diceCount);

        // Auto-select if only one die
        if (this.diceCount === 1) {
            this.selectedDiceIndex = 0;
        } else {
            this.selectedDiceIndex = null;
        }

        this.hasRolled = true;
        await this._savePersistedState();

        // Remove rolling animation
        diceFaces.forEach(el => el.classList.remove('rolling'));

        // Update dice faces with results
        const resultEls = this.element.querySelectorAll('.dice-result');
        resultEls.forEach((el, i) => {
            const result = this.diceResults[i];
            if (result !== undefined) {
                el.classList.remove('dice-placeholder');
                el.classList.toggle('selected', this.selectedDiceIndex === i);
                const face = el.querySelector('.dice-face');
                if (face) {
                    face.classList.remove('show-unknown');
                    for (let p = 1; p <= 6; p++) {
                        face.classList.remove(`show-${p}`);
                    }
                    face.classList.add(`show-${result}`);
                    const valueSpan = face.querySelector('.dice-value');
                    if (valueSpan) valueSpan.textContent = result;
                }
            }
        });

        // Re-bind click handlers for dice selection (on re-render this is handled by _onRender)
        resultEls.forEach(el => {
            el.addEventListener('click', e => this._onSelectDice(e));
        });

        // Enable INI ansagen button
        const ansagenBtn = this.element.querySelector('.ini-ansagen-btn');
        if (ansagenBtn) ansagenBtn.classList.remove('disabled');

        this._updateFormulaBreakdown();
    }

    /**
     * Handle dice selection (for 2-dice option)
     * @param {Event} event
     * @private
     */
    async _onSelectDice(event) {
        event.preventDefault();

        if (this.diceCount !== 2) return;

        const index = parseInt(event.currentTarget.dataset.index);
        this.selectedDiceIndex = index;
        await this._savePersistedState();

        // Update selected class in DOM
        this.element.querySelectorAll('.dice-result').forEach(el => el.classList.remove('selected'));
        event.currentTarget.classList.add('selected');

        this._updateFormulaBreakdown();
    }

    /**
     * Handle manual dice input change (manual rolling mode).
     * @param {Event} event
     * @private
     */
    async _onManualDiceChange(event) {
        const value = parseInt(event.target.value);
        if (isNaN(value) || value < 1 || value > 6) {
            this.diceResults = [];
            this.selectedDiceIndex = null;
            this.hasRolled = false;
        } else {
            this.diceResults = [value];
            this.selectedDiceIndex = 0;
            this.hasRolled = true;
        }
        await this._savePersistedState();
        this._updateFormulaBreakdown();
    }

    /**
     * Handle INI ansagen button click
     * @param {Event} event
     * @private
     */
    static async #onIniAnsagen(event, _target) {
        event.preventDefault();

        // Check if dice have been rolled
        if (!this.hasRolled) {
            ui.notifications.warn('Bitte erst würfeln!');
            return;
        }

        // Check if dice selected (for 2-dice option)
        if (this.diceCount === 2 && this.selectedDiceIndex === null) {
            ui.notifications.warn('Bitte einen Würfel auswählen!');
            return;
        }

        // Calculate final values
        const totalIni = this._calculateTotalInitiative();

        // Use StateManager to build and create the combat effect
        await InitiativeStateManager.createCombatEffects(
            this.actor,
            {
                iniMod: this.iniMod,
                atMod: this.atMod,
                vtMod: this.vtMod,
                selectedActionIds: this.selectedActionIds,
                diceResults: this.diceResults,
                selectedDiceIndex: this.selectedDiceIndex,
                hasRolled: this.hasRolled,
                movedAction: this.movedAction,
                carryOver: this.carryOver,
                lockedActionId: this.lockedActionId,
            },
            this.combat?.round ?? 1,
            this.availableActions
        );

        if (totalIni < 0) {
            // --- NEGATIVE: Enter or stay in LOCKED state ---
            if (!this.movedAction) {
                this.lockedActionId = this.selectedActionIds[0] ?? null;
                this.lockedWeaponId = this.selectedWeaponId || null;
                this.movedActionRounds = 1;
            } else {
                this.movedActionRounds += 1;
            }
            this.movedAction = true;
            this.carryOver = totalIni;

            // Reset dice for next round
            this.iniMod = 0;
            this.diceResults = [];
            this.selectedDiceIndex = null;
            this.hasRolled = false;
            await this._savePersistedState();
        } else {
            // --- POSITIVE: Normal resolution ---
            await this._clearPersistedState();
        }

        // Set initiative in combat tracker
        await this.combat.setInitiative(this.combatant.id, totalIni + 0.1);

        // Post individual chat message via StateManager
        await InitiativeStateManager.postIndividualChatMessage(
            this.actor,
            {
                iniMod: this.iniMod,
                atMod: this.atMod,
                vtMod: this.vtMod,
                selectedActionIds: this.selectedActionIds,
                diceResults: this.diceResults,
                selectedDiceIndex: this.selectedDiceIndex,
                hasRolled: this.hasRolled,
                movedAction: this.movedAction,
                carryOver: this.carryOver,
            },
            this.availableActions,
            this.combat?.round ?? 1
        );

        this.close();
    }

    /**
     * Handle cancel button click — discard changes.
     * State is NOT persisted; only "INI ansagen" commits.
     * @param {Event} event
     * @private
     */
    static #onCancel(event, _target) {
        event.preventDefault();
        this.close();
    }
}
