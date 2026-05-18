import { evaluate_roll_with_crit, postRollToChat } from '../../../../systems/Ilaris/scripts/dice/wuerfel_misc.js';
import { formatDiceFormula } from '../../../../systems/Ilaris/scripts/core/utilities.js';

const { ApplicationV2, DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;

const CONTEXT_LABELS = {
    none: 'nichts',
    gatherMaterials: 'Material sammeln',
    craftItem: 'Gegenstand herstellen',
    buyItem: 'Gegenstand einkaufen',
};

const DEFAULT_DIFFICULTY = 16;
const DEFAULT_USED_ITEM_ID = 'none';
const MATERIAL_ITEM_NAME_PATTERN = /(zutat|material)/i;

const CONTEXT_DIFFICULTY_CONFIG = {
    none: { active: false },
    gatherMaterials: { active: true, fixed: true, value: DEFAULT_DIFFICULTY },
    craftItem: { active: true, fixed: false, value: DEFAULT_DIFFICULTY },
    buyItem: { active: true, fixed: false, value: DEFAULT_DIFFICULTY },
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
        this.difficultyValue = DEFAULT_DIFFICULTY;
        this.usedItemId = DEFAULT_USED_ITEM_ID;
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
        const difficulty = this._getDifficultyState(this.usageContext, this.difficultyValue);
        const usedItems = this._getUsedItemOptions();

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
            usedItems,
            defaultUsedItemId: this.usedItemId,
            difficulty,
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
            this._syncStateFromForm();
            this._syncDifficultyField();
            this._updateModifierDisplay();
        }, 150);
    }

    _syncStateFromForm() {
        const html = this.element;

        if (!html) {
            return;
        }

        const nextUsageContext = html.querySelector(`#usage-context-${this.dialogId}`)?.value || 'none';
        const nextUsedItemId = html.querySelector(`#used-item-${this.dialogId}`)?.value || DEFAULT_USED_ITEM_ID;
        const difficultyInputValue = html.querySelector(`#difficulty-${this.dialogId}`)?.value;
        const difficultyState = this._getDifficultyState(nextUsageContext, difficultyInputValue);

        this.usageContext = nextUsageContext;
        this.usedItemId = nextUsedItemId;

        if (difficultyState.active && !difficultyState.fixed) {
            this.difficultyValue = difficultyState.inputValue;
        }
    }

    _getUsedItemOptions() {
        return this.actor.items
            .filter(item => item.type === 'gegenstand')
            .map(item => {
                const quantity = Number(item.system.quantity ?? 0);

                return {
                    value: item.id,
                    name: item.name,
                    quantity: Number.isFinite(quantity) ? quantity : 0,
                    label: `${item.name} (${Number.isFinite(quantity) ? quantity : 0})`,
                };
            })
            .sort((left, right) => left.name.localeCompare(right.name, 'de', { sensitivity: 'base' }));
    }

    _getSelectedUsedItemData() {
        const selectedItemId = this.usedItemId || DEFAULT_USED_ITEM_ID;

        if (selectedItemId === DEFAULT_USED_ITEM_ID) {
            return null;
        }

        const select = this.element?.querySelector(`#used-item-${this.dialogId}`);
        const selectedOption = select?.selectedOptions?.[0] || null;
        const actorItem = this.actor.items.get(selectedItemId) || null;
        const selectedLabel = selectedOption?.textContent?.trim() || actorItem?.name || 'Unbekannter Gegenstand';
        const quantity = Number(actorItem?.system.quantity ?? 0);

        return {
            id: selectedItemId,
            name: actorItem?.name || selectedLabel,
            label: selectedLabel,
            quantity: Number.isFinite(quantity) ? quantity : 0,
            available: Boolean(actorItem),
        };
    }

    async _consumeSelectedUsedItem(usedItem) {
        if (!usedItem?.id) {
            return null;
        }

        const actorItem = this.actor.items.get(usedItem.id);

        if (!actorItem) {
            globalThis.ui.notifications.warn(`Der gewählte Gegenstand "${usedItem.name}" ist nicht mehr im Inventar.`);
            return { status: 'missing' };
        }

        const currentQuantity = Number(actorItem.system.quantity ?? 0);

        if (!Number.isFinite(currentQuantity) || currentQuantity <= 0) {
            await actorItem.delete();
            globalThis.ui.notifications.warn(
                `Der gewählte Gegenstand "${actorItem.name}" hatte keine Menge mehr und wurde entfernt.`
            );
            return { status: 'removed-empty' };
        }

        if (currentQuantity === 1) {
            await actorItem.delete();
            return { status: 'deleted' };
        }

        await actorItem.update({ 'system.quantity': currentQuantity - 1 });
        return { status: 'updated', quantity: currentQuantity - 1 };
    }

    _getDifficultyState(usageContextKey = 'none', rawDifficultyValue = this.difficultyValue) {
        const config = CONTEXT_DIFFICULTY_CONFIG[usageContextKey] || CONTEXT_DIFFICULTY_CONFIG.none;

        if (!config.active) {
            return {
                active: false,
                fixed: false,
                inputValue: DEFAULT_DIFFICULTY,
                displayValue: '',
                effectiveValue: null,
            };
        }

        if (config.fixed) {
            return {
                active: true,
                fixed: true,
                inputValue: config.value,
                displayValue: String(config.value),
                effectiveValue: config.value,
            };
        }

        const parsedDifficulty = Number.parseInt(rawDifficultyValue, 10);
        const difficultyValue = Number.isFinite(parsedDifficulty) ? parsedDifficulty : DEFAULT_DIFFICULTY;

        return {
            active: true,
            fixed: false,
            inputValue: difficultyValue,
            displayValue: String(difficultyValue),
            effectiveValue: difficultyValue,
        };
    }

    _syncDifficultyField() {
        const html = this.element;

        if (!html) {
            return;
        }

        const difficultyState = this._getDifficultyState(this.usageContext, this.difficultyValue);
        const row = html.querySelector('[data-difficulty-row]');
        const editableInput = html.querySelector(`#difficulty-${this.dialogId}`);
        const fixedInput = html.querySelector(`#difficulty-fixed-${this.dialogId}`);

        row?.classList.toggle('is-hidden', !difficultyState.active);

        if (editableInput) {
            editableInput.classList.toggle('is-hidden', !difficultyState.active || difficultyState.fixed);
            editableInput.disabled = !difficultyState.active || difficultyState.fixed;
            editableInput.value = String(difficultyState.inputValue);
        }

        if (fixedInput) {
            fixedInput.classList.toggle('is-hidden', !difficultyState.active || !difficultyState.fixed);
            fixedInput.value = difficultyState.displayValue;
        }
    }

    _getUsageContextData() {
        const contextChoice = this.usageContext || 'none';

        return {
            key: contextChoice,
            label: CONTEXT_LABELS[contextChoice] || CONTEXT_LABELS.none,
        };
    }

    _updateModifierDisplay() {
        if (!this._modifierElement) {
            return;
        }

        const {
            diceFormula,
            totalMod,
            modLines,
            finalPW,
            effectivePW,
            label,
            noTalentSelected,
            usesTalent,
            difficultyState,
        } = this._calculateModifiers();
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

        if (difficultyState.active) {
            const difficultyLabel = difficultyState.fixed ? 'Schwierigkeit (fest)' : 'Schwierigkeit';
            summary += `<div class="modifier-item difficulty-value"><strong>${difficultyLabel}: ${difficultyState.effectiveValue}</strong></div>`;
        }

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
        this._syncStateFromForm();

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
        const usedItem = this._getSelectedUsedItemData();
        const difficultyState = this._getDifficultyState(usageContext.key, this.difficultyValue);

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
            usedItem,
            difficultyState,
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

    _isWorldItemPack(pack) {
        if (!pack) {
            return false;
        }

        const packageType = pack.metadata?.packageType;
        const packageName = pack.metadata?.packageName;

        return packageType === 'world' || packageName === game.world?.id || pack.collection?.startsWith('world.');
    }

    _isValidMaterialItem(item) {
        return item?.type === 'gegenstand' && MATERIAL_ITEM_NAME_PATTERN.test(item.name || '');
    }

    async _getMaterialItemCandidates() {
        const worldItems = game.items
            .filter(item => this._isValidMaterialItem(item))
            .map(item => ({
                id: `world:${item.id}`,
                name: item.name,
                img: item.img,
                sourceLabel: 'Welt-Item',
                sourceType: 'world',
                documentId: item.id,
            }));

        const worldPackCandidates = [];

        for (const pack of game.packs) {
            if (!this._isWorldItemPack(pack)) {
                continue;
            }

            if (pack.documentName !== 'Item' && pack.metadata?.type !== 'Item') {
                continue;
            }

            const index = await pack.getIndex({ fields: ['name', 'type', 'img'] });
            for (const entry of index) {
                if (!this._isValidMaterialItem(entry)) {
                    continue;
                }

                worldPackCandidates.push({
                    id: `compendium:${pack.collection}:${entry._id}`,
                    name: entry.name,
                    img: entry.img,
                    sourceLabel: pack.metadata?.label || pack.title || pack.collection,
                    sourceType: 'compendium',
                    packId: pack.collection,
                    documentId: entry._id,
                });
            }
        }

        return [...worldItems, ...worldPackCandidates].sort((left, right) => {
            const nameCompare = left.name.localeCompare(right.name, 'de', { sensitivity: 'base' });
            if (nameCompare !== 0) {
                return nameCompare;
            }

            return left.sourceLabel.localeCompare(right.sourceLabel, 'de', { sensitivity: 'base' });
        });
    }

    async _promptMaterialItemSelection(candidates) {
        if (!candidates.length) {
            return null;
        }

        const options = candidates
            .map(candidate => {
                const name = foundry.utils.escapeHTML(candidate.name);
                const sourceLabel = foundry.utils.escapeHTML(candidate.sourceLabel);
                return `<option value="${candidate.id}">${name} (${sourceLabel})</option>`;
            })
            .join('');

        const result = await DialogV2.wait({
            window: { title: 'Gegenstand wählen' },
            content: `
                <div class="iaas-fertigkeit-dialog iaas-material-selection-dialog">
                    <div class="iaas-material-selection-panel">
                        <label for="material-selection-${this.dialogId}">Gefundener Gegenstand:</label>
                        <select id="material-selection-${this.dialogId}" name="selectedMaterial">
                            ${options}
                        </select>
                        <p class="iaas-material-selection-hint">
                            Es werden nur Welt-Items und Welt-Kompendium-Items vom Typ Gegenstand mit "Zutat" oder "Material" im Namen angeboten.
                        </p>
                    </div>
                </div>
            `,
            buttons: [
                {
                    action: 'confirm',
                    label: 'Hinzufügen',
                    icon: 'fas fa-check',
                    default: true,
                    callback: (event, button) => button.form.elements.selectedMaterial.value || null,
                },
                {
                    action: 'cancel',
                    label: 'Abbrechen',
                    icon: 'fas fa-times',
                },
            ],
            rejectClose: false,
        });

        return candidates.find(candidate => candidate.id === result) || null;
    }

    async _getMaterialSourceDocument(candidate) {
        if (!candidate) {
            return null;
        }

        if (candidate.sourceType === 'world') {
            return game.items.get(candidate.documentId) || null;
        }

        if (candidate.sourceType === 'compendium') {
            const pack = game.packs.get(candidate.packId);
            if (!pack) {
                return null;
            }

            return pack.getDocument(candidate.documentId);
        }

        return null;
    }

    async _addMaterialItemToActor(candidate) {
        const sourceDocument = await this._getMaterialSourceDocument(candidate);
        if (!sourceDocument) {
            globalThis.ui.notifications.warn('Gegenstand konnte nicht gefunden werden.');
            return null;
        }

        const createdItems = await this.actor.createEmbeddedDocuments('Item', [sourceDocument.toObject()]);
        return createdItems[0] || null;
    }

    async _handleMaterialGatheringSuccess(rollResult, usageContext) {
        if (usageContext.key !== 'gatherMaterials' || !rollResult?.success || rollResult.fumble) {
            return;
        }

        const candidates = await this._getMaterialItemCandidates();
        if (!candidates.length) {
            globalThis.ui.notifications.info(
                'Keine passenden Zutaten oder Materialien in Welt oder Welt-Kompendien gefunden.'
            );
            return;
        }

        const selectedCandidate = await this._promptMaterialItemSelection(candidates);
        if (!selectedCandidate) {
            return;
        }

        const createdItem = await this._addMaterialItemToActor(selectedCandidate);
        if (!createdItem) {
            return;
        }

        createdItem.sheet?.render(true);
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
            usedItem,
            difficultyState,
        } = this._calculateModifiers();

        let text = '';
        if (usageContext.key !== 'none') {
            text = text.concat(`Aktion: ${usageContext.label}\n`);
        }
        if (difficultyState.active) {
            const difficultySuffix = difficultyState.fixed ? ' (fest)' : '';
            text = text.concat(`Schwierigkeit: ${difficultyState.effectiveValue}${difficultySuffix}\n`);
        }
        if (usedItem) {
            const usedItemText = usedItem.available ? usedItem.name : `${usedItem.name} (nicht mehr verf\u00fcgbar)`;
            text = text.concat(`Benutzter Gegenstand: ${usedItemText}\n`);
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
            usedItem,
            difficulty: difficultyState.active
                ? {
                      active: true,
                      fixed: difficultyState.fixed,
                      value: difficultyState.effectiveValue,
                  }
                : null,
            formula,
            rollMode: rollmode,
        });

        const rollResult = difficultyState.active
            ? await evaluate_roll_with_crit(formula, label, text, difficultyState.effectiveValue, 1, true)
            : await evaluate_roll_with_crit(formula, label, text);

        await postRollToChat(rollResult, this.speaker, rollmode);

        await this._consumeSelectedUsedItem(usedItem);

        await this._handleMaterialGatheringSuccess(rollResult, usageContext);
    }
}
