/**
 * Alternative Actor Sheet for Ilaris
 * 
 * This class extends the base IlarisActorSheet to provide an alternative layout
 * and enhanced functionality for character sheets.
 */
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
        // Get base data from parent
        const context = super.getData();
        const actorData = this.actor.toObject(false);
        
        // Add the actor's data to context data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;
        
        // Prepare character data and items.
        if (actorData.type == 'held') {
            this._prepareCharacterData(context);
        } else if (actorData.type == 'kreatur') {
            this._prepareNpcData(context);
        }
        
        // Prepare items
        this._prepareItems(context);
        
        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Enrich biography info for display
        context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.notes || "", { async: true });
        
        return context;
    }

    /**
     * Organize and classify Items for Character sheets.
     * @param {Object} context The actor context data.
     * @return {undefined}
     */
    _prepareCharacterData(context) {
        // Handle ability scores.
        if (context.system.attribute) {
            for (let [k, v] of Object.entries(context.system.attribute)) {
                v.label = game.i18n?.localize(`ILARIS.${k}`) || k.charAt(0).toUpperCase() + k.slice(1);
            }
        }
    }

    /**
     * Organize and classify Items for NPC sheets.
     * @param {Object} context The actor context data.
     * @return {undefined}
     */
    _prepareNpcData(context) {
        this._prepareCharacterData(context);
    }

    /**
     * Organize and classify Items for all sheet types.
     * @param {Object} context The actor data context.
     * @return {undefined}
     */
    _prepareItems(context) {
        // Initialize containers.
        const waffen = [];
        const ruestungen = [];
        const fertigkeiten = [];
        const talente = [];
        const vorteile = [];
        const gegenstaende = [];
        const zauber = [];
        const liturgien = [];

        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // Append to appropriate array
            if (i.type === 'nahkampfwaffe' || i.type === 'fernkampfwaffe') {
                waffen.push(i);
            } else if (i.type === 'ruestung') {
                ruestungen.push(i);
            } else if (i.type === 'fertigkeit' || i.type === 'freie_fertigkeit' || i.type === 'uebernatuerliche_fertigkeit') {
                fertigkeiten.push(i);
            } else if (i.type === 'talent') {
                talente.push(i);
            } else if (i.type === 'vorteil' || i.type === 'eigenheit') {
                vorteile.push(i);
            } else if (i.type === 'gegenstand') {
                gegenstaende.push(i);
            } else if (i.type === 'zauber') {
                zauber.push(i);
            } else if (i.type === 'liturgie') {
                liturgien.push(i);
            }
        }

        // Assign and return
        context.waffen = waffen;
        context.ruestungen = ruestungen;
        context.fertigkeiten = fertigkeiten;
        context.talente = talente;
        context.vorteile = vorteile;
        context.gegenstaende = gegenstaende;
        context.zauber = zauber;
        context.liturgien = liturgien;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Render the item sheet for viewing/editing prior to the editable check.
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("item-id"));
            item.sheet.render(true);
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("item-id"));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Active Effect management
        html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));

        // Drag events for macros.
        if (this.actor.isOwner) {
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }

        // Einschränkungen interactive boxes
        html.find('.einschraenkung-box').click(this._onEinschraenkungClick.bind(this));
        
        // Initialize einschränkungen display
        this._updateEinschraenkungsDisplay(html);
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            system: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system["type"];

        // Finally, create the item!
        return await Item.create(itemData, { parent: this.actor });
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // Handle item rolls.
        if (dataset.rollType) {
            if (dataset.rollType == 'item') {
                const itemId = element.closest('.item').dataset.itemId;
                const item = this.actor.items.get(itemId);
                if (item) return item.roll();
            }
        }

        // Handle rolls that supply the formula directly.
        if (dataset.roll) {
            let label = dataset.label ? `[ability] ${dataset.label}` : '';
            let roll = new Roll(dataset.roll, this.actor.getRollData());
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        }
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