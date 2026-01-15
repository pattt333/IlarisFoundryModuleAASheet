/**
 * Initiative Dialog for PC Characters
 * 
 * Einzeldialog für Spielercharaktere zur Erfassung von Initiativmodifikatoren,
 * Aktionen und Kampfmodifikatoren vor dem Initiativewurf.
 */
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
        
        // Load persisted state
        this._loadPersistedState();
    }
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "initiative-dialog",
            classes: ["ilaris", "initiative-dialog"],
            template: "modules/ilaris-alternative-actor-sheet/templates/apps/initiative-dialog.hbs",
            width: 450,
            height: "auto",
            title: "Initiative ansagen",
            resizable: true
        });
    }
    
    /** @override */
    get title() {
        return `Initiative: ${this.actor.name}`;
    }
    
    /**
     * Load persisted dialog state from actor flags
     * @private
     */
    _loadPersistedState() {
        const savedState = this.actor.getFlag("ilaris-alternative-actor-sheet", "dialogState");
        if (savedState) {
            this.iniMod = savedState.iniMod ?? 0;
            this.atMod = savedState.atMod ?? 0;
            this.vtMod = savedState.vtMod ?? 0;
            this.selectedActionIds = savedState.selectedActionIds ?? [];
            this.kombinierteAktion = savedState.kombinierteAktion ?? false;
            this.diceCount = savedState.diceCount ?? 1;
            this.diceResults = savedState.diceResults ?? [];
            this.selectedDiceIndex = savedState.selectedDiceIndex ?? null;
            this.hasRolled = savedState.hasRolled ?? false;
            this.selectedWeaponId = savedState.selectedWeaponId ?? "";
            this.movedAction = savedState.movedAction ?? false;
            this.movedActionRounds = savedState.movedActionRounds ?? 0;
        } else {
            this.iniMod = 0;
            this.atMod = 0;
            this.vtMod = 0;
            this.selectedActionIds = [];
            this.kombinierteAktion = false;
            this.diceCount = 1;
            this.selectedWeaponId = "";
        }
    }
    
    /**
     * Save current dialog state to actor flags
     * @private
     */
    async _savePersistedState() {
        await this.actor.setFlag("ilaris-alternative-actor-sheet", "dialogState", {
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
            movedActionRounds: this.movedActionRounds
        });
    }
    
    /**
     * Clear persisted state from actor flags
     * @private
     */
    async _clearPersistedState() {
        await this.actor.unsetFlag("ilaris-alternative-actor-sheet", "dialogState");
    }
    
    /**
     * Get base initiative for actor (PC or NPC)
     * @returns {number}
     * @private
     */
    _getBaseInitiative() {
        // PC (held) uses system.abgeleitete.ini
        // NPC (kreatur) uses system.kampfwerte.ini
        if (this.actor.type === "held") {
            return this.actor.system.abgeleitete?.baseIni ?? 0;
        } else if (this.actor.type === "kreatur") {
            return this.actor.system.kampfwerte?.baseIni ?? 0;
        }
        return 0;
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
        const manualRolling = game.settings.get("core", "rollMode") === "manual";
        
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
        
        // Weapon data
        context.availableWeapons = this.availableWeapons;
        context.selectedWeaponId = this.selectedWeaponId;
        context.selectedWeaponData = this.selectedWeaponId ? 
        this.availableWeapons.find(w => w.id === this.selectedWeaponId) : null;
        
        // Get selected actions details for description display
        context.selectedActions = this.availableActions.filter(a => 
            this.selectedActionIds.includes(a.id || a._id)
        );
        context.calculatedIni = this._calculateTotalInitiative();
        context.negativeIni = context.calculatedIni < 0;
        
        return context;
    }
    
    /**
     * Load available weapons from actor inventory (PC only)
     * @private
     */
    _loadAvailableWeapons() {
        this.availableWeapons = [];
        
        // Only for PC actors (type "held")
        if (this.actor.type !== "held") {
            return;
        }
        
        // Load weapons with hauptwaffe or nebenwaffe = true
        const weapons = this.actor.items.filter(i => {
            if (i.type !== "nahkampfwaffe" && i.type !== "fernkampfwaffe") return false;
            return i.system?.hauptwaffe === true || i.system?.nebenwaffe === true;
        });
        
        for (const weapon of weapons) {
            this.availableWeapons.push({
                id: weapon._id,
                name: weapon.name,
                img: weapon.img,
                system: weapon.system
            });
        }
        
        console.log('InitiativeDialog | Loaded weapons:', this.availableWeapons.map(w => ({name: w.name, id: w.id})));
    }
    
    /**
     * Load available actions from actor inventory and compendium
     * @private
     */
    async _loadAvailableActions() {
        this.availableActions = [];
        
        // Load from actor inventory (effect-items)
        const actorEffectItems = this.actor.items.filter(i => i.type === "effect-item");
        for (const item of actorEffectItems) {
            this.availableActions.push({
                id: item._id,
                name: item.name,
                description: item.system?.description ?? "",
                img: item.img,
                source: "actor",
                uuid: item.uuid,
                effects: item.effects?.contents ?? [],
                iniMod: 0 // Placeholder, will be calculated later
            });
        }
        
        // Load from compendium
        try {
            const pack = game.packs.get("ilaris-alternative-actor-sheet.nenneke-aktionen");
            if (pack) {
                const documents = await pack.getDocuments();
                for (const item of documents) {
                    this.availableActions.push({
                        id: item._id,
                        name: item.name,
                        description: item.system?.description ?? "",
                        img: item.img,
                        source: "compendium",
                        uuid: item.uuid,
                        effects: item.effects?.contents ?? [],
                        iniMod: 0 // Placeholder, will be calculated later
                    });
                }
            }
        } catch (error) {
            console.warn("InitiativeDialog | Could not load actions compendium:", error);
        }

        this.availableActions.forEach(action => {
            if (action?.effects) {
                for (const effect of action.effects) {
                    const iniChange = effect.changes?.find(c => 
                        c.key === "system.abgeleitete.ini" || c.key.includes("ini")
                    );
                    if (iniChange) {
                        action.iniMod = parseInt(iniChange.value) || 0;
                    }
                }
            }
        });
        
        console.log('InitiativeDialog | Loaded actions:', this.availableActions.map(a => ({name: a.name, id: a.id})));
    }
    
    /**
     * Calculate total initiative value
     * @private
     * @returns {number} The calculated initiative
     */
    _calculateTotalInitiative() {
        const baseIni = this._getBaseInitiative();
        const currentIni = this.actor.system.abgeleitete?.ini ?? 0;
        
        // Get weapon INI modifier
        let weaponIniMod = 0;
        if (this.selectedWeaponId && this.availableWeapons.length > 0) {
            weaponIniMod = this._getWeaponIniModifier();
        }
        
        // Get the lowest INI mod from selected actions
        let actionIniMod = 0;
        this.selectedActions = [];
        if (this.selectedActionIds.length > 0) {
            const actionMods = this.selectedActionIds.map(id => {
                const action = this.availableActions.find(a => (a.id || a._id) === id);
                if (action?.iniMod) {
                    return action.iniMod;
                }
                return 0;
            });
            actionIniMod = Math.min(...actionMods);
        }
        
        // Get dice result
        const diceResult = this.selectedDiceIndex !== null 
            ? (this.diceResults[this.selectedDiceIndex] ?? 0)
            : (this.diceResults[0] ?? 0);
        
        // Wenn movedAction aktiv ist, holen wir den Effect-Change statt Basis-INI zu verwenden
        if (this.movedAction && this.movedActionRounds > 0) {
            // Total = Basis-INI + Action-Mod + (Basis-INI × movedActionRounds) + Würfel
            return currentIni + weaponIniMod + actionIniMod + (baseIni * this.movedActionRounds) + diceResult;
        }
        
        // Normale Berechnung für erste Ansage
        return currentIni + weaponIniMod + this.iniMod + actionIniMod + diceResult;
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
            if (modifier.property === "ini") {
                if (modifier.mode === "actionNegAugment") {
                    return -(modifier.value ?? 0);
                } else if (modifier.mode === "actionAugment") {
                    return modifier.value ?? 0;
                }
            }
        }
        
        return 0;
    }
    
    /**
     * Calculate AT/VT modifiers from actions
     * @private
     * @returns {{at: number, vt: number}}
     */
    _calculateActionModifiers() {
        let atMod = 0;
        let vtMod = 0;
        
        for (const actionId of this.selectedActionIds) {
            const action = this.availableActions.find(a => (a.id || a._id) === actionId);
            if (action?.effects) {
                for (const effect of action.effects) {
                    for (const change of effect.changes || []) {
                        if (change.key === "system.modifikatoren.nahkampfmod" || change.key.includes("nahkampfmod")) {
                            atMod += parseInt(change.value) || 0;
                        }
                        if (change.key === "system.modifikatoren.verteidigungmod" || change.key.includes("verteidigungmod")) {
                            vtMod += parseInt(change.value) || 0;
                        }
                    }
                }
            }
        }
        
        return { at: atMod, vt: vtMod };
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
        
        // Actions dropdown
        html.find('multi-select[name="actions"]').change(this._onActionsChange.bind(this));
        
        // Dice rolling
        html.find('.roll-dice-btn').click(this._onRollDice.bind(this));
        html.find('.dice-result').click(this._onSelectDice.bind(this));
        
        // Main buttons
        html.find('.ini-ansagen-btn').click(this._onIniAnsagen.bind(this));
        html.find('.cancel-btn').click(this._onCancel.bind(this));
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
        
        // Update calculated INI display directly in DOM
        const totalIni = this._calculateTotalInitiative();
        const iniDisplay = this.element.find('.current-ini strong');
        if (iniDisplay.length) {
            iniDisplay.text(totalIni);
            iniDisplay.toggleClass('negative', totalIni < 0);
        }
    }
    
    /**
     * Handle INI modifier change
     * @param {Event} event
     * @private
     */
    async _onIniModChange(event) {
        this.iniMod = parseInt(event.target.value) || 0;
        await this._savePersistedState();
        
        // Update calculated INI display
        const totalIni = this._calculateTotalInitiative();
        const iniDisplay = this.element.find('.current-ini strong');
        if (iniDisplay.length) {
            iniDisplay.text(totalIni);
            iniDisplay.toggleClass('negative', totalIni < 0);
        }
    }
    
    /**
     * Handle other modifier changes (AT, VT, kombinierte Aktion, diceCount)
     * @param {Event} event
     * @private
     */
    async _onModifierChange(event) {
        const target = event.target;
        
        if (target.name === "atMod") {
            this.atMod = parseInt(target.value) || 0;
        } else if (target.name === "vtMod") {
            this.vtMod = parseInt(target.value) || 0;
        } else if (target.name === "kombinierteAktion") {
            this.kombinierteAktion = target.checked;
        } else if (target.name === "diceCount") {
            this.diceCount = parseInt(target.value) || 1;
        }
        
        await this._savePersistedState();
    }
    
    /**
     * Handle weapon selection change
     * @param {Event} event
     * @private
     */
    async _onWeaponChange(event) {
        this.selectedWeaponId = event.target.value;
        await this._savePersistedState();
        
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
        
        this.diceResults = [];
        
        for (let i = 0; i < this.diceCount; i++) {
            const roll = await new Roll("1d6").evaluate();
            this.diceResults.push(roll.total);
        }
        
        // Auto-select if only one die
        if (this.diceCount === 1) {
            this.selectedDiceIndex = 0;
        } else {
            this.selectedDiceIndex = null;
        }
        
        this.hasRolled = true;
        await this._savePersistedState();
        
        // Update dice display in DOM
        const diceSection = this.element.find('.dice-section');
        
        // Build dice results HTML
        let diceHTML = '<div class="dice-results">';
        this.diceResults.forEach((result, index) => {
            const selected = (this.selectedDiceIndex === index) ? 'selected' : '';
            const title = (this.diceCount === 2) ? 'Klicken zum Auswählen' : '';
            diceHTML += `
                <div class="dice-result ${selected}" 
                     data-index="${index}"
                     title="${title}">
                    <div class="dice-face d6">
                        <span class="dice-value">${result}</span>
                    </div>
                </div>
            `;
        });
        diceHTML += '</div>';
        
        // Replace or insert dice results
        const existingResults = diceSection.find('.dice-results');
        if (existingResults.length) {
            existingResults.replaceWith(diceHTML);
        } else {
            diceSection.append(diceHTML);
        }
        
        // Re-bind click handlers for new dice
        diceSection.find('.dice-result').click(this._onSelectDice.bind(this));
        
        // Update INI display
        const totalIni = this._calculateTotalInitiative();
        const iniDisplay = this.element.find('.current-ini strong');
        if (iniDisplay.length) {
            iniDisplay.text(totalIni);
            iniDisplay.toggleClass('negative', totalIni < 0);
        }
        this.render();
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
        
        // Update INI display
        const totalIni = this._calculateTotalInitiative();
        const iniDisplay = this.element.find('.current-ini strong');
        if (iniDisplay.length) {
            iniDisplay.text(totalIni);
            iniDisplay.toggleClass('negative', totalIni < 0);
        }
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
            ui.notifications.warn("Bitte erst würfeln!");
            return;
        }
        
        // Check if dice selected (for 2-dice option)
        if (this.diceCount === 2 && this.selectedDiceIndex === null) {
            ui.notifications.warn("Bitte einen Würfel auswählen!");
            return;
        }
        
        // Calculate final values
        const totalIni = this._calculateTotalInitiative();
        const actionMods = this._calculateActionModifiers();
        
        // Calculate final AT/VT modifiers
        let finalAtMod = this.atMod + actionMods.at;
        let finalVtMod = this.vtMod + actionMods.vt;
        
        // Apply kombinierte Aktion penalty
        if (this.kombinierteAktion) {
            finalAtMod -= 4;
            finalVtMod -= 4;
        }
        
        // Determine effect duration (2 turns if negative initiative)
        const effectDuration = totalIni < 0 ? 2 : 1;
        
        // Get dice result
        const diceResult = this.selectedDiceIndex !== null 
            ? this.diceResults[this.selectedDiceIndex]
            : this.diceResults[0];
        
        // Find existing combat modifier effect
        const existingEffect = this.actor.effects.find(e => 
            e.name.startsWith("Kampf-Modifikatoren Runde")
        );
        
        // Handle negative initiative with movedAction
        if (totalIni < 0) {
            // Update movedActionRounds
            if (!this.movedAction) {
                this.movedActionRounds = 1;
            } else {
                this.movedActionRounds += 1;
            }
            this.movedAction = true;
            
            // Update existing effect if present
            if (existingEffect) {
                const iniChange = existingEffect.changes.find(c => 
                    c.key === "system.abgeleitete.ini" || c.key.includes("ini")
                );
                
                if (iniChange) {
                    // Update: Alter Change + neuer Würfel
                    const oldChangeValue = parseInt(iniChange.value) || 0;
                    const newChangeValue = oldChangeValue + diceResult;
                    
                    // Update effect with new change value
                    const updatedChanges = existingEffect.changes.map(c => {
                        if (c.key === "system.abgeleitete.ini" || c.key.includes("ini")) {
                            return {
                                ...c,
                                value: newChangeValue.toString()
                            };
                        }
                        return c;
                    });
                    
                    await existingEffect.update({
                        changes: updatedChanges,
                        "duration.turns": 2
                    });
                    
                    console.log(`InitiativeDialog | Updated effect: ${existingEffect.name}, new INI change: ${newChangeValue}`);
                }
            } else {
                // Create new effect for first negative INI
                const changes = [];
                
                // Effect speichert nur INI-Mod + Würfel
                if (this.iniMod !== 0 || diceResult !== 0) {
                    changes.push({
                        key: "system.abgeleitete.ini",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: (this.iniMod + diceResult).toString()
                    });
                }
                
                if (finalAtMod !== 0) {
                    changes.push({
                        key: "system.modifikatoren.nahkampfmod",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: finalAtMod.toString()
                    });
                }
                
                if (finalVtMod !== 0) {
                    changes.push({
                        key: "system.modifikatoren.verteidigungmod",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: finalVtMod.toString()
                    });
                }
                
                if (changes.length > 0) {
                    const effectData = {
                        name: `Kampf-Modifikatoren Runde ${this.combat?.round ?? 1}`,
                        icon: "icons/svg/dice-target.svg",
                        changes: changes,
                        duration: {
                            turns: 2
                        },
                        origin: this.actor.uuid
                    };
                    
                    await this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                }
            }
        } else {
            // Positive INI: Create normal effect, clear moved action state
            const changes = [];
            
            if (this.iniMod !== 0 || diceResult !== 0) {
                changes.push({
                    key: "system.abgeleitete.ini",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: (this.iniMod + diceResult).toString()
                });
            }
            
            if (finalAtMod !== 0) {
                changes.push({
                    key: "system.modifikatoren.nahkampfmod",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: finalAtMod.toString()
                });
            }
            
            if (finalVtMod !== 0) {
                changes.push({
                    key: "system.modifikatoren.verteidigungmod",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: finalVtMod.toString()
                });
            }
            
            // Remove old combat modifier effects
            if (existingEffect) {
                await this.actor.deleteEmbeddedDocuments("ActiveEffect", [existingEffect.id]);
            }
            
            // Create new effect with duration 1
            if (changes.length > 0) {
                const effectData = {
                    name: `Kampf-Modifikatoren Runde ${this.combat?.round ?? 1}`,
                    icon: "icons/svg/dice-target.svg",
                    changes: changes,
                    duration: {
                        turns: 1
                    },
                    origin: this.actor.uuid
                };
                
                await this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            }
        }
        
        // Set initiative in combat tracker
        await this.combat.setInitiative(this.combatant.id, totalIni + 0.1); // PCs before NPCs with same ini
        
        // Post chat message
        await this._postChatMessage(totalIni, diceResult, finalAtMod, finalVtMod);
        
        // Clear persisted state
        if(totalIni >= 0) {
            await this._clearPersistedState();
        } else {
            // For negative initiative, keep state but reset dice
            this.iniMod = 0;
            this.diceResults = [];
            this.selectedDiceIndex = null;
            this.hasRolled = false;
            // movedAction and movedActionRounds already updated above
            await this._savePersistedState();
        }
        
        
        // Close dialog
        this.close();
    }
    
    /**
     * Post chat message with initiative announcement
     * @param {number} totalIni - Total initiative value
     * @param {number} diceResult - Dice roll result
     * @param {number} atMod - AT modifier
     * @param {number} vtMod - VT modifier
     * @private
     */
    async _postChatMessage(totalIni, diceResult, atMod, vtMod) {
        const baseIni = this.actor.system.abgeleitete?.ini ?? 0;
        
        // Build action names
        const actionNames = this.selectedActionIds
            .map(id => this.availableActions.find(a => (a.id || a._id) === id)?.name)
            .filter(Boolean);
        
        // Build content with actor icon
        let content = `<img src="${this.actor.img}" alt="${this.actor.name}" width="36" height="36" style="border: none; vertical-align: middle; margin-right: 8px;"/>`;
        content += `<strong>${this.actor.name}</strong> Initiative: ${totalIni} (Basis: ${baseIni}, Mod: ${this.iniMod >= 0 ? '+' : ''}${this.iniMod}, Würfel: ${diceResult})`;
        
        if (actionNames.length > 0) {
            content += `<br>Aktionen: ${actionNames.join(", ")}`;
        }
        
        if (atMod !== 0 || vtMod !== 0) {
            const modifiers = [];
            if (atMod !== 0) modifiers.push(`AT ${atMod >= 0 ? '+' : ''}${atMod}`);
            if (vtMod !== 0) modifiers.push(`VT ${vtMod >= 0 ? '+' : ''}${vtMod}`);
            content += `<br>Modifikatoren: ${modifiers.join(", ")}`;
        }
        
        await ChatMessage.create({
            content: content,
            speaker: ChatMessage.getSpeaker({ actor: this.actor })
        });
    }
    
    /**
     * Handle cancel button click
     * @param {Event} event
     * @private
     */
    _onCancel(event) {
        event.preventDefault();
        // Don't clear state, just close
        this.close();
    }
}
