/**
 * Alternative Actor Sheet for Ilaris
 * 
 * This class extends the original IlarisActorSheet and provides an alternative layout
 * and enhanced functionality while inheriting all the original system methods.
 */

// Import the original Ilaris actor sheet class
let IlarisActorSheet;

// Try to import the original actor sheet class
try {
    // Import the original system's actor sheet
    const systemModule = await import('/systems/Ilaris/scripts/sheets/actor.js');
    IlarisActorSheet = systemModule.IlarisActorSheet;
    console.log('Successfully imported IlarisActorSheet from system');
} catch (error) {
    console.warn('Could not import IlarisActorSheet from system, falling back to ActorSheet:', error);
    IlarisActorSheet = ActorSheet;
}

export class IlarisAlternativeActorSheet extends IlarisActorSheet {
    
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
    async getData() {
        // Get all the data from the original system's actor sheet
        const context = await super.getData();
        console.log('IlarisAlternativeActorSheet | getData context:', context);
        // Add any additional context we need for our alternative template
        // The original system already provides everything we need
        
        return context;
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
}