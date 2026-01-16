/**
 * Mass Initiative Dialog for NPCs
 * 
 * Massen-Dialog für den GM zur Bearbeitung aller NPCs im Encounter.
 * Accordion-basiertes Interface mit einem Accordion pro NPC.
 */
export class MassInitiativeDialog extends Application {
    
    constructor(combat, npcCombatants, options = {}) {
        super(options);
        this.combat = combat;
        this.npcCombatants = npcCombatants;
        this.npcStates = new Map();
        this.availableActions = [];
        
        // Initialize state for each NPC
        for (const combatant of npcCombatants) {
            this._initializeNpcState(combatant);
        }
    }
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "mass-initiative-dialog",
            classes: ["ilaris", "mass-initiative-dialog"],
            template: "modules/ilaris-alternative-actor-sheet/templates/apps/mass-initiative-dialog.hbs",
            width: 800,
            height: 600,
            title: "NPC Initiative",
            resizable: true
        });
    }
    
    /** @override */
    get title() {
        return `NPC Initiative - Runde ${this.combat?.round ?? 1}`;
    }
    
    /**
     * Initialize state for an NPC combatant
     * @param {Combatant} combatant
     * @private
     */
    _initializeNpcState(combatant) {
        const actor = combatant.actor;
        const savedState = actor?.getFlag("ilaris-alternative-actor-sheet", "dialogState");
        
        if (savedState) {
            this.npcStates.set(combatant.id, {
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
                processed: false
            });
        } else {
            this.npcStates.set(combatant.id, {
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
                processed: false
            });
        }
    }
    
    /**
     * Save state for an NPC
     * @param {string} combatantId
     * @private
     */
    async _saveNpcState(combatantId) {
        const combatant = this.npcCombatants.find(c => c.id === combatantId);
        const state = this.npcStates.get(combatantId);
        
        if (combatant?.actor && state) {
            await combatant.actor.setFlag("ilaris-alternative-actor-sheet", "dialogState", {
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
                movedActionRounds: state.movedActionRounds
            });
        }
    }
    
    /**
     * Clear state for an NPC
     * @param {string} combatantId
     * @private
     */
    async _clearNpcState(combatantId) {
        const combatant = this.npcCombatants.find(c => c.id === combatantId);
        if (combatant?.actor) {
            await combatant.actor.unsetFlag("ilaris-alternative-actor-sheet", "dialogState");
        }
    }
    
    /**
     * Get base initiative for actor (PC or NPC)
     * @param {Actor} actor
     * @returns {number}
     * @private
     */
    _getBaseInitiative(actor) {
        // PC (held) uses system.abgeleitete.ini
        // NPC (kreatur) uses system.kampfwerte.ini
        if (actor.type === "held") {
            return actor.system.abgeleitete?.ini ?? 0;
        } else if (actor.type === "kreatur") {
            return actor.system.kampfwerte?.ini ?? 0;
        }
        return 0;
    }
    
    /** @override */
    async getData() {
        const context = await super.getData();
        
        // Load available actions from compendium only (for NPCs) - only once
        await this._loadAvailableActions();
        
        // Build NPC data for template
        const npcs = [];
        for (const combatant of this.npcCombatants) {
            const state = this.npcStates.get(combatant.id);
            const actor = combatant.actor;
            const baseIni = this._getBaseInitiative(actor);
            
            // Calculate total initiative
            const totalIni = this._calculateTotalInitiative(combatant.id);
            const isNegativeIni = totalIni < 0;
            
            npcs.push({
                combatantId: combatant.id,
                actorId: actor?.id,
                name: actor?.name ?? combatant.name,
                img: actor?.img ?? combatant.img,
                baseIni: baseIni,
                state: state,
                totalIni: totalIni,
                isNegativeIni: isNegativeIni,
                needsDiceSelection: state.diceCount === 2 && state.hasRolled && state.selectedDiceIndex === null
            });
        }
        
        context.npcs = npcs;
        context.availableActions = this.availableActions;
        context.round = this.combat?.round ?? 1;
        context.processedCount = Array.from(this.npcStates.values()).filter(s => s.processed).length;
        context.totalCount = this.npcCombatants.length;
        
        return context;
    }
    
    /**
     * Load available actions from compendium only
     * @private
     */
    async _loadAvailableActions() {
        this.availableActions = [];
        
        try {
            const pack = game.packs.get("ilaris-alternative-actor-sheet.nenneke-aktionen");
            if (pack) {
                const documents = await pack.getDocuments();
                for (const item of documents) {
                    this.availableActions.push({
                        id: item.uuid,
                        _id: item.id,
                        name: item.name,
                        description: item.system?.description ?? "",
                        img: item.img,
                        source: "compendium",
                        uuid: item.uuid,
                        effects: item.effects?.contents ?? []
                    });
                }
                console.log('MassInitiativeDialog | Loaded actions:', this.availableActions.map(a => ({name: a.name, id: a.id})));
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
        } catch (error) {
            console.warn("MassInitiativeDialog | Could not load actions compendium:", error);
        }
    }
    
    /**
     * Calculate total initiative for an NPC
     * @param {string} combatantId
     * @private
     * @returns {number}
     */
    _calculateTotalInitiative(combatantId) {
        const combatant = this.npcCombatants.find(c => c.id === combatantId);
        const state = this.npcStates.get(combatantId);
        
        if (!combatant?.actor || !state) return 0;
        
        const baseIni = combatant.actor.system.kampfwerte?.baseIni ?? 0;
        const currentIni = this._getBaseInitiative(combatant.actor);

        
        // Get the lowest INI mod from selected actions
        let actionIniMod = 0;
        if (state.selectedActionIds.length > 0) {
            const actionMods = state.selectedActionIds.map(id => {
                const action = this.availableActions.find(a => (a.id || a._id) === id);
                if (action?.iniMod) {
                    return parseInt(action.iniMod) || 0;
                }
                return 0;
            });
            actionIniMod = Math.min(...actionMods, 0);
        }
        
        // Get dice result
        const diceResult = state.selectedDiceIndex !== null 
            ? (state.diceResults[state.selectedDiceIndex] ?? 0)
            : (state.diceResults[0] ?? 0);
        
        // Calculate with movedActionRounds multiplier
        if (state.movedAction && state.movedActionRounds > 0) {
            // Total = Current-INI + Action-Mod + (Basis-INI × movedActionRounds) + Würfel
            return currentIni + actionIniMod + (baseIni * state.movedActionRounds) + diceResult;
        }
        
        return currentIni + state.iniMod + actionIniMod + diceResult;
    }
    
    /**
     * Calculate AT/VT modifiers from actions for an NPC
     * @param {string} combatantId
     * @private
     * @returns {{at: number, vt: number}}
     */
    _calculateActionModifiers(combatantId) {
        const state = this.npcStates.get(combatantId);
        if (!state) return { at: 0, vt: 0 };
        
        let atMod = 0;
        let vtMod = 0;
        
        for (const actionId of state.selectedActionIds) {
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
        
        // Accordion toggle
        html.find('.accordion-header').click(this._onAccordionToggle.bind(this));
        
        // Actions dropdown
        html.find('select[name^="actions-"]').change(this._onActionsChange.bind(this));
        
        // Dice rolling
        html.find('.roll-dice-btn').click(this._onRollDice.bind(this));
        html.find('.dice-result').click(this._onSelectDice.bind(this));
        
        // Mass dice rolling
        html.find('.roll-all-dice-btn').click(this._onRollAllDice.bind(this));
        
        // Main buttons
        html.find('.ini-ansagen-btn').click(this._onIniAnsagen.bind(this));
        html.find('.cancel-btn').click(this._onCancel.bind(this));
        
        // Form change handling for inputs
        html.find('input, select').on('change', this._onFormChange.bind(this));
    }
    
    /**
     * Handle accordion toggle
     * @param {Event} event
     * @private
     */
    _onAccordionToggle(event) {
        event.preventDefault();
        const header = $(event.currentTarget);
        const content = header.next('.accordion-content');
        const icon = header.find('.accordion-icon');
        
        // Toggle active class
        header.toggleClass('active');
        content.toggleClass('active');
        
        // Rotate icon
        if (content.hasClass('active')) {
            icon.css('transform', 'rotate(180deg)');
        } else {
            icon.css('transform', 'rotate(0deg)');
        }
    }
    
    /**
     * Handle general form changes (inputs and selects except actions)
     * @param {Event} event
     * @private
     */
    async _onFormChange(event) {
        const element = event.currentTarget;
        const name = element.name;
        
        // Skip if it's an actions select (handled separately)
        if (name.startsWith('actions-')) return;
        
        // Extract combatant ID from input name
        const parts = name.split('-');
        if (parts.length < 2) return;
        
        const combatantId = parts[parts.length - 1];
        const fieldName = parts.slice(0, -1).join('-');
        const state = this.npcStates.get(combatantId);
        
        if (!state) return;
        
        // Update state based on field type
        if (fieldName === 'iniMod') {
            state.iniMod = parseInt(element.value) || 0;
        } else if (fieldName === 'atMod') {
            state.atMod = parseInt(element.value) || 0;
        } else if (fieldName === 'vtMod') {
            state.vtMod = parseInt(element.value) || 0;
        } else if (fieldName === 'kombinierteAktion') {
            state.kombinierteAktion = element.checked;
        } else if (fieldName === 'diceCount') {
            state.diceCount = parseInt(element.value) || 1;
            state.diceResults = [];
            state.selectedDiceIndex = null;
            state.hasRolled = false;
        }
        
        // Save state
        await this._saveNpcState(combatantId);
        
        // Update calculated INI display directly in DOM (avoid full re-render)
        if (fieldName === 'iniMod' || fieldName === 'kombinierteAktion') {
            const totalIni = this._calculateTotalInitiative(combatantId);
            const accordion = this.element.find(`[data-combatant-id="${combatantId}"]`);
            const iniDisplay = accordion.find('.current-ini strong');
            if (iniDisplay.length) {
                iniDisplay.text(totalIni);
                iniDisplay.toggleClass('negative', totalIni < 0);
            }
        }
    }
    
    /**
     * Handle actions selection change
     * @param {Event} event
     * @private
     */
    async _onActionsChange(event) {
        const parts = event.target.name.split('-');
        const combatantId = parts[parts.length - 1];
        const state = this.npcStates.get(combatantId);
        
        if (state) {
            const selectedOptions = Array.from(event.target.value);
            state.selectedActionIds = selectedOptions.slice(0, 2);
            await this._saveNpcState(combatantId);
            
            // Update calculated INI display directly in DOM
            const totalIni = this._calculateTotalInitiative(combatantId);
            const accordion = this.element.find(`[data-combatant-id="${combatantId}"]`);
            const iniDisplay = accordion.find('.current-ini strong');
            if (iniDisplay.length) {
                iniDisplay.text(totalIni);
                iniDisplay.toggleClass('negative', totalIni < 0);
            }
        }
    }
    
    /**
     * Handle dice rolling for single NPC
     * @param {Event} event
     * @private
     */
    async _onRollDice(event) {
        event.preventDefault();
        
        const combatantId = event.currentTarget.dataset.combatantId;
        const state = this.npcStates.get(combatantId);
        
        if (state) {
            state.diceResults = [];
            
            for (let i = 0; i < state.diceCount; i++) {
                const roll = await new Roll("1d6").evaluate();
                state.diceResults.push(roll.total);
            }
            
            if (state.diceCount === 1) {
                state.selectedDiceIndex = 0;
            } else {
                state.selectedDiceIndex = null;
            }
            
            state.hasRolled = true;
            await this._saveNpcState(combatantId);
            
            // Update dice display in DOM
            const accordion = this.element.find(`[data-combatant-id="${combatantId}"]`);
            const diceSection = accordion.find('.dice-section');
            
            // Show rolled indicator in header
            const header = accordion.find('.accordion-header');
            if (!header.find('.rolled-indicator').length) {
                header.find('.accordion-icon').before('<i class="fas fa-check rolled-indicator"></i>');
            }
            
            // Build dice results HTML
            let diceHTML = '<div class="dice-results">';
            state.diceResults.forEach((result, index) => {
                const selected = (state.selectedDiceIndex === index) ? 'selected' : '';
                const title = (state.diceCount === 2) ? 'Klicken zum Auswählen' : '';
                diceHTML += `
                    <div class="dice-result ${selected}" 
                         data-combatant-id="${combatantId}"
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
            const totalIni = this._calculateTotalInitiative(combatantId);
            const iniDisplay = accordion.find('.current-ini strong');
            if (iniDisplay.length) {
                iniDisplay.text(totalIni);
                iniDisplay.toggleClass('negative', totalIni < 0);
            }
        }
    }
    
    /**
     * Handle dice selection (for 2-dice option)
     * @param {Event} event
     * @private
     */
    async _onSelectDice(event) {
        event.preventDefault();
        
        const combatantId = event.currentTarget.dataset.combatantId;
        const index = parseInt(event.currentTarget.dataset.index);
        const state = this.npcStates.get(combatantId);
        
        if (state && state.diceCount === 2) {
            state.selectedDiceIndex = index;
            await this._saveNpcState(combatantId);
            
            // Update selected class in DOM
            const accordion = this.element.find(`[data-combatant-id="${combatantId}"]`);
            accordion.find('.dice-result').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            
            // Update INI display
            const totalIni = this._calculateTotalInitiative(combatantId);
            const iniDisplay = accordion.find('.current-ini strong');
            if (iniDisplay.length) {
                iniDisplay.text(totalIni);
                iniDisplay.toggleClass('negative', totalIni < 0);
            }
        }
    }
    
    /**
     * Handle rolling dice for all NPCs
     * @param {Event} event
     * @private
     */
    async _onRollAllDice(event) {
        event.preventDefault();
        
        for (const [combatantId, state] of this.npcStates) {
            state.diceResults = [];
            
            for (let i = 0; i < state.diceCount; i++) {
                const roll = await new Roll("1d6").evaluate();
                state.diceResults.push(roll.total);
            }
            
            if (state.diceCount === 1) {
                state.selectedDiceIndex = 0;
            } else {
                state.selectedDiceIndex = null;
            }
            
            state.hasRolled = true;
            await this._saveNpcState(combatantId);
            
            // Update dice display in DOM
            const accordion = this.element.find(`[data-combatant-id="${combatantId}"]`);
            const diceSection = accordion.find('.dice-section');
            
            // Show rolled indicator in header
            const header = accordion.find('.accordion-header');
            if (!header.find('.rolled-indicator').length) {
                header.find('.accordion-icon').before('<i class="fas fa-check rolled-indicator"></i>');
            }
            
            // Build dice results HTML
            let diceHTML = '<div class="dice-results">';
            state.diceResults.forEach((result, index) => {
                const selected = (state.selectedDiceIndex === index) ? 'selected' : '';
                const title = (state.diceCount === 2) ? 'Klicken zum Auswählen' : '';
                diceHTML += `
                    <div class="dice-result ${selected}" 
                         data-combatant-id="${combatantId}"
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
            
            // Update INI display
            const totalIni = this._calculateTotalInitiative(combatantId);
            const iniDisplay = accordion.find('.current-ini strong');
            if (iniDisplay.length) {
                iniDisplay.text(totalIni);
                iniDisplay.toggleClass('negative', totalIni < 0);
            }
        }
        
        // Re-bind click handlers for all new dice
        this.element.find('.dice-result').click(this._onSelectDice.bind(this));
    }
    
    /**
     * Handle INI ansagen button click - process all NPCs
     * @param {Event} event
     * @private
     */
    async _onIniAnsagen(event) {
        event.preventDefault();
        
        const effectsToCreate = [];
        const initiativeUpdates = [];
        const chatMessages = [];
        
        for (const combatant of this.npcCombatants) {
            const state = this.npcStates.get(combatant.id);
            const actor = combatant.actor;
            
            if (!state || !actor) continue;
            
            // If NPC wasn't processed (no dice rolled), just set base initiative without effect
            if (!state.hasRolled) {
                const baseIni = this._getBaseInitiative(actor);
                initiativeUpdates.push({
                    combatantId: combatant.id,
                    value: baseIni
                });
                continue;
            }
            
            // Check if dice selected (for 2-dice option)
            if (state.diceCount === 2 && state.selectedDiceIndex === null) {
                ui.notifications.warn(`${actor.name}: Bitte einen Würfel auswählen!`);
                continue;
            }
            
            // Calculate final values
            const totalIni = this._calculateTotalInitiative(combatant.id);
            const actionMods = this._calculateActionModifiers(combatant.id);
            
            // Calculate final AT/VT modifiers
            let finalAtMod = state.atMod + actionMods.at;
            let finalVtMod = state.vtMod + actionMods.vt;
            
            if (state.kombinierteAktion) {
                finalAtMod -= 4;
                finalVtMod -= 4;
            }
            
            // Get dice result
            const diceResult = state.selectedDiceIndex !== null 
                ? state.diceResults[state.selectedDiceIndex]
                : state.diceResults[0];
            
            // Find existing combat modifier effect
            const existingEffect = actor.effects.find(e => 
                e.name.startsWith("Kampf-Modifikatoren Runde")
            );
            
            // Handle negative initiative with movedAction
            if (totalIni < 0) {
                // Update movedActionRounds
                if (!state.movedAction) {
                    state.movedActionRounds = 1;
                } else {
                    state.movedActionRounds += 1;
                }
                state.movedAction = true;
                
                // Update existing effect if present
                if (existingEffect) {
                    const iniChange = existingEffect.changes.find(c => 
                        c.key === "system.kampfwerte.ini" || c.key.includes("ini")
                    );
                    
                    if (iniChange) {
                        // Update: Alter Change + neuer Würfel
                        const oldChangeValue = parseInt(iniChange.value) || 0;
                        const newChangeValue = oldChangeValue + diceResult;
                        
                        // Update effect with new change value
                        const updatedChanges = existingEffect.changes.map(c => {
                            if (c.key === "system.kampfwerte.ini" || c.key.includes("ini")) {
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
                    }
                } else {
                    // Create new effect for first negative INI
                    const changes = [];
                    
                    // Effect speichert nur INI-Mod + Würfel
                    if (state.iniMod !== 0 || diceResult !== 0) {
                        changes.push({
                            key: "system.kampfwerte.ini",
                            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                            value: (state.iniMod + diceResult).toString()
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
                        await actor.createEmbeddedDocuments("ActiveEffect", [{
                            name: `Kampf-Modifikatoren Runde ${this.combat?.round ?? 1}`,
                            icon: "icons/svg/dice-target.svg",
                            changes: changes,
                            duration: {
                                turns: 2
                            },
                            origin: actor.uuid
                        }]);
                    }
                }
                
                // Save state with movedActionRounds
                await this._saveNpcState(combatant.id);
            } else {
                // Positive INI: Create normal effect, clear moved action state
                const changes = [];
                
                if (state.iniMod !== 0 || diceResult !== 0) {
                    changes.push({
                        key: "system.kampfwerte.ini",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: (state.iniMod + diceResult).toString()
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
                    await actor.deleteEmbeddedDocuments("ActiveEffect", [existingEffect.id]);
                }
                
                // Create new effect with duration 1
                if (changes.length > 0) {
                    await actor.createEmbeddedDocuments("ActiveEffect", [{
                        name: `Kampf-Modifikatoren Runde ${this.combat?.round ?? 1}`,
                        icon: "icons/svg/dice-target.svg",
                        changes: changes,
                        duration: {
                            turns: 1
                        },
                        origin: actor.uuid
                    }]);
                }
                
                // Clear state
                await this._clearNpcState(combatant.id);
            }
            
            // Prepare initiative update
            initiativeUpdates.push({
                combatantId: combatant.id,
                value: totalIni
            });
            
            // Prepare chat message
            chatMessages.push({
                actor: actor,
                totalIni: totalIni,
                baseIni: this._getBaseInitiative(actor),
                iniMod: state.iniMod,
                diceResult: diceResult,
                actionIds: state.selectedActionIds,
                atMod: finalAtMod,
                vtMod: finalVtMod
            });
            
            // Mark as processed
            state.processed = true;
        }
        
        // Batch set initiatives
        for (const { combatantId, value } of initiativeUpdates) {
            await this.combat.setInitiative(combatantId, value);
        }
        
        // Post chat messages
        for (const msg of chatMessages) {
            await this._postChatMessage(msg);
        }
        
        // Close dialog
        this.close();
    }
    
    /**
     * Post chat message for an NPC
     * @param {Object} messageData
     * @private
     */
    async _postChatMessage(messageData) {
        const { actor, totalIni, baseIni, iniMod, diceResult, actionIds, atMod, vtMod } = messageData;
        
        // Build action names
        const actionNames = actionIds
            .map(id => this.availableActions.find(a => (a.id || a._id) === id)?.name)
            .filter(Boolean);
        
        // Build content with actor icon
        let content = `<img src="${actor.img}" alt="${actor.name}" width="36" height="36" style="border: none; vertical-align: middle; margin-right: 8px;"/>`;
        content += `<strong>${actor.name}</strong> Initiative: ${totalIni} (Basis: ${baseIni}, Mod: ${iniMod >= 0 ? '+' : ''}${iniMod}, Würfel: ${diceResult})`;
        
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
            speaker: ChatMessage.getSpeaker({ actor: actor })
        });
    }
    
    /**
     * Handle cancel button click
     * @param {Event} event
     * @private
     */
    _onCancel(event) {
        event.preventDefault();
        this.close();
    }
}
