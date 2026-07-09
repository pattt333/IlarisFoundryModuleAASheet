/**
 * Combat Dock App
 *
 * Horizontal carousel combat tracker displayed as a fixed dock bar.
 * Shows 3 combatant cards at a time (current centered, prev/next on sides).
 * Uses a sliding window over the full combatant list — no CSS overflow scrolling.
 * Client-configurable position (top/bottom/hidden) and size (small/normal).
 */
import { InitiativeStateManager } from './initiative-state-manager.js';
import { InitiativeDialog } from './initiative-dialog.js';
import { MassInitiativeDialog } from './mass-initiative-dialog.js';

export class CombatDockApp extends Application {
    constructor(options = {}) {
        super(options);
        this._combat = null;
        this._windowOffset = 0;
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'ilaris-combat-dock',
            classes: ['ilaris-combat-dock'],
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/combat-dock.hbs',
            popOut: false,
        });
    }

    /** @override */
    get title() {
        return '';
    }

    /** @private */
    _isPreRoll() {
        if (!this._combat) return true;
        return this._combat.combatants.contents.some(c => c.initiative === null);
    }

    /** @private */
    async _resolveActions(actor) {
        if (!actor) return [];
        const dialogState = actor.getFlag('ilaris-alternative-actor-sheet', 'dialogState');
        if (!dialogState?.selectedActionIds?.length) return [];
        try {
            const availableActions = await InitiativeStateManager.loadAvailableActions();
            if (!availableActions?.length) return [];
            return dialogState.selectedActionIds
                .map(id => availableActions.find(a => (a.id || a._id) === id))
                .filter(Boolean)
                .map(a => ({ id: a.id || a._id, name: a.name, img: a.img || '' }));
        } catch {
            return [];
        }
    }

    /** @private */
    _getLepData(actor) {
        if (!actor?.system?.gesundheit?.hp) return null;
        const current = Number(actor.system.gesundheit.hp.value) || 0;
        const max = Number(actor.system.gesundheit.hp.max) || 0;
        if (max <= 0) return null;
        return { current, max, percent: Math.round((current / max) * 100) };
    }

    /** @private */
    _canSeeLep(actor) {
        if (!actor) return false;
        return game.user.isGM || actor.isOwner;
    }

    /** @private */
    _canRollInitiative(combatant) {
        if (!combatant?.actor) return false;
        if (!combatant.actor.hasPlayerOwner && game.user.isGM) return true;
        if (combatant.actor.isOwner) return true;
        return false;
    }

    /** @private */
    async _buildCombatantData(combatant, isPreRoll, currentTurnCombatantId) {
        const actor = combatant.actor;
        if (!actor) return null;
        if (combatant.hidden && !game.user.isGM) return null;

        const lep = this._getLepData(actor);
        const actions = await this._resolveActions(actor);

        return {
            combatantId: combatant.id,
            name: actor.name || combatant.name,
            img: actor.img || combatant.img || 'icons/svg/mystery-man.svg',
            initiative: combatant.initiative,
            isCurrent: combatant.id === currentTurnCombatantId && !isPreRoll,
            isDefeated: combatant.defeated,
            isOwner: actor.isOwner,
            canRollInitiative: this._canRollInitiative(combatant),
            actions,
            lepCurrent: lep?.current ?? 0,
            lepMax: lep?.max ?? 0,
            lepPercent: lep?.percent ?? 0,
            showLepBar: this._canSeeLep(actor) && lep !== null,
        };
    }

    /** @override */
    async getData() {
        const context = await super.getData();
        this._combat = game.combat;

        if (!this._combat) {
            context.combatId = null;
            context.round = '—';
            context.combatants = [];
            context.isPreRoll = true;
            context.hasOverflow = false;
            context.isGM = game.user.isGM;
            context.stateClass = 'pre-roll';
            context.positionClass = this._getPositionClass();
            context.sizeClass = this._getSizeClass();
            return context;
        }

        const isPreRoll = this._isPreRoll();
        const currentTurnCombatantId = this._combat.combatant?.id;

        // Build full combatant list in canonical Foundry order
        const orderedCombatants = isPreRoll ? this._combat.combatants.contents : this._combat.turns;
        const allCombatants = [];
        for (const c of orderedCombatants) {
            const data = await this._buildCombatantData(c, isPreRoll, currentTurnCombatantId);
            if (data) allCombatants.push(data);
        }

        const total = allCombatants.length;
        const hasOverflow = total > 3;

        // Pre-roll or ≤3 combatants: show all
        if (isPreRoll || !hasOverflow) {
            context.combatants = allCombatants;
        } else {
            // Window mode: show 3 cards, current centered
            const currentIndex = allCombatants.findIndex(c => c.isCurrent);
            if (currentIndex < 0) {
                this._windowOffset = 0;
                context.combatants = allCombatants.slice(0, 3);
            } else {
                const start = (((currentIndex + this._windowOffset - 1) % total) + total) % total;
                context.combatants = [
                    allCombatants[start],
                    allCombatants[(start + 1) % total],
                    allCombatants[(start + 2) % total],
                ];
            }
        }

        context.combatId = this._combat.id;
        context.round = this._combat.round;
        context.isPreRoll = isPreRoll;
        context.hasOverflow = hasOverflow;
        context.isGM = game.user.isGM;
        context.stateClass = isPreRoll ? 'pre-roll' : 'in-combat';
        context.positionClass = this._getPositionClass();
        context.sizeClass = this._getSizeClass();
        context.dockPosition = game.settings.get('ilaris-alternative-actor-sheet', 'combatDockPosition');
        context.dockSize = game.settings.get('ilaris-alternative-actor-sheet', 'combatDockSize');

        return context;
    }

    /** Snap window to current combatant (turn change). @private */
    _snapWindowToCurrent() {
        this._windowOffset = 0;
        this.render(false);
    }

    /** @private */
    _shiftWindowLeft() {
        this._windowOffset--;
        this.render(false);
    }

    /** @private */
    _shiftWindowRight() {
        this._windowOffset++;
        this.render(false);
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        html.find('[data-action="rollInitiative"]').on('click', this._onRollInitiative.bind(this));
        html.find('[data-action="shiftLeft"]').on('click', () => this._shiftWindowLeft());
        html.find('[data-action="shiftRight"]').on('click', () => this._shiftWindowRight());
    }

    /** @private */
    _onRollInitiative(event) {
        event.preventDefault();
        const combatantId = event.currentTarget.dataset.combatantId;
        if (!combatantId || !this._combat) return;
        const combatant = this._combat.combatants.get(combatantId);
        if (!combatant) return;
        const actor = combatant.actor;
        if (!actor) return;

        if (!actor.hasPlayerOwner && game.user.isGM) {
            const npcs = this._combat.combatants.contents.filter(c => !c.actor?.hasPlayerOwner);
            if (npcs.length > 0) new MassInitiativeDialog(this._combat, npcs).render(true);
        } else if (actor.isOwner) {
            new InitiativeDialog(combatant).render(true);
        }
    }

    /** @private */
    _getPositionClass() {
        return `position-${game.settings.get('ilaris-alternative-actor-sheet', 'combatDockPosition')}`;
    }

    /** @private */
    _getSizeClass() {
        return `size-${game.settings.get('ilaris-alternative-actor-sheet', 'combatDockSize')}`;
    }

    /** @private */
    _updatePosition() {
        const rootEl = this.element?.[0];
        if (!rootEl) return;
        rootEl.classList.remove('position-top', 'position-bottom', 'position-none');
        rootEl.classList.add(this._getPositionClass());
    }

    /** @private */
    _updateSize() {
        const rootEl = this.element?.[0];
        if (!rootEl) return;
        rootEl.classList.remove('size-small', 'size-normal');
        rootEl.classList.add(this._getSizeClass());
    }
}
