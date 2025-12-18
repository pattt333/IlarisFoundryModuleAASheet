/**
 * Alternative Actor Sheet for Ilaris
 * 
 * This class extends the base ActorSheet and provides an alternative layout
 * with enhanced functionality. It follows the same pattern as many successful
 * character sheet modules by extending the base Foundry ActorSheet directly.
 */
import { HeldenSheet } from "../../../../systems/Ilaris/scripts/sheets/helden.js";
import { AccordionManager } from "../components/accordion-manager.js";
import { FavoritesManager } from "../components/favorites-manager.js";

export class IlarisAlternativeActorSheet extends HeldenSheet {
    
    constructor(...args) {
        super(...args);
        this.accordionManager = new AccordionManager(this.actor.id);
        this.favoritesManager = new FavoritesManager(this.actor.id);
    }
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ilaris", "sheet", "actor", "alternative"],
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/alternative-actor-sheet.hbs",
            width: 820,
            height: 900,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "main"
            }],
            resizable: true,
            scrollY: [".sheet-body"]
        });
    }

    /** @override */
    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        
        console.log(buttons)
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
            // Get all the data from the original system's actor sheet
            const context = await super.getData();
            
            // Validate that we have the required data
            if (!context || !context.actor) {
                console.error('IlarisAlternativeActorSheet | Invalid context from parent getData');
                throw new Error('Failed to get valid context from parent sheet');
            }
            
            // Ensure CONFIG.ILARIS is available
            if (!CONFIG.ILARIS) {
                console.warn('IlarisAlternativeActorSheet | CONFIG.ILARIS not available, initializing empty config');
                CONFIG.ILARIS = {};
            }
            
            console.log('IlarisAlternativeActorSheet | Successfully retrieved context');
            return context;
            
        } catch (error) {
            console.error('IlarisAlternativeActorSheet | Error in getData:', error);
            
            // Fallback to basic context if parent fails
            const context = {
                actor: this.actor,
                data: this.actor.system,
                system: this.actor.system,
                config: CONFIG.ILARIS || {},
                isCharacter: this.actor.type === "held",
                isOwner: this.actor.isOwner,
                editable: this.isEditable
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
        }
        
        // Initialize accordion functionality
        this.accordionManager.initialize(html);
        
        // Initialize favorites component
        this.favoritesManager.initialize(html);
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
                current: 'AsP/Eng aktuell',
                blocked: 'gAsP/gEng (geblockt)',
                title: 'AsP/Energie bearbeiten'
            };
        } else if (energyType === 'kap') {
            currentValue = this.actor.system.abgeleitete.kap_stern || 0;
            blockedValue = this.actor.system.abgeleitete.gkap || 0;
            maxValue = this.actor.system.abgeleitete.kap || 0;
            labels = {
                current: 'KaP/Eng aktuell',
                blocked: 'gKaP/gEng (geblockt)',
                title: 'KaP/Energie bearbeiten'
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
                    <input type="number" name="wunden" value="${currentWounds}" min="0" />
                    <p class="hint">Das sind die Trefferpunkte, die du erlitten hast bis jetzt.</p>
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
                            'system.gesundheit.wunden': Math.max(newWounds, 0)
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
     * Handle editing stat values like global modifier
     * @param {Event} event   The originating click event
     * @private
     */
    async _onEditStat(event) {
        event.preventDefault();
        
        const statField = event.currentTarget.dataset.statField;
        const currentValue = foundry.utils.getProperty(this.actor, statField) || 0;
        
        // Get a friendly label from the title or stat-label
        const label = $(event.currentTarget).find('.stat-label').text() || 'Wert';
        const title = $(event.currentTarget).find('i').attr('title') || label;
        
        // Create dialog HTML
        const content = `
            <form>
                <div class="form-group">
                    <label>${title}:</label>
                    <input type="number" name="value" value="${currentValue}" step="1" />
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
                        const newValue = parseInt(html.find('[name="value"]').val()) || 0;
                        
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
     * Handle accordion toggle for item details
     * @param {Event} event   The originating click event
     * @private
     */
    _onAccordionToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const accordionItem = $(event.currentTarget).closest('.accordion-item');
        const itemId = accordionItem.data('item-id');
        const isExpanded = accordionItem.hasClass('expanded');
        
        // Close all other accordions in the same list
        accordionItem.siblings('.accordion-item').removeClass('expanded');
        
        // Toggle current accordion
        if (isExpanded) {
            accordionItem.removeClass('expanded');
            this._removeAccordionState(itemId);
        } else {
            accordionItem.addClass('expanded');
            this._saveAccordionState(itemId);
        }
    }

    /**
     * Get the storage key for accordion states
     * @private
     */
    _getAccordionStorageKey() {
        return `ilaris-accordion-states-${this.actor.id}`;
    }

    /**
     * Save accordion state for an item
     * @param {string} itemId - The item ID
     * @private
     */
    _saveAccordionState(itemId) {
        const storageKey = this._getAccordionStorageKey();
        let states = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        states[itemId] = true;
        sessionStorage.setItem(storageKey, JSON.stringify(states));
    }

    /**
     * Remove accordion state for an item
     * @param {string} itemId - The item ID
     * @private
     */
    _removeAccordionState(itemId) {
        const storageKey = this._getAccordionStorageKey();
        let states = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        delete states[itemId];
        sessionStorage.setItem(storageKey, JSON.stringify(states));
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
        
        // Debug logging
        console.log('Hexagon edit clicked for attribute:', attributeKey);
        console.log('Actor system data:', this.actor.system);
        console.log('Attributes:', this.actor.system.attribute);
        
        // Get current value from the actor
        const attributeData = this.actor.system.attribute[attributeKey];
        const currentValue = attributeData?.wert || 0;
        
        console.log('Current attribute data:', attributeData);
        console.log('Current value:', currentValue);
        
        // Create a simple dialog for editing the attribute value
        const content = `
            <form>
                <div class="form-group">
                    <label for="attribute-value">Attribute Value for ${attributeKey.toUpperCase()}:</label>
                    <input type="number" id="attribute-value" name="value" value="${currentValue}" min="0" max="20" step="1" />
                </div>
            </form>
        `;
        
        new Dialog({
            title: `Edit ${attributeKey.toUpperCase()} Value`,
            content: content,
            buttons: {
                save: {
                    label: "Save",
                    callback: async (html) => {
                        const newValue = parseInt(html.find('#attribute-value').val()) || 0;
                        const updatePath = `system.attribute.${attributeKey}.wert`;
                        
                        console.log('Updating attribute:', attributeKey, 'to value:', newValue);
                        console.log('Update path:', updatePath);
                        
                        await this.actor.update({
                            [updatePath]: newValue
                        });
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            },
            default: "save",
            close: () => {}
        }).render(true);
    }

    /** @override */
    async _updateObject(event, formData) {
        const result = await super._updateObject(event, formData);
        
        return result;
    }

    /** @override */
    async close(options = {}) {
        // Clear accordion states when sheet is closed for good
        this.accordionManager.clearAccordionStates();
        return super.close(options);
    }

    /**
     * Clear all accordion states from session storage
     * @private
     */
    _clearAccordionStates() {
        const storageKey = this._getAccordionStorageKey();
        sessionStorage.removeItem(storageKey);
    }

    /**
     * Handle copying the actor's UUID to clipboard
     * @private
     */
    _onCopyUUID() {
        const uuid = this.actor.uuid;
        navigator.clipboard.writeText(uuid).then(() => {
            ui.notifications.info(`Copied UUID: ${uuid}`);
        }).catch(err => {
            console.error('Failed to copy UUID:', err);
            ui.notifications.error('Failed to copy UUID to clipboard');
        });
    }


}