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
import { advanceEffectTime } from "../utilities.js";

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
            
            // Add effect-items for the Kampf-Tab
            context.actor.effectItems = this.actor.items.filter(i => i.type === "effect-item");
            
            // Add canAdvanceTime flag for effect time-advance button
            context.canAdvanceTime = this.actor.isOwner;
            
            // Add ammunition status for ranged weapons (only for "held" actor type)
            if (this.actor.type === "held" && game.settings.get("ilaris-alternative-actor-sheet", "ammunitionTracking")) {
                const AMMUNITION_TYPES = ["Kugel", "Pfeil", "Bolzen"];
                const inventoryItems = this.actor.items.filter(i => i.type === "gegenstand");
                
                // Process each fernkampfwaffe
                if (context.actor.fernkampfwaffen) {
                    for (const weapon of context.actor.fernkampfwaffen) {
                        // Find ammunition property
                        const ammoProperty = weapon.system.eigenschaften?.find(
                            e => AMMUNITION_TYPES.includes(e.key)
                        );
                        
                        if (ammoProperty) {
                            weapon.ammunitionType = ammoProperty.key;
                            // Check if matching ammunition exists in inventory with quantity > 0
                            const ammoItem = inventoryItems.find(
                                i => i.name === ammoProperty.key && i.system.quantity > 0
                            );
                            weapon.hasAmmunition = !!ammoItem;
                        } else {
                            weapon.ammunitionType = undefined;
                            weapon.hasAmmunition = true; // Weapons without ammo requirement always "have" ammo
                        }
                    }
                }
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
                editable: this.isEditable,
                effectItems: this.actor.items.filter(i => i.type === "effect-item")
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
            
            // Schips increment/decrement (our custom feature)
            html.find('.schips-stat .schip-decrease').click(this._onSchipDecrease.bind(this));
            html.find('.schips-stat .schip-increase').click(this._onSchipIncrease.bind(this));
            
            // Effect library open button (our custom feature)
            html.find('.effect-library-open').click(this._onOpenEffectLibrary.bind(this));
            
            // Stack effect controls (our custom feature)
            html.on("click", ".effect-stack-increase", this._onEffectStackIncrease.bind(this));
            html.on("click", ".effect-stack-decrease", this._onEffectStackDecrease.bind(this));
            
            // Effect time-advance button (our custom feature)
            html.find('.effect-advance-time').click(this._onEffectAdvanceTime.bind(this));
            
            // Rest button (our custom feature)
            html.find('.rest-button').click(this._onRest.bind(this));

            // 1. DragDrop Controller erstellen und konfigurieren
            // Foundry erwartet this._dragDrop als Array!
            const dragDrop = new DragDrop({
                // CSS-Selektor für den Drag-Handle (nicht das gesamte Item!)
                dragSelector: ".item-drag-handle",
                // CSS-Selektor für alle Drop-Zonen
                dropSelector: ".drop-target",
                // Callback-Funktionen für die Ereignisse
                callbacks: {
                    dragstart: this._onDragStart.bind(this),
                    // Wird aufgerufen, wenn ein Element losgelassen wird
                    drop: this._onDrop.bind(this)
                }
            });

            // 2. Als Array zuweisen (Foundry erwartet Array)
            this._dragDrop = [dragDrop];
            
            // 3. Den Controller an das HTML-Element deines Sheets binden
            dragDrop.bind(html[0] || html);
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
     * Handle increasing Schips by 1
     * @param {Event} event   The originating click event
     * @private
     */
    async _onSchipIncrease(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const currentSchips = this.actor.system.schips.schips_stern || 0;
        const maxSchips = this.actor.system.schips.schips || 0;
        
        // Increment by 1, but don't exceed max
        const newSchips = Math.min(currentSchips + 1, maxSchips);
        
        await this.actor.update({
            'system.schips.schips_stern': newSchips
        });
    }

    /**
     * Handle decreasing Schips by 1
     * @param {Event} event   The originating click event
     * @private
     */
    async _onSchipDecrease(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const currentSchips = this.actor.system.schips.schips_stern || 0;
        
        // Decrement by 1, but don't go below 0
        const newSchips = Math.max(currentSchips - 1, 0);
        
        await this.actor.update({
            'system.schips.schips_stern': newSchips
        });
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
     * Handle drag start for items with drag & drop support
     * @param {Event} event   The originating dragstart event
     * @private
     */
    _onDragStart(event) {
        // Finde das übergeordnete .item Element vom Drag-Handle
        const itemElement = event.currentTarget.closest('.item');
        if (!itemElement) return;
        
        const itemUuid = itemElement.dataset.itemUuid;
        if (!itemUuid) return;
        
        const item = fromUuidSync(itemUuid);
        if (!item) return;
        
        const dragData = item.toDragData();
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /**
     * Wird aufgerufen, wenn ein Item losgelassen wird.
     * Hier wird die Aktion (in den eigenen Bestand legen, handeln) ausgeführt.
     */
    async _onDrop(event) {
        event.preventDefault();
        event.target.classList.remove("drag-over");

        try {
            // Hole die übertragenen Daten
            const dropData = JSON.parse(event.dataTransfer.getData("text/plain"));

            // Unterscheidung basierend auf dem Drop-Ziel oder den Daten
            const dropType = event.target.dataset.dropType;

            if (dropType === "itemPile") {
                // Sonderlogik für Item Piles Handel
                await this._handleItemPileTrade(dropData);
            } else {
                // Standard-Item-Drop in den eigenen Bestand
                await super._onDrop(event);
            }
        } catch (err) {
            console.error("Fehler beim Verarbeiten des Drop-Ereignisses:", err);
            ui.notifications.error("Item konnte nicht übertragen werden.");
        }
    }

    // Hilfsfunktion für den Handel mit Item Piles
    async _handleItemPileTrade(dropData) {
        // Diese Logik hängt stark von der Item Piles API ab.
        // Üblicherweise würdest du hier den Handel über das Item Piles Modul anstoßen.
        // Beispiel (konkrete Implementierung kann abweichen):
        if (game.modules.get("item-piles")?.active) {
            // Prüfe, ob das Ziel ein gültiger Item Pile/Händler ist
            const targetPile = await ItemPiles.API.getPileForActor(this.actor);
            if (targetPile?.isTrader) {
                await ItemPiles.API.tradeItems(dropData.actorId, this.actor.id, [dropData.itemPileData]);
            }
        }
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

    /**
     * Handle rest button click - opens regeneration dialog
     * @param {Event} event   The originating click event
     * @private
     */
    async _onRest(event) {
        event.preventDefault();
        
        // Check if required data paths exist
        if (!this.actor.system?.abgeleitete || !this.actor.system?.gesundheit) {
            console.warn('IlarisAlternativeActorSheet | Missing required data for rest dialog');
            ui.notifications.warn('Fehler: Erforderliche Daten nicht gefunden');
            return;
        }
        
        const abgeleitete = this.actor.system.abgeleitete;
        const gesundheit = this.actor.system.gesundheit;
        
        // Determine character type
        const isZauberer = abgeleitete.zauberer;
        const isGeweihter = abgeleitete.geweihter;
        
        // Build dialog content
        let energySection = '';
        let energyType = null;
        
        if (isZauberer) {
            const currentASP = abgeleitete.asp_stern || 0;
            const maxASP = abgeleitete.asp || 0;
            const basisRegen = Math.ceil(maxASP / 8);
            
            energyType = 'asp';
            energySection = `
                <div class="form-group">
                    <h3>Astralenergie</h3>
                    <p><strong>Aktuelle AsP:</strong> ${currentASP} / ${maxASP}</p>
                </div>
                <p><strong>Basis-Regeneration (1/8 aufgerundet):</strong> ${basisRegen} AsP</p>
                <div class="form-group">
                    <label>Zusätzliche AsP:</label>
                    <input type="number" name="additional-energy" value="0" min="0" />
                </div>
            `;
        } else if (isGeweihter) {
            const currentKAP = abgeleitete.kap_stern || 0;
            const maxKAP = abgeleitete.kap || 0;
            const basisRegen = Math.ceil(maxKAP / 16);
            
            energyType = 'kap';
            energySection = `
                <div class="form-group">
                    <h3>Karmalenergie</h3>
                    <p><strong>Aktuelle KaP:</strong> ${currentKAP} / ${maxKAP}</p>
                </div>
                <p><strong>Basis-Regeneration (1/16 aufgerundet):</strong> ${basisRegen} KaP</p>
                <div class="form-group">
                    <label>Zusätzliche KaP:</label>
                    <input type="number" name="additional-energy" value="0" min="0" />
                </div>
            `;
        }
        
        // Wounds section (always visible)
        const currentHP = gesundheit.hp.value || 0;
        const lawWert = abgeleitete.law || 0;
        const ws = abgeleitete.ws || 0;
        const neueWunden = Math.min(ws, currentHP + lawWert);
        
        const woundsSection = `
            <div class="form-group">
                <h3>Lebenspunkte</h3>
                <p><strong>Aktuelle LeP:</strong> ${currentHP}</p>
            </div>
            <p><strong>Law:</strong> ${lawWert} LeP</p>
            <div class="form-group">
                <label>Law Regeneration:</label>
                <input style="padding-left: 0.5rem" type="number" name="law-times" value="1" min="1" />
            </div>
        `;
        
        const content = `
            <form>
                ${woundsSection}
                <hr/>
                ${energySection}
                <hr/>
            </form>
        `;
        
        // Show dialog
        new Dialog({
            title: "Regeneration während Rast",
            content: content,
            buttons: {
                rest: {
                    icon: '<i class="fas fa-bed"></i>',
                    label: "Rast durchführen",
                    callback: async (html) => {
                        const additionalEnergy = parseInt(html.find('[name="additional-energy"]').val()) || 0;
                        const additionalLaw = parseInt(html.find('[name="law-times"]').val()) || 1;
                        
                        const updateData = {};
                        
                        // Update energy if character is spellcaster or blessed
                        if (energyType === 'asp') {
                            const currentASP = abgeleitete.asp_stern || 0;
                            const maxASP = abgeleitete.asp || 0;
                            const basisRegen = Math.ceil(maxASP / 8);
                            const newASP = Math.min(currentASP + basisRegen + additionalEnergy, maxASP);
                            updateData['system.abgeleitete.asp_stern'] = newASP;
                        } else if (energyType === 'kap') {
                            const currentKAP = abgeleitete.kap_stern || 0;
                            const maxKAP = abgeleitete.kap || 0;
                            const basisRegen = Math.ceil(maxKAP / 16);
                            const newKAP = Math.min(currentKAP + basisRegen + additionalEnergy, maxKAP);
                            updateData['system.abgeleitete.kap_stern'] = newKAP;
                        }
                        
                        // Update wounds
                        const newWunden = Math.max(0, (gesundheit.wunden || 0) - (lawWert * additionalLaw));
                        updateData['system.gesundheit.wunden'] = newWunden;
                        
                        await this.actor.update(updateData);
                        ui.notifications.info('Rast durchgeführt - Regeneration abgeschlossen');
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen"
                }
            },
            default: "rest"
        }).render(true);
    }


}