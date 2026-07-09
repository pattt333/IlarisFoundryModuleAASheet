/**
 * Initiative Dialog for PC Characters
 *
 * Einzeldialog für Spielercharaktere zur Erfassung von Initiativmodifikatoren,
 * Aktionen und Kampfmodifikatoren vor dem Initiativewurf.
 * Delegiert gemeinsame Logik an InitiativeStateManager.
 */
import { InitiativeStateManager } from './initiative-state-manager.js';

export class InitiativeDialog extends Application {
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
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'initiative-dialog',
            classes: ['ilaris', 'initiative-dialog'],
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/initiative-dialog.hbs',
            width: 520,
            height: 'auto',
            title: 'Initiative ansagen',
            resizable: true,
        });
    }

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
        this.kombinierteAktion = savedState.kombinierteAktion;
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
            kombinierteAktion: this.kombinierteAktion,
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
    async getData() {
        const context = await super.getData();

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
        context.kombinierteAktion = this.kombinierteAktion;
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
     * Load available actions from actor inventory and compendium
     * @private
     */
    async _loadAvailableActions() {
        this.availableActions = [];

        // Load from actor inventory (effectItems)
        const actorEffectItems = this.actor.items.filter(i => i.type === 'effectItem');
        for (const item of actorEffectItems) {
            this.availableActions.push({
                id: item._id,
                name: item.name,
                description: item.system?.description ?? '',
                img: item.img,
                source: 'actor',
                uuid: item.uuid,
                effects: item.effects?.contents ?? [],
                iniMod: 0, // Placeholder, will be calculated later
            });
        }

        // Load from compendium
        try {
            const pack = game.packs.get('ilaris-alternative-actor-sheet.nenneke-aktionen');
            if (pack) {
                const documents = await pack.getDocuments();
                for (const item of documents) {
                    this.availableActions.push({
                        id: item._id,
                        name: item.name,
                        description: item.system?.description ?? '',
                        img: item.img,
                        source: 'compendium',
                        uuid: item.uuid,
                        effects: item.effects?.contents ?? [],
                        iniMod: 0, // Placeholder, will be calculated later
                    });
                }
            }
        } catch (error) {
            console.warn('InitiativeDialog | Could not load actions compendium:', error);
        }

        this.availableActions.forEach(action => {
            if (action?.effects) {
                for (const effect of action.effects) {
                    const iniChange = effect.changes?.find(
                        c => c.key === 'system.abgeleitete.ini' || c.key.includes('ini')
                    );
                    if (iniChange) {
                        action.iniMod = parseInt(iniChange.value) || 0;
                    }
                }
            }
        });

        console.log(
            'InitiativeDialog | Loaded actions:',
            this.availableActions.map(a => ({ name: a.name, id: a.id }))
        );
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
    activateListeners(html) {
        super.activateListeners(html);

        // Input fields for modifiers
        html.find('input[name="iniMod"]').change(this._onIniModChange.bind(this));
        html.find('input[name="atMod"]').change(this._onModifierChange.bind(this));
        html.find('input[name="vtMod"]').change(this._onModifierChange.bind(this));
        html.find('input[name="kombinierteAktion"]').change(this._onModifierChange.bind(this));
        html.find('select[name="diceCount"]').change(this._onModifierChange.bind(this));

        // Weapon dropdown
        html.find('select[name="selectedWeapon"]').change(this._onWeaponChange.bind(this));

        // Action cards (clickable tiles)
        html.find('.action-card:not(.locked-card):not(.disabled-card)').click(this._onActionCardClick.bind(this));

        // Dice rolling
        html.find('.roll-dice-btn').click(this._onRollDice.bind(this));
        html.find('.dice-result').click(this._onSelectDice.bind(this));

        // Manual dice input (manual rolling mode)
        html.find('input[name="manualDice"]').change(this._onManualDiceChange.bind(this));

        // Main buttons
        html.find('.ini-ansagen-btn').click(this._onIniAnsagen.bind(this));
        html.find('.cancel-btn').click(this._onCancel.bind(this));
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
     * @private
     */
    async _onActionCardClick(event) {
        event.preventDefault();
        const card = event.currentTarget;
        const actionId = card.dataset.actionId;

        if (!actionId) return;

        const isSelected = this.selectedActionIds.includes(actionId);

        if (isSelected) {
            // Deselect
            this.selectedActionIds = this.selectedActionIds.filter(id => id !== actionId);
        } else {
            // Select (max 2)
            if (this.selectedActionIds.length >= 2) {
                ui.notifications.warn('Maximal 2 Aktionen auswählbar.');
                return;
            }
            this.selectedActionIds.push(actionId);
        }

        await this._savePersistedState();
        this._updateFormulaBreakdown();
        this.render();
    }

    /**
     * Handle form submission
     * @param {Event} event
     * @param {Object} formData
     * @private
     */
    async _updateObject(event, formData) {
        // Update local state from form data
        this.iniMod = parseInt(formData.iniMod) || 0;
        this.atMod = parseInt(formData.atMod) || 0;
        this.vtMod = parseInt(formData.vtMod) || 0;
        this.kombinierteAktion = formData.kombinierteAktion || false;
        this.diceCount = parseInt(formData.diceCount) || 1;

        // Save to actor flags
        await this._savePersistedState();
        this._updateFormulaBreakdown();
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
     * Handle other modifier changes (AT, VT, kombinierte Aktion, diceCount)
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
        } else if (target.name === 'kombinierteAktion') {
            this.kombinierteAktion = target.checked;
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
        const html = this.element;
        if (!html.length) return;

        const totalIni = this._calculateTotalInitiative();

        // Update formula result total
        const resultEl = html.find('.formula-result');
        if (resultEl.length) {
            resultEl.text(totalIni);
            resultEl.toggleClass('negative', totalIni < 0);
            resultEl.toggleClass('positive', totalIni >= 0);
        }

        // Update individual formula part values
        const parts = this._getFormulaParts();
        const partEls = html.find('.formula-part .formula-value');
        partEls.each((i, el) => {
            if (i < parts.length) {
                const $el = $(el);
                $el.text(parts[i].value);
                const numVal = parseInt(parts[i].value);
                $el.toggleClass('negative', !isNaN(numVal) && numVal < 0);
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
        await this._savePersistedState();
        this._updateFormulaBreakdown();
        // Re-render to show weapon properties
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
        const iniDisplay = this.element.find('.current-ini strong');
        if (iniDisplay.length) {
            iniDisplay.text(totalIni);
            iniDisplay.toggleClass('negative', totalIni < 0);
        }
        this.render();
    }

    /**
     * Handle dice rolling
     * @param {Event} event
     * @private
     */
    async _onRollDice(event) {
        event.preventDefault();

        // Animate dice faces before showing results
        const diceFaces = this.element.find('.dice-face');
        diceFaces.addClass('rolling');
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
        diceFaces.removeClass('rolling');

        // Update dice faces with results
        const resultEls = this.element.find('.dice-result');
        resultEls.each((i, el) => {
            const $el = $(el);
            const result = this.diceResults[i];
            if (result !== undefined) {
                $el.removeClass('dice-placeholder');
                $el.toggleClass('selected', this.selectedDiceIndex === i);
                const $face = $el.find('.dice-face');
                $face.removeClass('show-unknown');
                // Add class for the pip count
                for (let p = 1; p <= 6; p++) {
                    $face.removeClass(`show-${p}`);
                }
                $face.addClass(`show-${result}`);
                $face.find('.dice-value').text(result);
            }
        });

        // Re-bind click handlers for dice selection
        this.element.find('.dice-result').off('click').click(this._onSelectDice.bind(this));

        // Enable INI ansagen button
        this.element.find('.ini-ansagen-btn').removeClass('disabled');

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
        this.element.find('.dice-result').removeClass('selected');
        $(event.currentTarget).addClass('selected');

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
    async _onIniAnsagen(event) {
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
                kombinierteAktion: this.kombinierteAktion,
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
                kombinierteAktion: this.kombinierteAktion,
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
    _onCancel(event) {
        event.preventDefault();
        this.close();
    }
    /**
     * @private
     */
    _onCancel(event) {
        event.preventDefault();
        // Don't clear state, just close
        this.close();
    }
}
