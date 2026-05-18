import { TargetSelectionDialog } from '../../../../systems/Ilaris/scripts/combat/dialogs/target-selection.js';
import { consumeInventoryItem, createItemApplicationPayload } from '../utilities.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class IlarisAlternativeItemApplyDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['iaas-item-apply-window'],
        position: { width: 620, height: 'auto' },
        window: {
            title: 'Gegenstand anwenden',
            resizable: true,
        },
        actions: {
            chooseTargets: IlarisAlternativeItemApplyDialog.#onChooseTargets,
            applyItem: IlarisAlternativeItemApplyDialog.#onApplyItem,
            closeDialog: IlarisAlternativeItemApplyDialog.#onCloseDialog,
        },
    };

    static PARTS = {
        form: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/item-apply-dialog.hbs',
        },
    };

    constructor(actor, options = {}) {
        super(options);

        this.actor = actor;
        this.itemId = options.itemId || null;
        this.selectedTargets = [];
        this.isApplying = false;

        const itemName = this.item?.name || 'Gegenstand';
        this.options.window.title = `Gegenstand anwenden: ${itemName}`;
    }

    get item() {
        return this.actor?.items.get(this.itemId) || null;
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const item = this.item;
        const quantity = Number(item?.system.quantity ?? 0);

        return {
            ...context,
            actor: this.actor,
            item,
            hasItem: Boolean(item),
            quantity: Number.isFinite(quantity) ? quantity : 0,
            selectedTargets: this.selectedTargets,
            hasSelectedTargets: this.selectedTargets.length > 0,
            canApply: Boolean(item) && quantity > 0 && this.selectedTargets.length > 0 && !this.isApplying,
            isApplying: this.isApplying,
        };
    }

    static async #onChooseTargets(event, _target) {
        event.preventDefault();
        event.stopPropagation();

        const dialog = new TargetSelectionDialog(this.actor, selectedTargets => {
            this.selectedTargets = Array.isArray(selectedTargets) ? selectedTargets : [];
            this.render();
        });

        await dialog.render(true);
    }

    static async #onApplyItem(event, _target) {
        event.preventDefault();
        event.stopPropagation();

        if (this.isApplying) {
            return;
        }

        const item = this.item;
        if (!item) {
            globalThis.ui.notifications.warn('Der Gegenstand ist nicht mehr vorhanden.');
            await this.close();
            return;
        }

        const quantity = Number(item.system.quantity ?? 0);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            await consumeInventoryItem(this.actor, item.id, 1);
            globalThis.ui.notifications.warn(`Der Gegenstand "${item.name}" ist nicht mehr verfuegbar.`);
            await this.close();
            return;
        }

        if (this.selectedTargets.length === 0) {
            globalThis.ui.notifications.warn('Waehle mindestens ein Ziel aus.');
            return;
        }

        const broadcastItemApplication = window.IlarisAlternativeActorSheet?.broadcastItemApplication;
        if (typeof broadcastItemApplication !== 'function') {
            globalThis.ui.notifications.error('Die modulweite Gegenstandsanwendung ist noch nicht verfuegbar.');
            return;
        }

        const payload = createItemApplicationPayload(this.actor, item, this.selectedTargets);

        this.isApplying = true;
        await this.render();

        try {
            await broadcastItemApplication(payload);

            const consumeResult = await consumeInventoryItem(this.actor, item.id, 1);
            if (consumeResult.status === 'missing') {
                globalThis.ui.notifications.warn(`Der Gegenstand "${item.name}" wurde bereits entfernt.`);
            } else if (consumeResult.status === 'removed-empty') {
                globalThis.ui.notifications.warn(
                    `Der Gegenstand "${item.name}" hatte keine Menge mehr und wurde entfernt.`
                );
            }

            await this.close();
        } catch (error) {
            console.error('Ilaris Alternative Actor Sheet | Fehler beim Anwenden eines Gegenstands', error);
            globalThis.ui.notifications.error('Der Gegenstand konnte nicht angewendet werden.');
            this.isApplying = false;
            await this.render();
        }
    }

    static async #onCloseDialog(event, _target) {
        event.preventDefault();
        event.stopPropagation();
        await this.close();
    }
}
