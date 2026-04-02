/**
 * Alternative Creature Sheet for Ilaris (AppV2)
 * 
 * This class extends the KreaturSheet (which uses HandlebarsApplicationMixin + ActorSheetV2)
 * and provides an alternative layout with a combat-focused interface optimized for GM use.
 * 
 * Design Philosophy:
 * - Combat-First: Most important information (attacks, effects, spells) in the default "Kampf" tab
 * - Statblock-Style: Dense, text-focused presentation for quick reference during play
 * - Component Reuse: Leverages existing health-resources, energy-resources, and effect-card components
 * - Visual Consistency: Same hexagon attributes and styling as the alternative character sheet
 * - Flat Structure: No accordions - all information immediately visible for fast access
 * 
 * Migrated from ApplicationV1 to ApplicationV2 patterns:
 * - static DEFAULT_OPTIONS instead of get defaultOptions()
 * - static PARTS instead of template in defaultOptions
 * - _prepareContext() instead of getData()
 * - _onRender() instead of activateListeners()
 * - Static action methods instead of jQuery event handlers
 * - Vanilla DOM instead of jQuery selectors in actions
 */
import { KreaturSheet } from "../../../../systems/Ilaris/scripts/actors/sheets/kreatur.js";
import { advanceEffectTime } from "../utilities.js";

export class IlarisAlternativeCreatureSheet extends KreaturSheet {
    
    constructor(...args) {
        super(...args);
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
            itemCreate: IlarisAlternativeCreatureSheet.onItemCreate,
            hexagonEdit: IlarisAlternativeCreatureSheet.onHexagonEdit,
            energySettings: IlarisAlternativeCreatureSheet.onEnergySettings,
            healthSettings: IlarisAlternativeCreatureSheet.onHealthSettings,
            editStat: IlarisAlternativeCreatureSheet.onEditStat,
            openEffectLibrary: IlarisAlternativeCreatureSheet.onOpenEffectLibrary,
            effectStackIncrease: IlarisAlternativeCreatureSheet.onEffectStackIncrease,
            effectStackDecrease: IlarisAlternativeCreatureSheet.onEffectStackDecrease,
            effectAdvanceTime: IlarisAlternativeCreatureSheet.onEffectAdvanceTime,
            copyUUID: IlarisAlternativeCreatureSheet.onCopyUUID,
        }
    }

    /** @override - Single monolithic template part */
    static PARTS = {
        header: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/npc/alternative-creature-sheet.hbs"
        },
        tabs: {
            template: 'templates/generic/tab-navigation.hbs',
        },
        allgemein: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/npc/tabs/creature-allgemein-tab.hbs",
            scrollable: [''],
        },
        kampf: {
            template: "modules/ilaris-alternative-actor-sheet/templates/sheets/npc/tabs/creature-kampf-tab.hbs",
            scrollable: [''],
        },
    }

    static TABS = {
        primary: {
            tabs: [
                { id: "allgemein", icon: "fa-solid fa-chart-simple", label: "Attribute" },
                { id: "kampf", icon: "fa-solid fa-fist-raised", label: "Kampf" },
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

            if (!context || !context.actor) {
                console.error('IlarisAlternativeCreatureSheet | Invalid context from parent _prepareContext');
                throw new Error('Failed to get valid context from parent sheet');
            }

            if (!CONFIG.ILARIS) {
                console.warn('IlarisAlternativeCreatureSheet | CONFIG.ILARIS not available');
                CONFIG.ILARIS = {};
            }

            // Add creature-specific data
            context.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options || {});

            // Add effect-items for the Kampf-Tab
            context.actor.effectItems = this.actor.items.filter(i => i.type === "effect-item");

            // Check if creature is a caster
            context.isCaster = this.actor.system.abgeleitete?.zauberer || this.actor.system.abgeleitete?.geweihter;

            // Add canAdvanceTime flag
            context.canAdvanceTime = this.actor.isOwner;

            return context;

        } catch (error) {
            console.error('IlarisAlternativeCreatureSheet | Error in _prepareContext:', error);

            return {
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
        }
    }

    /** @override */
    async _preparePartContext(partId, context) {
        switch (partId) {
            case 'allgemein':
            case 'kampf':
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
        // No additional render setup needed - all events handled via data-action attributes
    }

    /* -------------------------------------------- */
    /*  Drop Override for Effect Library              */
    /* -------------------------------------------- */

    /** @override */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        // If dropping an Item from the effect library compendium, transfer only its effects
        if (data.type === "Item" && data.uuid?.includes("ilaris-alternative-actor-sheet.effect-library")) {
            event.preventDefault();

            try {
                const item = await fromUuid(data.uuid);

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

        // For all other drops, use the default behavior
        return super._onDrop(event);
    }

    /* -------------------------------------------- */
    /*  Static Action Handlers                       */
    /* -------------------------------------------- */

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
                current: 'Eng aktuell',
                blocked: 'gEng (geblockt)',
                title: 'Energie bearbeiten'
            };
        } else if (energyType === 'kap') {
            currentValue = actor.system.abgeleitete.kap_stern || 0;
            blockedValue = actor.system.abgeleitete.gkap || 0;
            maxValue = actor.system.abgeleitete.kap || 0;
            labels = {
                current: 'Eng aktuell',
                blocked: 'gEng (geblockt)',
                title: 'Energie bearbeiten'
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
     * Handle editing stat values like global modifier, HP-Max, or Kreaturentyp
     * @param {PointerEvent} event
     * @param {HTMLElement} target
     */
    static async onEditStat(event, target) {
        event.preventDefault();
        const actor = this.actor;

        const statField = target.dataset.statField;
        const currentValue = foundry.utils.getProperty(actor, statField) || '';

        const labelEl = target.querySelector('.stat-label');
        const iconEl = target.querySelector('i');
        const label = labelEl?.textContent || 'Wert';
        const title = iconEl?.getAttribute('title') || label;

        // Determine input type based on field
        const inputType = statField.includes('hp.max') || statField.includes('mod') || statField.includes('ws') ? 'number' : 'text';

        const content = `
            <div class="form-group">
                <label>${title}:</label>
                <input type="${inputType}" name="value" value="${currentValue}" ${inputType === 'number' ? 'step="1"' : ''} />
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
                        const input = button.form.elements.value;
                        let newValue = input.value;
                        if (inputType === 'number') {
                            newValue = parseInt(newValue) || 0;
                        }
                        return { value: newValue };
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
            console.error('IlarisAlternativeCreatureSheet | Error advancing effect time:', error);
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
}
