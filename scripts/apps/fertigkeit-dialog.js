import { roll_crit_message } from '../../../../systems/Ilaris/scripts/dice/wuerfel_misc.js';
import { formatDiceFormula } from '../../../../systems/Ilaris/scripts/core/utilities.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const CONTEXT_LABELS = {
    none: 'nichts',
    gatherMaterials: 'Material sammeln',
    craftItem: 'Gegenstand herstellen',
    buyItem: 'Gegenstand einkaufen',
};

export class IlarisAlternativeFertigkeitDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['iaas-fertigkeit-dialog'],
        position: { width: 900, height: 'auto' },
        window: {
            title: 'Fertigkeitsprobe',
            resizable: true,
        },
        actions: {
            previewClick: IlarisAlternativeFertigkeitDialog.#onPreviewClick,
        },
    };

    static PARTS = {
        form: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/fertigkeit-dialog.hbs',
        },
    };

    constructor(actor, options = {}) {
        super(options);

        const probeType = options.probeType || 'fertigkeit';
        const title = IlarisAlternativeFertigkeitDialog._getDialogTitle(probeType, options);

        this.options.window.title = title;

        this.actor = actor;
        this.probeType = probeType;
        this.fertigkeitKey = options.fertigkeitKey || null;
        this.fertigkeitName = options.fertigkeitName || '';
        this.pw = options.pw || 0;
        this.talentList = options.talentList || {};
        this.speaker = ChatMessage.getSpeaker({ actor: this.actor });
        this.dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        this.usageContext = 'none';
    }

    static #onPreviewClick(event) {
        event.preventDefault();
        this._executeRoll();
    }

    static _getDialogTitle(probeType, options) {
        switch (probeType) {
            case 'attribut':
                return `Attributsprobe: ${options.fertigkeitName || 'Attribut'}`;
            case 'freieFertigkeit':
                return `Freie Fertigkeitsprobe: ${options.fertigkeitName || 'Freie Fertigkeit'}`;
            case 'fertigkeit':
            default:
                return `Fertigkeitsprobe: ${options.fertigkeitName || 'Fertigkeit'}`;
        }
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const hasSchips = this.actor.system.schips.schips_stern > 0;

        return {
            ...context,
            actor: this.actor,
            probeType: this.probeType,
            fertigkeitKey: this.fertigkeitKey,
            fertigkeitName: this.fertigkeitName,
            pw: this.pw,
            talentList: this.talentList,
            hasTalents: Object.keys(this.talentList).length > 0,
            choices_xd20: CONFIG.ILARIS.xd20_choice,
            checked_xd20: '1',
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            hasSchips,
            rollModes: CONFIG.Dice.rollModes,
            defaultRollMode: game.settings.get('core', 'rollMode'),
            dialogId: this.dialogId,
            usageContexts: [
                { value: 'none', label: CONTEXT_LABELS.none },
                { value: 'gatherMaterials', label: CONTEXT_LABELS.gatherMaterials },
                { value: 'craftItem', label: CONTEXT_LABELS.craftItem },
                { value: 'buyItem', label: CONTEXT_LABELS.buyItem },
            ],
            defaultUsageContext: this.usageContext,
        };
    }

    async _onRender(context, options) {
        await super._onRender(context, options);

        const html = this.element;
        this._modifierElement = html.querySelector('#modifier-summary');

        const inputs = html.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('change', () => this._handleInputChange());
            input.addEventListener('input', () => this._handleInputChange());
        });

        setTimeout(() => this._updateModifierDisplay(), 100);
    }

    _handleInputChange() {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout);
        }
        this._updateTimeout = setTimeout(() => {
            this._updateModifierDisplay();
        }, 150);
    }

    _getUsageContextData() {
        const html = this.element;
        const contextChoice = html?.querySelector(`#usage-context-${this.dialogId}`)?.value || 'none';
        this.usageContext = contextChoice;

        return {
            key: contextChoice,
            label: CONTEXT_LABELS[contextChoice] || CONTEXT_LABELS.none,
        };
    }

    _updateModifierDisplay() {
        if (!this._modifierElement) {
            return;
        }

        const { diceFormula, totalMod, modLines, finalPW, effectivePW, label, noTalentSelected, usesTalent } =
            this._calculateModifiers();
        const formattedDice = formatDiceFormula(diceFormula);
        const finalFormula = finalPW >= 0 ? `${formattedDice}+${finalPW}` : `${formattedDice}${finalPW}`;

        let summary = '<div class="all-summaries">';
        summary += '<div class="modifier-summary probe-summary clickable-summary" data-action="previewClick">';
        summary += `<div class="flex_space-between_center"><h4 style="width:100%">Probe ${label}: ${finalFormula}</h4><i class="custom-icon-without-hover"></i></div>`;
        summary += '<div class="modifier-list">';

        const pwLabel = usesTalent ? 'Basis PW(T)' : 'Basis PW';
        summary += `<div class="modifier-item base-value">${pwLabel}: <span>${effectivePW}</span></div>`;

        const globalermod = this.actor.system.abgeleitete.globalermod || 0;
        if (globalermod !== 0) {
            const color = globalermod > 0 ? 'positive' : 'negative';
            const sign = globalermod > 0 ? '+' : '';
            summary += `<div class="modifier-item ${color}">Status (Wunden/Furcht): <span>${sign}${globalermod}</span></div>`;
        }

        modLines.forEach(line => {
            if (line.value !== 0) {
                const color = line.value > 0 ? 'positive' : 'negative';
                const sign = line.value > 0 ? '+' : '';
                summary += `<div class="modifier-item ${color}">${line.label}: <span>${sign}${line.value}</span></div>`;
            }
        });

        summary += '<hr>';

        if (totalMod !== 0) {
            const totalColor = totalMod > 0 ? 'positive' : 'negative';
            const totalSign = totalMod > 0 ? '+' : '';
            summary += `<div class="modifier-item total ${totalColor}"><strong>Addierte Modifikatoren: ${totalSign}${totalMod}</strong></div>`;
        }

        summary += '</div></div></div>';

        const talentWarning = this.element.querySelector('.talent-warning');
        if (talentWarning) {
            if (noTalentSelected) {
                talentWarning.style.display = '';
            } else {
                talentWarning.style.display = 'none';
            }
        }

        this._modifierElement.innerHTML = summary;
    }

    _calculateModifiers() {
        const html = this.element;
        const globalermod = this.actor.system.abgeleitete.globalermod || 0;
        const modLines = [];
        const hasTalents = Object.keys(this.talentList).length > 0;

        const xd20Choice = Number(html.querySelector(`input[name="xd20-${this.dialogId}"]:checked`)?.value) || 0;
        const diceCount = xd20Choice === 0 ? 1 : 3;

        let selectedSchipsChoice =
            Number(html.querySelector(`input[name="schips-${this.dialogId}"]:checked`)?.value) || 0;
        const availableSchips = this.actor.system?.schips?.schips_stern || 0;
        let schipsText = '';
        let schipsApplied = false;

        if (selectedSchipsChoice !== 0 && availableSchips === 0) {
            schipsText = 'Keine Schips';
            selectedSchipsChoice = 0;
        } else if (selectedSchipsChoice === 1 && availableSchips > 0) {
            schipsText = 'Schips ohne Eigenheit';
            schipsApplied = true;
        } else if (selectedSchipsChoice === 2 && availableSchips > 0) {
            schipsText = 'Schips mit Eigenheit';
            schipsApplied = true;
        }

        const diceFormula = this._getDiceFormula(diceCount, selectedSchipsChoice);

        let hoheQualitaet = Number(html.querySelector(`#hohequalitaet-${this.dialogId}`)?.value) || 0;
        if (hoheQualitaet !== 0) {
            modLines.push({ label: 'Hohe Qualität', value: hoheQualitaet * -4 });
        }

        const modifikator = Number(html.querySelector(`#modifikator-${this.dialogId}`)?.value) || 0;
        if (modifikator !== 0) {
            modLines.push({ label: 'Modifikator', value: modifikator });
        }

        let effectivePW = this.pw;
        let label = this.fertigkeitName;
        let noTalentSelected = false;
        let usesTalent = false;

        if (this.probeType === 'fertigkeit' && this.fertigkeitKey) {
            const talentChoice = Number(html.querySelector(`#talent-${this.dialogId}`)?.value);
            if (talentChoice === -2) {
                effectivePW = this.actor.profan.fertigkeiten[this.fertigkeitKey]?.system.pw || this.pw;
                noTalentSelected = hasTalents;
            } else if (talentChoice === -1) {
                effectivePW = this.actor.profan.fertigkeiten[this.fertigkeitKey]?.system.pwt || this.pw;
                label = `${this.fertigkeitName} (Talent)`;
                usesTalent = true;
            } else if (talentChoice >= 0 && this.talentList[talentChoice]) {
                effectivePW = this.actor.profan.fertigkeiten[this.fertigkeitKey]?.system.pwt || this.pw;
                label = `${this.fertigkeitName} (${this.talentList[talentChoice]})`;
                usesTalent = true;
            }
        }

        const usageContext = this._getUsageContextData();

        const hoheQualitaetMod = hoheQualitaet * -4;
        const totalMod = globalermod + hoheQualitaetMod + modifikator;
        const finalPW = effectivePW + totalMod;

        return {
            diceFormula,
            totalMod,
            modLines,
            finalPW,
            effectivePW,
            label,
            noTalentSelected,
            usesTalent,
            globalermod,
            hoheQualitaet,
            hoheQualitaetMod,
            modifikator,
            schipsChoice: selectedSchipsChoice,
            schipsApplied,
            schipsText,
            usageContext,
        };
    }

    _getDiceFormula(diceCount, schipsChoice) {
        let baseDice = diceCount;
        let dropLow = diceCount === 1 ? 0 : 1;
        let dropHigh = diceCount === 1 ? 0 : 1;

        if (schipsChoice === 1) {
            baseDice += 1;
            dropLow += 1;
        } else if (schipsChoice === 2) {
            baseDice += 2;
            dropLow += 2;
        }

        if (dropLow === 0 && dropHigh === 0) {
            return `${baseDice}d20`;
        }
        return `${baseDice}d20dl${dropLow}dh${dropHigh}`;
    }

    async _executeRoll() {
        const html = this.element;
        const {
            diceFormula,
            effectivePW,
            label,
            globalermod,
            hoheQualitaet,
            hoheQualitaetMod,
            modifikator,
            schipsApplied,
            schipsText,
            usageContext,
        } = this._calculateModifiers();

        let text = '';
        if (usageContext.key !== 'none') {
            text = text.concat(`Nutzung: ${usageContext.label}\n`);
        }
        if (schipsText) {
            text = text.concat(`${schipsText}\n`);
        }
        if (hoheQualitaet !== 0) {
            text = text.concat(`Hohe Qualität: ${hoheQualitaet}\n`);
        }
        if (modifikator !== 0) {
            text = text.concat(`Modifikator: ${modifikator}\n`);
        }

        const rollmode =
            html.querySelector(`#rollMode-${this.dialogId}`)?.value || game.settings.get('core', 'rollMode');
        const formula = `${diceFormula} + ${effectivePW} + ${globalermod} + ${hoheQualitaetMod} + ${modifikator}`;

        if (schipsApplied && this.actor.system.schips.schips_stern > 0) {
            await this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            });
        }

        Hooks.callAll('ilaris-alternative-actor-sheet.fertigkeitDialogRolled', {
            actor: this.actor,
            probeType: this.probeType,
            fertigkeitKey: this.fertigkeitKey,
            fertigkeitName: this.fertigkeitName,
            usageContext,
            formula,
            rollMode: rollmode,
        });

        await roll_crit_message(formula, label, text, this.speaker, rollmode);
    }
}
