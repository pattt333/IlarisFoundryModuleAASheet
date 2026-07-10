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

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CombatDockApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(options = {}) {
        super(options);
        this._combat = null;
        this._windowOffset = 0;
    }

    /** @override */
    static DEFAULT_OPTIONS = {
        tag: 'div',
        id: 'ilaris-combat-dock',
        classes: ['ilaris-combat-dock'],
        position: {},
        window: {
            frame: false,
            positioned: false,
        },
        actions: {
            rollInitiative: CombatDockApp.#onRollInitiative,
            shiftLeft: CombatDockApp.#onShiftLeft,
            shiftRight: CombatDockApp.#onShiftRight,
            endTurn: CombatDockApp.#onEndTurn,
        },
    };

    /** @override */
    static PARTS = {
        main: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/combat-dock.hbs',
        },
    };

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
    _canEndTurn() {
        if (!this._combat) return false;
        if (this._isPreRoll()) return false;
        if (game.user.isGM) return true;
        const currentCombatant = this._combat.combatant;
        if (!currentCombatant?.actor) return false;
        return currentCombatant.actor.isOwner;
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
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
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
            // Window mode: show 3 cards, current centered, no wrapping at boundaries
            const currentIndex = allCombatants.findIndex(c => c.isCurrent);
            if (currentIndex < 0) {
                this._windowOffset = 0;
                const slice = allCombatants.slice(0, 3);
                context.combatants = slice.map((c, i) => ({ ...c, dockPos: ['left', 'center', 'right'][i] || 'center' }));
            } else {
                const centerIdx = currentIndex + this._windowOffset;
                context.combatants = [
                    centerIdx > 0          ? { ...allCombatants[centerIdx - 1], dockPos: 'left' }   : null,
                    { ...allCombatants[centerIdx], dockPos: 'center' },
                    centerIdx < total - 1  ? { ...allCombatants[centerIdx + 1], dockPos: 'right' }  : null,
                ];
            }
        }

        context.combatId = this._combat.id;
        context.round = this._combat.round;
        context.isPreRoll = isPreRoll;
        context.hasOverflow = hasOverflow;
        context.isGM = game.user.isGM;
        context.canEndTurn = this._canEndTurn();
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
    async _onRender(context, options) {
        await super._onRender(context, options);
        // Event listeners are handled by DEFAULT_OPTIONS.actions + data-action attributes
    }

    /** @private */
    static #onRollInitiative(event, target) {
        event.preventDefault();
        const combatantId = target.dataset.combatantId;
        const combat = game.combat;
        if (!combatantId || !combat) return;
        const combatant = combat.combatants.get(combatantId);
        if (!combatant) return;
        const actor = combatant.actor;
        if (!actor) return;

        if (!actor.hasPlayerOwner && game.user.isGM) {
            const npcs = combat.combatants.contents.filter(c => !c.actor?.hasPlayerOwner);
            if (npcs.length > 0) new MassInitiativeDialog(combat, npcs).render(true);
        } else if (actor.isOwner) {
            new InitiativeDialog(combatant).render(true);
        }
    }

    /** @private */
    static #onShiftLeft(_event, _target) {
        this._shiftWindowLeft();
    }

    /** @private */
    static #onShiftRight(_event, _target) {
        this._shiftWindowRight();
    }

    /** @private */
    static async #onEndTurn(event, target) {
        event.preventDefault();
        const btn = target.closest('button');
        if (!btn || !this._combat) return;
        btn.disabled = true;
        try {
            await this._combat.nextTurn();
        } catch (err) {
            btn.disabled = false;
            throw err;
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
        const rootEl = this.element;
        if (!rootEl) return;
        rootEl.classList.remove('position-top', 'position-bottom', 'position-none');
        rootEl.classList.add(this._getPositionClass());
    }

    /** @private */
    _updateSize() {
        const rootEl = this.element;
        if (!rootEl) return;
        rootEl.classList.remove('size-small', 'size-normal');
        rootEl.classList.add(this._getSizeClass());
    }
}
