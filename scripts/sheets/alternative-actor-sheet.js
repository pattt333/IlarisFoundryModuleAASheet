/**
 * Alternative Actor Sheet for Ilaris
 * 
 * This class extends the base ActorSheet and provides an alternative layout
 * and enhanced functionality for Ilaris character sheets.
 */

/**
 * Get the wuerfelwurf function from the Ilaris system
 * @returns {Function|null} The wuerfelwurf function if available
 */
async function getWuerfelwurf() {
    // Try multiple ways to access the wuerfelwurf function
    
    // Method 1: Try direct import from system
    try {
        const module = await import('/systems/Ilaris/common/wuerfel.js');
        if (module.wuerfelwurf) {
            return module.wuerfelwurf;
        }
    } catch (error) {
        console.log('Import from /systems/Ilaris/common/wuerfel.js failed:', error.message);
    }
    
    // Method 2: Check global scope
    if (typeof window.wuerfelwurf !== 'undefined') {
        return window.wuerfelwurf;
    }
    
    // Method 3: Check game system object
    if (game.system && typeof game.system.wuerfelwurf === 'function') {
        return game.system.wuerfelwurf;
    }
    
    // Method 4: Try alternative system paths
    try {
        const module = await import('/systems/Ilaris/scripts/wuerfel.js');
        if (module.wuerfelwurf) {
            return module.wuerfelwurf;
        }
    } catch (error) {
        // Silent fail for alternative path
    }
    
    console.warn('wuerfelwurf function not found in any expected location');
    return null;
}
export class IlarisAlternativeActorSheet extends ActorSheet {
    
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
        // Get basic actor sheet data
        const context = await super.getData();
        const actor = this.actor;
        const data = actor.system;
        
        // Prepare context for the alternative sheet
        context.actor = actor;
        context.data = data;
        context.system = data;
        context.config = CONFIG.ILARIS || {};
        context.isCharacter = actor.type === "held";
        context.isOwner = actor.isOwner;
        context.editable = this.isEditable;
        
        // Add enriched biography if available
        if (data.notes) {
            context.enrichedBiography = await TextEditor.enrichHTML(data.notes, {
                secrets: actor.isOwner,
                rollData: actor.getRollData(),
                async: true
            });
        }
        
        return context;
    }

    /** @override */
    activateListeners(html) {
        // Call parent activateListeners for basic functionality
        super.activateListeners(html);

        // Add standard actor sheet functionality
        if (this.isEditable) {
            // Item controls
            html.find('.item-create').click(this._onItemCreate.bind(this));
            html.find('.item-edit').click(this._onItemEdit.bind(this));
            html.find('.item-delete').click(this._onItemDelete.bind(this));
            
            // Rollable elements
            html.find('.rollable').click(this._onRollable.bind(this));
            
            // Hexagon attribute rolls
            html.find('.hex-main').click(this._onRollable.bind(this));
            
            // Hexagon attribute value editing
            html.find('.hex-small').click(this._onHexagonEdit.bind(this));
        }

        // Einschränkungen interactive boxes - our custom feature
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

    /**
     * Handle rollable elements (reused from original Ilaris system)
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRollable(event) {
        let systemData = this.actor.system;
        let rolltype = $(event.currentTarget).data('rolltype');
        
        if (rolltype == 'basic') {
            // NOTE: als Einfaches Beispiel ohne weitere Dialoge und logische Verknüpfungen.
            let label = $(event.currentTarget).data('label');
            let formula = $(event.currentTarget).data('formula');
            let roll = new Roll(formula);
            console.log(formula);
            let speaker = ChatMessage.getSpeaker({ actor: this.actor });
            await roll.evaluate();
            const html_roll = await renderTemplate(
                'systems/Ilaris/templates/chat/probenchat_profan.hbs',
                { title: `${label}` },
            );
            roll.toMessage({
                speaker: speaker,
                flavor: html_roll,
            });
            return 0;
        }
        
        let globalermod = systemData.abgeleitete.globalermod;
        let pw = 0;
        let label = 'Probe';
        let dice = '3d20dl1dh1';
        
        // Dialog types that should open the system's dialog
        let dialoge = [
            'angriff_diag',
            'profan_fertigkeit_diag',
            'nahkampf_diag',
            'attribut_diag',
            'simpleprobe_diag',
            'simpleformula_diag',
            'fernkampf_diag',
            'freie_fertigkeit_diag',
            'magie_diag',
            'karma_diag',
            'uefert_diag',
        ];
        
        console.log('rolltype:', rolltype);
        if (dialoge.includes(rolltype)) {
            console.log('Opening dialog');
            // Try to call the system's dialog function if available
            const wuerfelwurfFn = await getWuerfelwurf();
            if (wuerfelwurfFn) {
                wuerfelwurfFn(event, this.actor);
                return 0;
            } else {
                console.warn('wuerfelwurf function not available - falling back to basic roll');
            }
        }
        
        // Handle different roll types
        if (rolltype == 'attribut') {
            const attribut_name = $(event.currentTarget).data('attribut');
            label = CONFIG.ILARIS.label[attribut_name] || attribut_name.toUpperCase();
            pw = systemData.attribute[attribut_name].pw;
        } else if (rolltype == 'profan_fertigkeit_pw') {
            label = $(event.currentTarget).data('fertigkeit');
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'profan_fertigkeit_pwt') {
            label = $(event.currentTarget).data('fertigkeit');
            label = label.concat(' (Talent)');
            pw = $(event.currentTarget).data('pwt');
        } else if (rolltype == 'profan_talent') {
            label = $(event.currentTarget).data('fertigkeit');
            label = label.concat(' (', $(event.currentTarget).data('talent'), ')');
            pw = $(event.currentTarget).data('pw');
        } else if (rolltype == 'freie_fertigkeit') {
            label = $(event.currentTarget).data('fertigkeit');
            pw = Number($(event.currentTarget).data('pw')) * 8 - 2;
        }
        
        let formula = `${dice} + ${pw} + ${globalermod}`;
        if (rolltype == 'at' || rolltype == 'vt') {
            formula += ` + ${systemData.modifikatoren.nahkampfmod}`;
        }
        if (rolltype == 'schaden') {
            formula = pw;
        }
        
        let roll = new Roll(formula);
        await roll.evaluate();
        let critfumble = roll.dice[0].results.find((a) => a.active == true).result;
        let fumble = false;
        let crit = false;
        if (critfumble == 20) {
            crit = true;
        } else if (critfumble == 1) {
            fumble = true;
        }
        
        let speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const html_roll = await renderTemplate(
            'systems/Ilaris/templates/chat/probenchat_profan.hbs',
            {
                title: `${label}`,
                crit: crit,
                fumble: fumble,
            },
        );
        roll.toMessage({
            speaker: speaker,
            flavor: html_roll,
        });
    }

    /**
     * Handle creating a new Owned Item for the actor
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const data = foundry.utils.duplicate(header.dataset);
        const name = `New ${type.capitalize()}`;
        const itemData = {
            name: name,
            type: type,
            system: data
        };
        delete itemData.system["type"];
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    /**
     * Handle editing an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemEdit(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        item.sheet.render(true);
    }

    /**
     * Handle deleting an existing Owned Item for the Actor
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemDelete(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.get(li.data("itemId"));
        if (item) {
            return item.delete();
        }
    }

    /**
     * Handle clickable rolls
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // Handle rolls that supply the formula directly
        if (dataset.roll) {
            let label = dataset.label ? `${dataset.label}` : 'Roll';
            let roll = new Roll(dataset.roll, this.actor.getRollData());
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        }
    }

    
}