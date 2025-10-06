/**
 * Alternative Actor Sheet for Ilaris
 * 
 * This class extends the base ActorSheet and provides an alternative layout
 * with enhanced functionality. It follows the same pattern as many successful
 * character sheet modules by extending the base Foundry ActorSheet directly.
 */
import { HeldenSheet } from "../../../../systems/Ilaris/scripts/sheets/helden.js";
import { AccordionManager } from "../accordion-manager.js";
import { FavoritesManager } from "../favorites-manager.js";

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
            width: 800,
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
        }

        // Einschränkungen interactive boxes (our custom feature)
        html.find('.einschraenkung-box').click(this._onEinschraenkungClick.bind(this));
        
        // Initialize accordion functionality
        this.accordionManager.initialize(html);
        
        // Initialize favorites component
        this.favoritesManager.initialize(html);
        
        // Initialize einschränkungen display
        this._updateEinschraenkungsDisplay(html);
    }



    /**
     * Handle clicking on einschränkung boxes
     * @param {Event} event   The originating click event
     * @private
     */
    async _onEinschraenkungClick(event) {
        event.preventDefault();
        const box = event.currentTarget;
        const index = parseInt(box.dataset.index);
        const currentState = box.dataset.state;
        
        let wunden = this.actor.system.gesundheit.wunden || 0;
        let erschoepfung = this.actor.system.gesundheit.erschoepfung || 0;
        
        // Cycle through states: empty -> wound -> exhaustion -> empty
        if (currentState === 'empty') {
            // Add a wound
            wunden = Math.min(wunden + 1, 8);
        } else if (currentState === 'wound') {
            // Convert wound to exhaustion
            wunden = Math.max(wunden - 1, 0);
            erschoepfung = Math.min(erschoepfung + 1, 8);
        } else if (currentState === 'exhaustion') {
            // Remove exhaustion
            erschoepfung = Math.max(erschoepfung - 1, 0);
        }
        
        // Update the actor
        await this.actor.update({
            'system.gesundheit.wunden': wunden,
            'system.gesundheit.erschoepfung': erschoepfung
        });
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
     * Update the visual display of einschränkungen boxes
     * @param {jQuery} html   The rendered HTML
     * @private
     */
    _updateEinschraenkungsDisplay(html) {
        const wunden = this.actor.system.gesundheit.wunden || 0;
        const erschoepfung = this.actor.system.gesundheit.erschoepfung || 0;
        
        const boxes = html.find('.einschraenkung-box');
        
        // Reset all boxes
        boxes.each((i, box) => {
            box.dataset.state = 'empty';
        });
        
        // Fill wounds first (priority logic)
        for (let i = 0; i < wunden && i < 8; i++) {
            boxes[i].dataset.state = 'wound';
        }
        
        // Fill exhaustion after wounds
        for (let i = wunden; i < wunden + erschoepfung && i < 8; i++) {
            boxes[i].dataset.state = 'exhaustion';
        }
        
        // Update death warning visibility
        const total = wunden + erschoepfung;
        const deathWarning = html.find('.death-warning');
        if (total >= 9) {
            deathWarning.show();
        } else {
            deathWarning.hide();
        }
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
        
        // Update display after form submission
        setTimeout(() => {
            const html = $(this.form);
            this._updateEinschraenkungsDisplay(html);
        }, 100);
        
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