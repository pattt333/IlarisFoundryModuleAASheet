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
            classes: ['ilaris', 'sheet', 'actor', 'alternative'],
            template: 'modules/ilaris-alternative-actor-sheet/templates/sheets/alternative-actor-sheet.hbs',
            width: 800,
            height: 900,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'main',
                },
            ],
            resizable: true,
            scrollY: ['.sheet-body'],
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
        context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.notes || '', { async: true });

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
            } else if (
                i.type === 'fertigkeit' ||
                i.type === 'freie_fertigkeit' ||
                i.type === 'uebernatuerliche_fertigkeit'
            ) {
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
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('item-id'));
            item.sheet.render(true);
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('item-id'));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Item Component functionality
        this._initializeItemComponents(html);

        // Active Effect management
        html.find('.effect-control').click(ev => onManageActiveEffect(ev, this.actor));

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));

        // Drag events for macros.
        if (this.actor.isOwner) {
            let handler = ev => this._onDragStart(ev);
            html.find('li.item, li.item-component').each((i, li) => {
                if (li.classList.contains('inventory-header')) return;
                li.setAttribute('draggable', true);
                li.addEventListener('dragstart', handler, false);
            });
        }
    }

    /**
     * Initialize item component functionality
     * @param {jQuery} html   The jQuery object for the rendered template
     * @private
     */
    _initializeItemComponents(html) {
        // Handle expand/collapse toggle
        html.find('[data-action="toggle-expand"]').click(ev => {
            ev.preventDefault();
            ev.stopPropagation();
            const itemComponent = $(ev.currentTarget).closest('.item-component');
            const itemDetails = itemComponent.find('.item-details');
            const isExpanded = itemComponent.hasClass('expanded');

            if (isExpanded) {
                itemDetails.slideUp(200);
                itemComponent.removeClass('expanded');
            } else {
                itemDetails.slideDown(200);
                itemComponent.addClass('expanded');
            }
        });

        // Handle header click to toggle expand/collapse
        html.find('.item-header').click(ev => {
            if ($(ev.target).closest('.item-actions, .item-controls').length) return;

            const itemComponent = $(ev.currentTarget).closest('.item-component');
            const expandButton = itemComponent.find('[data-action="toggle-expand"]');
            expandButton.click();
        });

        // Handle combat dialog button
        html.find('[data-action="combat-dialog"]').click(ev => {
            ev.preventDefault();
            ev.stopPropagation();
            const itemId = $(ev.currentTarget).closest('.item-component').data('item-id');
            const item = this.actor.items.get(itemId);
            if (item) {
                this._openCombatDialog(item);
            }
        });

        // Handle profane dialog button
        html.find('[data-action="profane-dialog"]').click(ev => {
            ev.preventDefault();
            ev.stopPropagation();
            const itemId = $(ev.currentTarget).closest('.item-component').data('item-id');
            const item = this.actor.items.get(itemId);
            if (item) {
                this._openProfaneDialog(item);
            }
        });
    }

    /**
     * Open combat dialog for weapons
     * @param {Item} item   The weapon item
     * @private
     */
    _openCombatDialog(item) {
        // This would integrate with the Ilaris system's combat dialog
        // For now, we'll show a basic dialog or call item roll
        console.log(`Opening combat dialog for weapon: ${item.name}`);
        if (item.roll) {
            item.roll();
        } else {
            ui.notifications.info(`Combat dialog for ${item.name} would open here`);
        }
    }

    /**
     * Open profane dialog for skills
     * @param {Item} item   The skill item
     * @private
     */
    _openProfaneDialog(item) {
        // This would integrate with the Ilaris system's profane dialog
        // For now, we'll show a basic dialog or call item roll
        console.log(`Opening profane dialog for skill: ${item.name}`);
        if (item.roll) {
            item.roll();
        } else {
            ui.notifications.info(`Profane dialog for ${item.name} would open here`);
        }
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
            system: data,
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system['type'];

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
}
