/**
 * Alternative Actor Sheet for Ilaris (AppV2)
 * 
 * This class extends the base HeldenSheet (which uses HandlebarsApplicationMixin + ActorSheetV2)
 * and provides an alternative layout with enhanced functionality.
 * 
 * Migrated from ApplicationV1 to ApplicationV2 patterns:
 * - static DEFAULT_OPTIONS instead of get defaultOptions()
 * - static PARTS instead of template in defaultOptions
 * - _prepareContext() instead of getData()
 * - _onRender() instead of activateListeners()
 * - Static action methods instead of jQuery event handlers
 * - Vanilla DOM instead of jQuery selectors in actions
 */
import { HeldenSheet } from "../../../../systems/Ilaris/scripts/actors/sheets/held.js";
import { AccordionManager } from "../components/accordion-manager.js";
import { FavoritesManager } from "../components/favorites-manager.js";
import { advanceEffectTime } from "../utilities.js";

export class IlarisAlternativeActorSheet extends HeldenSheet {
    
    constructor(...args) {
        super(...args);
        this.accordionManager = new AccordionManager(this.actor.id);
        this.favoritesManager = new FavoritesManager(this.actor.id);
    }

    /* -------------------------------------------- */
    /*  Static Configuration                         */
    /* -------------------------------------------- */

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["alternative"],
        position: { width: 820, height: 900 },
        window: {
            controls: [
                {
                    icon: "fa-solid fa-passport",
                    label: "UUID kopieren",
                    action: "copyUUID"
                }
            ]
        },
        actions: {
            hexagonEdit: IlarisAlternativeActorSheet.onHexagonEdit,
            energySettings: IlarisAlternativeActorSheet.onEnergySettings,
            healthSettings: IlarisAlternativeActorSheet.onHealthSettings,
            editStat: IlarisAlternativeActorSheet.onEditStat,
            openEffectLibrary: IlarisAlternativeActorSheet.onOpenEffectLibrary,
            effectStackIncrease: IlarisAlternativeActorSheet.onEffectStackIncrease,
            effectStackDecrease: IlarisAlternativeActorSheet.onEffectStackDecrease,
            effectAdvanceTime: IlarisAlternativeActorSheet.onEffectAdvanceTime,
            rest: IlarisAlternativeActorSheet.onRest,
            copyUUID: IlarisAlternativeActorSheet.onCopyUUID,
            schipIncrease: IlarisAlternativeActorSheet.onSchipIncrease,
            schipDecrease: IlarisAlternativeActorSheet.onSchipDecrease,
        }
    }

    /** @override - Single monolithic template part */
    static PARTS = {
        header: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/alternative-actor-header.hbs"
        },
        sidebar: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/alternative-actor-sidebar.hbs"
        },
        tabs: {
            template: 'templates/generic/tab-navigation.hbs',
        },
        main: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/main-tab.hbs",
            scrollable: [''],
        },
        kampf: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/kampf-tab.hbs",
            scrollable: [''],
        },
        skills: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/skills-tab.hbs",
            scrollable: ['']
        },
        spells: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/spells-tab.hbs",
            scrollable: ['']
        },
        items: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/items-tab.hbs",
            scrollable: ['']
        },
        effects: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/effects-tab.hbs",
            scrollable: ['']
        },
        biography: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/character/tabs/biography-tab.hbs",
            scrollable: [''],
        }
    }

    static TABS = {
        primary: {
            tabs: [
                { id: "main", icon: "fa-solid fa-chart-simple", label: "Attribute" },
                { id: "kampf", icon: "fa-solid fa-fist-raised", label: "Kampf" },
                { id: "skills", icon: "fa-solid fa-book", label: "Fertigkeiten" },
                { id: "spells", icon: "fa-solid fa-magic", label: "Übernatürlich" },
                { id: "items", icon: "fa-solid fa-box", label: "Inventar" },
                { id: "effects", icon: "fa-solid fa-bolt", label: "Effekte" },
                { id: "biography", icon: "fa-solid fa-user", label: "Notizen" }
            ],
            initial: "kampf", // Set the initial tab
        },
    };

    /* -------------------------------------------- */
    /*  Context Preparation                          */
    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        try {
            const context = await super._prepareContext(options);

            // Validate that we have the required data
            if (!context || !context.actor) {
                console.error('IlarisAlternativeActorSheet | Invalid context from parent _prepareContext');
                throw new Error('Failed to get valid context from parent sheet');
            }

            // Ensure CONFIG.ILARIS is available
            if (!CONFIG.ILARIS) {
                console.warn('IlarisAlternativeActorSheet | CONFIG.ILARIS not available');
                CONFIG.ILARIS = {};
            }

            // Add effect-items for the Kampf-Tab
            context.actor.effectItems = this.actor.items.filter(i => i.type === "effect-item");

            // Add canAdvanceTime flag for effect time-advance button
            context.canAdvanceTime = this.actor.isOwner || game.user.isGM;

            // Add ammunition status for ranged weapons (only for "held" actor type)
            if (this.actor.type === "held" && game.settings.get("ilaris-alternative-actor-sheet", "ammunitionTracking")) {
                const AMMUNITION_TYPES = ["Kugel", "Pfeil", "Bolzen"];
                const inventoryItems = this.actor.items.filter(i => i.type === "gegenstand");

                if (context.actor.fernkampfwaffen) {
                    for (const weapon of context.actor.fernkampfwaffen) {
                        const ammoProperty = weapon.system.eigenschaften?.find(
                            e => AMMUNITION_TYPES.includes(e.key)
                        );

                        if (ammoProperty) {
                            weapon.ammunitionType = ammoProperty.key;
                            const ammoItem = inventoryItems.find(
                                i => i.name === ammoProperty.key && i.system.quantity > 0
                            );
                            weapon.hasAmmunition = !!ammoItem;
                        } else {
                            weapon.ammunitionType = undefined;
                            weapon.hasAmmunition = true;
                        }
                    }
                }
            }

            return context;

        } catch (error) {
            console.error('IlarisAlternativeActorSheet | Error in _prepareContext:', error);

            return {
                actor: this.actor,
                data: this.actor.system,
                system: this.actor.system,
                config: CONFIG.ILARIS || {},
                isCharacter: this.actor.type === "held",
                isOwner: this.actor.isOwner,
                editable: this.isEditable,
                effectItems: this.actor.items.filter(i => i.type === "effect-item")
            };
        }
    }

    /** @override */
    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'main':
            case 'skills':
            case 'spells':
            case 'kampf':
            case 'items':
            case 'biography':
            case 'effects':
                context.tab = context.tabs[partId]
                break
            default:
        }

        return context
    }

    /* -------------------------------------------- */
    /*  Render Lifecycle                             */
    /* -------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Initialize accordion functionality (Vanilla DOM)
        this.accordionManager.initialize(this.element);

        // Initialize favorites component (Vanilla DOM)
        this.favoritesManager.initialize(this.element);

        // DragDrop setup
        const dragDrop = new foundry.applications.ux.DragDrop.implementation({
            dragSelector: ".item-drag-handle",
            dropSelector: ".drop-target",
            callbacks: {
                dragstart: this._onDragStart.bind(this),
                drop: this._onDrop.bind(this)
            }
        });
        dragDrop.bind(this.element);
    }

    /** @override */
    async close(options = {}) {
        this.accordionManager.clearAccordionStates();
        return super.close(options);
    }

    /* -------------------------------------------- */
    /*  Drag and Drop                                */
    /* -------------------------------------------- */

    /**
     * Handle drag start for items
     * @param {DragEvent} event
     * @private
     */
    _onDragStart(event) {
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
     * Handle drop events - supports effect library drops and standard item drops
     * @param {DragEvent} event
     * @private
     */
    async _onDrop(event) {
        event.preventDefault();
        const target = event.target;
        if (target.classList) target.classList.remove("drag-over");

        try {
            const dropData = JSON.parse(event.dataTransfer.getData("text/plain"));
            const dropType = target.dataset?.dropType;

            if (dropType === "itemPile") {
                await this._handleItemPileTrade(dropData);
            } else {
                const data = TextEditor.getDragEventData(event);
                const item = await fromUuid(data.uuid);

                // Effect library drop: transfer only effects
                if (item.type === "effect-item") {
                    try {
                        
                        if (!item) {
                            ui.notifications.warn("Item konnte nicht gefunden werden.");
                            return;
                        }

                        const effects = item.effects?.contents || [];
                        if (effects.length === 0) {
                            ui.notifications.warn(`${item.name} hat keine Effekte zum übertragen.`);
                            return;
                        }

                        const effectData = effects.map(e => {
                            const eData = e.toObject();
                            eData.origin = this.actor.uuid;
                            return eData;
                        });

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
                await super._onDrop(event);
            }
        } catch (err) {
            console.error("Fehler beim Verarbeiten des Drop-Ereignisses:", err);
            ui.notifications.error("Item konnte nicht übertragen werden.");
        }
    }

    /**
     * Handle trade with Item Piles module
     * @param {object} dropData
     * @private
     */
    async _handleItemPileTrade(dropData) {
        if (game.modules.get("item-piles")?.active) {
            const targetPile = await ItemPiles.API.getPileForActor(this.actor);
            if (targetPile?.isTrader) {
                await ItemPiles.API.tradeItems(dropData.actorId, this.actor.id, [dropData.itemPileData]);
            }
        }
    }

    /* -------------------------------------------- */
    /*  Static Action Handlers                       */
    /* -------------------------------------------- */

    /**
     * Handle increasing Schips by 1
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onSchipIncrease(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const currentSchips = this.actor.system.schips.schips_stern || 0;
        const maxSchips = this.actor.system.schips.schips || 0;
        const newSchips = Math.min(currentSchips + 1, maxSchips);

        await this.actor.update({
            'system.schips.schips_stern': newSchips
        });
    }

    /**
     * Handle decreasing Schips by 1
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onSchipDecrease(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const currentSchips = this.actor.system.schips.schips_stern || 0;
        const newSchips = Math.max(currentSchips - 1, 0);

        await this.actor.update({
            'system.schips.schips_stern': newSchips
        });
    }

    /**
     * Handle energy settings icon click - opens dialog to edit energy values
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onEnergySettings(event, target) {
        event.preventDefault();
        const energyType = target.dataset.energyType;
        const actor = this.actor;

        let currentValue, blockedValue, maxValue, labels;

        if (energyType === 'asp') {
            currentValue = actor.system.abgeleitete.asp_stern || 0;
            blockedValue = actor.system.abgeleitete.gasp || 0;
            maxValue = actor.system.abgeleitete.asp || 0;
            labels = {
                current: 'AsP/Eng aktuell',
                blocked: 'gAsP/gEng (geblockt)',
                title: 'AsP/Energie bearbeiten'
            };
        } else if (energyType === 'kap') {
            currentValue = actor.system.abgeleitete.kap_stern || 0;
            blockedValue = actor.system.abgeleitete.gkap || 0;
            maxValue = actor.system.abgeleitete.kap || 0;
            labels = {
                current: 'KaP/Eng aktuell',
                blocked: 'gKaP/gEng (geblockt)',
                title: 'KaP/Energie bearbeiten'
            };
        }

        const availableMax = maxValue - blockedValue;

        const content = `
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
        `;

        const result = await foundry.applications.api.DialogV2.wait({
            window: { title: labels.title },
            content: content,
            buttons: [
                {
                    action: "save",
                    label: "Speichern",
                    icon: "fas fa-check",
                    default: true,
                    callback: (event, button, dialog) => {
                        const newCurrent = button.form.elements.current.valueAsNumber || 0;
                        const newBlocked = button.form.elements.blocked.valueAsNumber || 0;
                        return { current: newCurrent, blocked: newBlocked };
                    }
                },
                {
                    action: "cancel",
                    label: "Abbrechen",
                    icon: "fas fa-times"
                }
            ],
            rejectClose: false
        });

        if (!result || typeof result !== "object") return;

        const updateData = {};
        if (energyType === 'asp') {
            updateData['system.abgeleitete.asp_stern'] = Math.min(result.current, maxValue - result.blocked);
            updateData['system.abgeleitete.gasp'] = Math.min(result.blocked, maxValue);
        } else if (energyType === 'kap') {
            updateData['system.abgeleitete.kap_stern'] = Math.min(result.current, maxValue - result.blocked);
            updateData['system.abgeleitete.gkap'] = Math.min(result.blocked, maxValue);
        }

        await actor.update(updateData);
    }

    /**
     * Handle health settings icon click - opens dialog to edit wounds
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onHealthSettings(event, target) {
        event.preventDefault();
        const actor = this.actor;
        const currentWounds = actor.system.gesundheit.wunden || 0;

        const content = `
            <div class="form-group">
                <label>Trefferpunkte erlitten:</label>
                <input type="number" name="wunden" value="0" />
                <p class="hint">Das sind die Trefferpunkte, die du erlitten hast. Negative Werte bedeuten Heilung.</p>
            </div>
        `;

        const result = await foundry.applications.api.DialogV2.wait({
            window: { title: 'Wunden bearbeiten' },
            content: content,
            buttons: [
                {
                    action: "save",
                    label: "Speichern",
                    icon: "fas fa-check",
                    default: true,
                    callback: (event, button, dialog) => {
                        return button.form.elements.wunden.valueAsNumber || 0;
                    }
                },
                {
                    action: "cancel",
                    label: "Abbrechen",
                    icon: "fas fa-times"
                }
            ],
            rejectClose: false
        });

        if (result === null || typeof result === "string") return;

        await actor.update({
            'system.gesundheit.wunden': Math.max(result + currentWounds, 0)
        });
    }

    /**
     * Handle opening the effect library compendium
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onOpenEffectLibrary(event, target) {
        event.preventDefault();

        const packId = target.dataset.pack;
        const pack = game.packs.get(packId);

        if (!pack) {
            ui.notifications.error(`Kompendium ${packId} konnte nicht gefunden werden.`);
            return;
        }

        pack.render(true);
        ui.notifications.info("Ziehe einen Effekt aus der Bibliothek auf das Charakterblatt, um nur den Effekt hinzuzufügen.");
    }

    /**
     * Handle editing stat values like global modifier
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onEditStat(event, target) {
        event.preventDefault();
        const actor = this.actor;

        const statField = target.dataset.statField;
        const currentValue = foundry.utils.getProperty(actor, statField) || 0;

        const labelEl = target.querySelector('.stat-label');
        const iconEl = target.querySelector('i');
        const label = labelEl?.textContent || 'Wert';
        const title = iconEl?.getAttribute('title') || label;

        const content = `
            <div class="form-group">
                <label>${title}:</label>
                <input type="number" name="value" value="${currentValue}" step="1" />
            </div>
        `;

        const result = await foundry.applications.api.DialogV2.wait({
            window: { title: `${title} bearbeiten` },
            content: content,
            buttons: [
                {
                    action: "save",
                    label: "Speichern",
                    icon: "fas fa-check",
                    default: true,
                    callback: (event, button, dialog) => {
                        return { value: button.form.elements.value.valueAsNumber || 0 };
                    }
                },
                {
                    action: "cancel",
                    label: "Abbrechen",
                    icon: "fas fa-times"
                }
            ],
            rejectClose: false
        });

        if (!result || typeof result !== "object") return;

        await actor.update({ [statField]: result.value });
    }

    /**
     * Handle clicking on small hexagon to edit attribute values
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onHexagonEdit(event, target) {
        event.preventDefault();
        event.stopPropagation();
        const actor = this.actor;

        const attributeKey = target.dataset.attribute;
        const attributeData = actor.system.attribute[attributeKey];
        const currentValue = attributeData?.wert || 0;

        const content = `
            <div class="form-group">
                <label for="attribute-value">Attribut-Wert für ${attributeKey.toUpperCase()}:</label>
                <input type="number" id="attribute-value" name="value" value="${currentValue}" min="0" max="20" step="1" />
            </div>
        `;

        const result = await foundry.applications.api.DialogV2.wait({
            window: { title: `${attributeKey.toUpperCase()} bearbeiten` },
            content: content,
            buttons: [
                {
                    action: "save",
                    label: "Speichern",
                    default: true,
                    callback: (event, button, dialog) => {
                        return { value: button.form.elements.value.valueAsNumber || 0 };
                    }
                },
                {
                    action: "cancel",
                    label: "Abbrechen"
                }
            ],
            rejectClose: false
        });

        if (!result || typeof result !== "object") return;

        const updatePath = `system.attribute.${attributeKey}.wert`;
        await actor.update({ [updatePath]: result.value });
    }

    /**
     * Handle click on stack increase button
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onEffectStackIncrease(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const effectId = target.dataset.effectId;
        const effect = this.actor.effects.get(effectId);

        if (!effect) {
            ui.notifications.error("Effect nicht gefunden");
            return;
        }

        await window.IlarisAlternativeActorSheet.increaseEffectStack(effect);
    }

    /**
     * Handle click on stack decrease button
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onEffectStackDecrease(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const effectId = target.dataset.effectId;
        const effect = this.actor.effects.get(effectId);

        if (!effect) {
            ui.notifications.error("Effect nicht gefunden");
            return;
        }

        const currentStacks = effect.changes.length;

        if (currentStacks <= 1) {
            await effect.delete();
            ui.notifications.info(`${effect.name} entfernt (0 Stacks)`);
            return;
        }

        const updatedChanges = effect.changes.slice(0, -1);
        await effect.update({ changes: updatedChanges });
        ui.notifications.info(`${effect.name} Stack reduziert auf ${updatedChanges.length}`);
    }

    /**
     * Advance time for all temporary effects
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onEffectAdvanceTime(event, target) {
        event.preventDefault();

        try {
            const effectsReduced = await advanceEffectTime(this.actor);

            if (effectsReduced === 0) {
                ui.notifications.info("Keine temporären Effekte vorhanden");
                return;
            }

            ui.notifications.info("Temporäre Effekte wurden um 1 Zeiteinheit reduziert");
        } catch (error) {
            console.error('IlarisAlternativeActorSheet | Error advancing effect time:', error);
            ui.notifications.error("Fehler beim Vorrücken der Effekt-Zeit");
        }
    }

    /**
     * Handle copying the actor's UUID to clipboard
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onCopyUUID(event, target) {
        const uuid = this.actor.uuid;
        navigator.clipboard.writeText(uuid).then(() => {
            ui.notifications.info(`UUID kopiert: ${uuid}`);
        }).catch(err => {
            console.error('Failed to copy UUID:', err);
            ui.notifications.error('Fehler beim Kopieren der UUID');
        });
    }

    /**
     * Handle rest button click - opens regeneration dialog
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onRest(event, target) {
        event.preventDefault();
        const actor = this.actor;

        if (!actor.system?.abgeleitete || !actor.system?.gesundheit) {
            ui.notifications.warn('Fehler: Erforderliche Daten nicht gefunden');
            return;
        }

        const abgeleitete = actor.system.abgeleitete;
        const gesundheit = actor.system.gesundheit;

        const isZauberer = abgeleitete.zauberer;
        const isGeweihter = abgeleitete.geweihter;

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

        const currentHP = gesundheit.hp.value || 0;
        const lawWert = abgeleitete.law || 0;

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
            ${woundsSection}
            <hr/>
            ${energySection}
            <hr/>
        `;

        const result = await foundry.applications.api.DialogV2.wait({
            window: { title: "Regeneration während Rast" },
            content: content,
            buttons: [
                {
                    action: "rest",
                    label: "Rast durchführen",
                    icon: "fas fa-bed",
                    default: true,
                    callback: (event, button, dialog) => {
                        const additionalEnergyInput = button.form.elements["additional-energy"];
                        const lawTimesInput = button.form.elements["law-times"];
                        return {
                            additionalEnergy: additionalEnergyInput ? (additionalEnergyInput.valueAsNumber || 0) : 0,
                            additionalLaw: lawTimesInput ? (lawTimesInput.valueAsNumber || 1) : 1
                        };
                    }
                },
                {
                    action: "cancel",
                    label: "Abbrechen",
                    icon: "fas fa-times"
                }
            ],
            rejectClose: false
        });

        if (!result || typeof result !== "object") return;

        const updateData = {};

        if (energyType === 'asp') {
            const currentASP = abgeleitete.asp_stern || 0;
            const maxASP = abgeleitete.asp || 0;
            const basisRegen = Math.ceil(maxASP / 8);
            updateData['system.abgeleitete.asp_stern'] = Math.min(currentASP + basisRegen + result.additionalEnergy, maxASP);
        } else if (energyType === 'kap') {
            const currentKAP = abgeleitete.kap_stern || 0;
            const maxKAP = abgeleitete.kap || 0;
            const basisRegen = Math.ceil(maxKAP / 16);
            updateData['system.abgeleitete.kap_stern'] = Math.min(currentKAP + basisRegen + result.additionalEnergy, maxKAP);
        }

        const newWunden = Math.max(0, (gesundheit.wunden || 0) - (lawWert * result.additionalLaw));
        updateData['system.gesundheit.wunden'] = newWunden;

        await actor.update(updateData);
        ui.notifications.info('Rast durchgeführt - Regeneration abgeschlossen');
    }
}
