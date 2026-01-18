/**
 * Alternative Creature Sheet for Ilaris
 * 
 * This class extends the KreaturSheet from the Ilaris system and provides an alternative layout
 * with a combat-focused interface optimized for GM use with NPCs and monsters.
 * 
 * Design Philosophy:
 * - Combat-First: Most important information (attacks, effects, spells) in the default "Kampf" tab
 * - Statblock-Style: Dense, text-focused presentation for quick reference during play
 * - Component Reuse: Leverages existing health-resources, energy-resources, and effect-card components
 * - Visual Consistency: Maintains the same hexagon attributes and styling as the alternative character sheet
 * - Flat Structure: No accordions - all information immediately visible for fast access
 */
import { KreaturSheet } from "../../../../systems/Ilaris/scripts/sheets/kreatur.js";
import { advanceEffectTime } from "../utilities.js";

export class IlarisAlternativeCreatureSheet extends KreaturSheet {
    
    constructor(...args) {
        super(...args);
    }
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ilaris", "sheet", "actor", "alternative", "kreatur"],
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/alternative-creature-sheet.hbs",
            width: 820,
            height: 900,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "kampf"
            }],
            resizable: true,
            scrollY: [".sheet-body"]
        });
    }

    /** @override */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        
        // Remove labels for cleaner header
        buttons.forEach(btn => btn.label = '');
        
        // Add Copy UUID button
        buttons.unshift({
            label: "",
            class: "copy-uuid",
            icon: "fa-solid fa-passport",
            onclick: () => this._onCopyUUID()
        });
        
        return buttons;
    }

    /** @override */
    async getData() {
        try {
            // Get all the data from the original system's kreatur sheet
            const context = await super.getData();
            
            // Validate that we have the required data
            if (!context || !context.actor) {
                console.error('IlarisAlternativeCreatureSheet | Invalid context from parent getData');
                throw new Error('Failed to get valid context from parent sheet');
            }
            
            // Ensure CONFIG.ILARIS is available
            if (!CONFIG.ILARIS) {
                console.warn('IlarisAlternativeCreatureSheet | CONFIG.ILARIS not available, initializing empty config');
                CONFIG.ILARIS = {};
            }
            
            // Add creature-specific data (already added by parent, but ensure it exists)
            context.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options || {});
            
            // Add effect-items for the Kampf-Tab (active effects)
            context.actor.effectItems = this.actor.items.filter(i => i.type === "effect-item");
            
            // Check if creature is a caster
            context.isCaster = this.actor.system.abgeleitete?.zauberer || this.actor.system.abgeleitete?.geweihter;

            // Add canAdvanceTime flag for effect time-advance button
            context.canAdvanceTime = this.actor.isOwner;
            
            console.log('IlarisAlternativeCreatureSheet | Successfully retrieved context');
            return context;
            
        } catch (error) {
            console.error('IlarisAlternativeCreatureSheet | Error in getData:', error);
            
            // Fallback to basic context if parent fails
            const context = {
                actor: this.actor,
                data: this.actor.system,
                system: this.actor.system,
                config: CONFIG.ILARIS || {},
                isCreature: this.actor.type === "kreatur",
                isOwner: this.actor.isOwner,
                editable: this.isEditable,
                effectItems: this.actor.items.filter(i => i.type === "effect-item"),
                kreaturItemOptions: foundry.utils.duplicate(CONFIG.ILARIS?.kreatur_item_options || {}),
                isCaster: this.actor.system.abgeleitete?.zauberer || this.actor.system.abgeleitete?.geweihter
            };
            
            return context;
        }
    }

    /** @override */
    activateListeners(html) {
        // Call parent activateListeners to get ALL original functionality
        super.activateListeners(html);

        // Add only our custom alternative sheet functionality
        if (this.isEditable) {
            // Hexagon attribute value editing (our custom feature)
            html.find('.hex-main').click(this._onRollable.bind(this));
            html.find('.hex-small').click(this._onHexagonEdit.bind(this));
            
            // Energy settings icon (our custom feature)
            html.find('.energy-settings[data-energy-type]').click(this._onEnergySettings.bind(this));
            
            // Health settings icon (our custom feature)
            html.find('.energy-settings[data-health-settings]').click(this._onHealthSettings.bind(this));
            
            // Editable stats (our custom feature)
            html.find('.editable-stat').click(this._onEditStat.bind(this));
            
            // Effect library open button (our custom feature)
            html.find('.effect-library-open').click(this._onOpenEffectLibrary.bind(this));
            
            // Stack effect controls (our custom feature)
            html.on("click", ".effect-stack-increase", this._onEffectStackIncrease.bind(this));
            html.on("click", ".effect-stack-decrease", this._onEffectStackDecrease.bind(this));

            // Effect time-advance button (our custom feature)
            html.find('.effect-advance-time').click(this._onEffectAdvanceTime.bind(this));
        }
    }

    /**
     * Handle energy settings icon click - opens dialog to edit energy values
     * @param {Event} event   The originating click event
     * @private
     */
    async _onEnergySettings(event) {
        event.preventDefault();
        const energyType = event.currentTarget.dataset.energyType;
        
        // Determine which energy fields to edit based on type
        let currentValue, blockedValue, maxValue, labels;
        
        if (energyType === 'asp') {
            currentValue = this.actor.system.abgeleitete.asp_stern || 0;
            blockedValue = this.actor.system.abgeleitete.gasp || 0;
            maxValue = this.actor.system.abgeleitete.asp || 0;
            labels = {
                current: 'Eng aktuell',
                blocked: 'gEng (geblockt)',
                title: 'Energie bearbeiten'
            };
        } else if (energyType === 'kap') {
            currentValue = this.actor.system.abgeleitete.kap_stern || 0;
            blockedValue = this.actor.system.abgeleitete.gkap || 0;
            maxValue = this.actor.system.abgeleitete.kap || 0;
            labels = {
                current: 'Eng aktuell',
                blocked: 'gEng (geblockt)',
                title: 'Energie bearbeiten'
            };
        }
        
        const availableMax = maxValue - blockedValue;
        
        // Create dialog HTML
        const content = `
            <form>
                <div class="form-group">
                    <label>${labels.current}:</label>
                    <input type="number" name="current" value="${currentValue}" min="0" max="${availableMax}" />
                    <p class="hint">Maximum: ${availableMax}</p>
                </div>
                <div class="form-group">
                    <label>${labels.blocked}:</label>
                    <input type="number" name="blocked" value="${blockedValue}" min="0" max="${maxValue}" />
                    <p class="hint">Maximum: ${maxValue}</p>
                </div>
            </form>
        `;
        
        // Show dialog
        new Dialog({
            title: labels.title,
            content: content,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Speichern",
                    callback: async (html) => {
                        const newCurrent = parseInt(html.find('[name="current"]').val());
                        const newBlocked = parseInt(html.find('[name="blocked"]').val());
                        
                        const updateData = {};
                        if (energyType === 'asp') {
                            updateData['system.abgeleitete.asp_stern'] = Math.min(newCurrent, maxValue - newBlocked);
                            updateData['system.abgeleitete.gasp'] = Math.min(newBlocked, maxValue);
                        } else if (energyType === 'kap') {
                            updateData['system.abgeleitete.kap_stern'] = Math.min(newCurrent, maxValue - newBlocked);
                            updateData['system.abgeleitete.gkap'] = Math.min(newBlocked, maxValue);
                        }
                        
                        await this.actor.update(updateData);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen"
                }
            },
            default: "save"
        }).render(true);
    }

    /**
     * Handle health settings icon click - opens dialog to edit wounds
     * @param {Event} event   The originating click event
     * @private
     */
    async _onHealthSettings(event) {
        event.preventDefault();
        
        const currentWounds = this.actor.system.gesundheit.wunden || 0;
        
        // Create dialog HTML
        const content = `
            <form>
                <div class="form-group">
                    <label>Trefferpunkte erlitten:</label>
                    <input type="number" name="wunden" value="0" />
                    <p class="hint">Das sind die Trefferpunkte, die du erlitten hast. Negative Werte bedeuten Heilung.</p>
                </div>
            </form>
        `;
        
        // Show dialog
        new Dialog({
            title: 'Wunden bearbeiten',
            content: content,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Speichern",
                    callback: async (html) => {
                        const newWounds = parseInt(html.find('[name="wunden"]').val());
                        
                        await this.actor.update({
                            'system.gesundheit.wunden': Math.max(newWounds + currentWounds, 0)
                        });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen"
                }
            },
            default: "save"
        }).render(true);
    }

    /**
     * Handle opening the effect library compendium
     * @param {Event} event   The originating click event
     * @private
     */
    async _onOpenEffectLibrary(event) {
        event.preventDefault();
        
        const packId = event.currentTarget.dataset.pack;
        const pack = game.packs.get(packId);
        
        if (!pack) {
            ui.notifications.error(`Kompendium ${packId} konnte nicht gefunden werden.`);
            return;
        }
        
        // Open the compendium
        pack.render(true);
        
        // Show info notification to the user
        ui.notifications.info("Ziehe einen Effekt aus der Bibliothek auf das Charakterblatt, um nur den Effekt hinzuzufügen.");
    }

    /**
     * Handle editing stat values like global modifier, HP-Max, or Kreaturentyp
     * @param {Event} event   The originating click event
     * @private
     */
    async _onEditStat(event) {
        event.preventDefault();
        
        const statField = event.currentTarget.dataset.statField;
        const currentValue = foundry.utils.getProperty(this.actor, statField) || '';
        
        // Get a friendly label from the title or stat-label
        const label = $(event.currentTarget).find('.stat-label').text() || 'Wert';
        const title = $(event.currentTarget).find('i').attr('title') || label;
        
        // Determine input type based on field
        const inputType = statField.includes('hp.max') || statField.includes('mod') ? 'number' : 'text';
        
        // Create dialog HTML
        const content = `
            <form>
                <div class="form-group">
                    <label>${title}:</label>
                    <input type="${inputType}" name="value" value="${currentValue}" ${inputType === 'number' ? 'step="1"' : ''} />
                </div>
            </form>
        `;
        
        // Show dialog
        new Dialog({
            title: `${title} bearbeiten`,
            content: content,
            buttons: {
                save: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Speichern",
                    callback: async (html) => {
                        let newValue = html.find('[name="value"]').val();
                        
                        // Parse as number if needed
                        if (inputType === 'number') {
                            newValue = parseInt(newValue) || 0;
                        }
                        
                        await this.actor.update({
                            [statField]: newValue
                        });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen"
                }
            },
            default: "save"
        }).render(true);
    }

    /**
     * Handle clicking on small hexagon to edit attribute values
     * @param {Event} event   The originating click event
     * @private
     */
    async _onHexagonEdit(event) {
        event.preventDefault();
        event.stopPropagation(); // Prevent triggering parent hex-main click
        
        // Get the attribute key from the data attribute
        const attributeKey = $(event.currentTarget).data('attribute');
        
        // Get current value from the actor
        const attributeData = this.actor.system.attribute[attributeKey];
        const currentValue = attributeData?.wert || 0;
        
        // Create a simple dialog for editing the attribute value
        const content = `
            <form>
                <div class="form-group">
                    <label for="attribute-value">Attribut-Wert für ${attributeKey.toUpperCase()}:</label>
                    <input type="number" id="attribute-value" name="value" value="${currentValue}" min="0" max="20" step="1" />
                </div>
            </form>
        `;
        
        new Dialog({
            title: `${attributeKey.toUpperCase()} bearbeiten`,
            content: content,
            buttons: {
                save: {
                    label: "Speichern",
                    callback: async (html) => {
                        const newValue = parseInt(html.find('#attribute-value').val()) || 0;
                        const updatePath = `system.attribute.${attributeKey}.wert`;
                        
                        await this.actor.update({
                            [updatePath]: newValue
                        });
                    }
                },
                cancel: {
                    label: "Abbrechen"
                }
            },
            default: "save"
        }).render(true);
    }

    /** @override */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        
        // If dropping an Item from the effect library compendium, transfer only its effects
        if (data.type === "Item" && data.uuid?.includes("ilaris-alternative-actor-sheet.effect-library")) {
            event.preventDefault();
            
            try {
                // Get the item from the UUID
                const item = await fromUuid(data.uuid);
                
                if (!item) {
                    ui.notifications.warn("Item konnte nicht gefunden werden.");
                    return;
                }
                
                // Check if the item has effects
                const effects = item.effects?.contents || [];
                
                if (effects.length === 0) {
                    ui.notifications.warn(`${item.name} hat keine Effekte zum übertragen.`);
                    return;
                }
                
                // Transfer only the effects to the actor
                const effectData = effects.map(e => {
                    const data = e.toObject();
                    // Update the origin to point to this actor
                    data.origin = this.actor.uuid;
                    return data;
                });
                
                // Use shared utility function for adding effects with automatic stacking
                for (const newEffectData of effectData) {
                    await window.IlarisAlternativeActorSheet.addEffectWithStacking(this.actor, newEffectData);
                }
                
                ui.notifications.info(`Effekt(e) von ${item.name} wurden verarbeitet.`);
                
            } catch (error) {
                console.error("Error transferring effects:", error);
                ui.notifications.error("Fehler beim Übertragen der Effekte.");
            }
            
            return;
        }
        
        // For all other drops, use the default behavior
        return super._onDrop(event);
    }

    /**
     * Handle click on stack increase button
     * @param {Event} event - The originating click event
     * @private
     */
    async _onEffectStackIncrease(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const effectId = event.currentTarget.dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        
        if (!effect) {
            ui.notifications.error("Effect nicht gefunden");
            return;
        }
        
        await this._increaseEffectStack(effect);
    }
    
    /**
     * Handle click on stack decrease button
     * @param {Event} event - The originating click event
     * @private
     */
    async _onEffectStackDecrease(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const effectId = event.currentTarget.dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        
        if (!effect) {
            ui.notifications.error("Effect nicht gefunden");
            return;
        }
        
        await this._decreaseEffectStack(effect);
    }
    
    /**
     * Increase the stack count of a stack effect
     * Delegates to the shared utility function
     * @param {ActiveEffect} effect - The effect to increase
     * @private
     */
    async _increaseEffectStack(effect) {
        await window.IlarisAlternativeActorSheet.increaseEffectStack(effect);
    }
    
    /**
     * Decrease the stack count of a stack effect
     * If stack reaches 0, the effect is deleted
     * @param {ActiveEffect} effect - The effect to decrease
     * @private
     */
    async _decreaseEffectStack(effect) {
        const currentStacks = effect.changes.length;
        
        // At 1 stack: delete the effect completely
        if (currentStacks <= 1) {
            await effect.delete();
            ui.notifications.info(`${effect.name} entfernt (0 Stacks)`);
            return;
        }
        
        // Remove the last change from the array
        const updatedChanges = effect.changes.slice(0, -1);
        
        await effect.update({
            changes: updatedChanges
        });
        
        ui.notifications.info(`${effect.name} Stack reduziert auf ${updatedChanges.length}`);
    }

    /**
     * Advance time for all temporary effects
     * Decrements duration.turns and duration.rounds by 1 for all effects that have them
     * Effects reaching 0 duration are automatically removed by the Foundry system
     * @param {Event} event - The originating click event
     * @private
     */
    async _onEffectAdvanceTime(event) {
        event.preventDefault();
        
        try {
            // Use shared utility function to advance effect time
            const effectsReduced = await advanceEffectTime(this.actor);
            
            // Check if there are any temporary effects
            if (effectsReduced === 0) {
                ui.notifications.info("Keine temporären Effekte vorhanden");
                return;
            }
            
            // Show success notification
            ui.notifications.info("Temporäre Effekte wurden um 1 Zeiteinheit reduziert");
            
        } catch (error) {
            console.error('IlarisAlternativeActorSheet | Error advancing effect time:', error);
            ui.notifications.error("Fehler beim Vorrücken der Effekt-Zeit");
        }
    }

    /**
     * Handle copying the actor's UUID to clipboard
     * @private
     */
    _onCopyUUID() {
        const uuid = this.actor.uuid;
        navigator.clipboard.writeText(uuid).then(() => {
            ui.notifications.info(`UUID kopiert: ${uuid}`);
        }).catch(err => {
            console.error('Failed to copy UUID:', err);
            ui.notifications.error('Fehler beim Kopieren der UUID');
        });
    }
}
