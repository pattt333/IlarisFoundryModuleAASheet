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
            width: 600,
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
                hasRolled: state.hasRolled
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
        
        // Load available actions from compendium only (for NPCs)
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
                        id: item.id,
                        name: item.name,
                        description: item.system?.description ?? "",
                        img: item.img,
                        source: "compendium",
                        uuid: item.uuid,
                        effects: item.effects?.contents ?? []
                    });
                }
            }
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
        
        const baseIni = this._getBaseInitiative(combatant.actor);
        
        // Get the lowest INI mod from selected actions
        let actionIniMod = 0;
        if (state.selectedActionIds.length > 0) {
            const actionMods = state.selectedActionIds.map(id => {
                const action = this.availableActions.find(a => (a.id || a._id) === id);
                if (action?.effects) {
                    for (const effect of action.effects) {
                        const iniChange = effect.changes?.find(c => 
                            c.key === "system.abgeleitete.ini" || c.key.includes("ini")
                        );
                        if (iniChange) {
                            return parseInt(iniChange.value) || 0;
                        }
                    }
                }
                return 0;
            });
            actionIniMod = Math.min(...actionMods, 0);
        }
        
        // Get dice result
        const diceResult = state.selectedDiceIndex !== null 
            ? (state.diceResults[state.selectedDiceIndex] ?? 0)
            : (state.diceResults[0] ?? 0);
        
        return baseIni + state.iniMod + actionIniMod + diceResult;
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
        
        // Input fields (delegated for each NPC accordion)
        html.find('input[name^="iniMod-"]').change(this._onIniModChange.bind(this));
        html.find('input[name^="atMod-"]').change(this._onAtModChange.bind(this));
        html.find('input[name^="vtMod-"]').change(this._onVtModChange.bind(this));
        html.find('input[name^="kombinierteAktion-"]').change(this._onKombinierteAktionChange.bind(this));
        html.find('select[name^="diceCount-"]').change(this._onDiceCountChange.bind(this));
        html.find('select[name^="actions-"]').change(this._onActionsChange.bind(this));
        
        // Dice rolling
        html.find('.roll-dice-btn').click(this._onRollDice.bind(this));
        html.find('.dice-result').click(this._onSelectDice.bind(this));
        
        // Mass dice rolling
        html.find('.roll-all-dice-btn').click(this._onRollAllDice.bind(this));
        
        // Main buttons
        html.find('.ini-ansagen-btn').click(this._onIniAnsagen.bind(this));
        html.find('.cancel-btn').click(this._onCancel.bind(this));
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
     * Get combatant ID from input name
     * @param {string} name
     * @returns {string}
     * @private
     */
    _getCombatantIdFromName(name) {
        return name.split("-").pop();
    }
    
    /**
     * Handle INI modifier change
     * @param {Event} event
     * @private
     */
    async _onIniModChange(event) {
        const combatantId = this._getCombatantIdFromName(event.target.name);
        const state = this.npcStates.get(combatantId);
        if (state) {
            state.iniMod = parseInt(event.target.value) || 0;
            await this._saveNpcState(combatantId);
            this.render(false);
        }
    }
    
    /**
     * Handle AT modifier change
     * @param {Event} event
     * @private
     */
    async _onAtModChange(event) {
        const combatantId = this._getCombatantIdFromName(event.target.name);
        const state = this.npcStates.get(combatantId);
        if (state) {
            state.atMod = parseInt(event.target.value) || 0;
            await this._saveNpcState(combatantId);
            this.render(false);
        }
    }
    
    /**
     * Handle VT modifier change
     * @param {Event} event
     * @private
     */
    async _onVtModChange(event) {
        const combatantId = this._getCombatantIdFromName(event.target.name);
        const state = this.npcStates.get(combatantId);
        if (state) {
            state.vtMod = parseInt(event.target.value) || 0;
            await this._saveNpcState(combatantId);
            this.render(false);
        }
    }
    
    /**
     * Handle kombinierte Aktion checkbox change
     * @param {Event} event
     * @private
     */
    async _onKombinierteAktionChange(event) {
        const combatantId = this._getCombatantIdFromName(event.target.name);
        const state = this.npcStates.get(combatantId);
        if (state) {
            state.kombinierteAktion = event.target.checked;
            await this._saveNpcState(combatantId);
            this.render(false);
        }
    }
    
    /**
     * Handle dice count selection change
     * @param {Event} event
     * @private
     */
    async _onDiceCountChange(event) {
        const combatantId = this._getCombatantIdFromName(event.target.name);
        const state = this.npcStates.get(combatantId);
        if (state) {
            state.diceCount = parseInt(event.target.value) || 1;
            state.diceResults = [];
            state.selectedDiceIndex = null;
            state.hasRolled = false;
            await this._saveNpcState(combatantId);
            this.render(false);
        }
    }
    
    /**
     * Handle actions selection change
     * @param {Event} event
     * @private
     */
    async _onActionsChange(event) {
        const combatantId = this._getCombatantIdFromName(event.target.name);
        const state = this.npcStates.get(combatantId);
        if (state) {
            const selectedOptions = Array.from(event.target.selectedOptions);
            state.selectedActionIds = selectedOptions.map(opt => opt.value).slice(0, 2);
            await this._saveNpcState(combatantId);
            this.render(false);
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
            this.render(false);
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
            this.render(false);
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
        }
        
        this.render(false);
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
            
            // Determine effect duration
            const effectDuration = totalIni < 0 ? 2 : 1;
            
            // Build Active Effect changes
            const changes = [];
            
            if (state.iniMod !== 0) {
                changes.push({
                    key: "system.abgeleitete.ini",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                    value: state.iniMod.toString()
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
            const oldEffects = actor.effects.filter(e => 
                e.name.startsWith("Kampf-Modifikatoren Runde")
            );
            if (oldEffects.length > 0) {
                await actor.deleteEmbeddedDocuments("ActiveEffect", oldEffects.map(e => e.id));
            }
            
            // Prepare effect creation if there are changes
            if (changes.length > 0) {
                effectsToCreate.push({
                    actor: actor,
                    effectData: {
                        name: `Kampf-Modifikatoren Runde ${this.combat?.round ?? 1}`,
                        icon: "icons/svg/dice-target.svg",
                        changes: changes,
                        duration: {
                            turns: effectDuration
                        },
                        origin: actor.uuid
                    }
                });
            }
            
            // Prepare initiative update
            initiativeUpdates.push({
                combatantId: combatant.id,
                value: totalIni
            });
            
            // Prepare chat message
            const diceResult = state.selectedDiceIndex !== null 
                ? state.diceResults[state.selectedDiceIndex]
                : state.diceResults[0];
            
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
            
            // Clear persisted state
            await this._clearNpcState(combatant.id);
        }
        
        // Batch create effects
        for (const { actor, effectData } of effectsToCreate) {
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
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
