import {
    buildRangedClone,
    buildWeaponItemData,
    getBaseWeaponCost,
    getPropertyConflict,
    getPropertyCost,
    getPropertyRule,
    loadConfiguredItemNames,
    loadConfiguredWeaponProperties,
    normalizeParameterSlots,
    validateWeaponSelections,
} from './weapon-builder-logic.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class IlarisWeaponBuilderDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['iaas-weapon-builder-window'],
        position: { width: 760, height: 'auto' },
        window: { title: 'Grundwaffe erstellen', resizable: true },
        actions: {
            addProperty: IlarisWeaponBuilderDialog.#onAddProperty,
            removeProperty: IlarisWeaponBuilderDialog.#onRemoveProperty,
            createWeapon: IlarisWeaponBuilderDialog.#onCreateWeapon,
            closeDialog: IlarisWeaponBuilderDialog.#onCloseDialog,
        },
    };

    static PARTS = {
        form: {
            template: 'modules/ilaris-alternative-actor-sheet/templates/apps/weapon-builder-dialog.hbs',
        },
    };

    constructor(actor, weaponType) {
        super();
        this.actor = actor;
        this.weaponType = weaponType;
        this.fields = {
            name: '',
            w3: 0,
            w6: 0,
            tpModifier: 0,
            fertigkeit: '',
            talent: '',
            rw: 0,
            wm_at: 0,
            wm_vt: 0,
            wm_fk: 0,
            lz: 0,
        };
        this.availableProperties = [];
        this.availableSkills = [];
        this.availableTalents = [];
        this.selectedPropertyKey = '';
        this.selectedProperties = [];
        this.propertyCounter = 0;
        this.hasLoadedCompendiums = false;
        this.loadError = null;
        this.options.window.title =
            weaponType === 'fernkampfwaffe' ? 'Fernkampfwaffe erstellen' : 'Nahkampfwaffe erstellen';
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        if (!this.hasLoadedCompendiums && !this.loadError) {
            try {
                [this.availableProperties, this.availableSkills, this.availableTalents] = await Promise.all([
                    loadConfiguredWeaponProperties(),
                    loadConfiguredItemNames('fertigkeitenPacks', 'fertigkeit'),
                    loadConfiguredItemNames('talentePacks', 'talent'),
                ]);
                this.hasLoadedCompendiums = true;
            } catch (error) {
                console.error(
                    'Ilaris Alternative Actor Sheet | Waffeneigenschaften konnten nicht geladen werden',
                    error
                );
                this.loadError = 'Waffeneigenschaften konnten nicht aus den konfigurierten Kompendien geladen werden.';
            }
        }

        const baseCost = getBaseWeaponCost(this.fields);
        const validation = validateWeaponSelections(this.selectedProperties, baseCost);
        return {
            ...context,
            fields: this.fields,
            isRanged: this.weaponType === 'fernkampfwaffe',
            availableProperties: this.availableProperties,
            availableSkills: this.availableSkills,
            availableTalents: this.availableTalents,
            selectedPropertyKey: this.selectedPropertyKey,
            selectedProperties: this.selectedProperties.map(selection => ({
                ...selection,
                cost: getPropertyCost(selection),
                fixedCost: getPropertyRule(selection.key)?.cost,
                isCustomCost: !getPropertyRule(selection.key),
            })),
            baseCost,
            totalCost: validation.total,
            validationErrors: validation.errors,
            canCreate: validation.valid && this.actor?.isOwner,
            loadError: this.loadError,
            noPropertiesAvailable: this.availableProperties.length === 0,
        };
    }

    _onRender(context, options) {
        super._onRender(context, options);
        const form = this.element?.querySelector('form');
        form?.addEventListener('change', () => {
            this._readForm();
            this.render();
        });
    }

    _readForm() {
        const form = this.element?.querySelector('form');
        if (!form) return;

        const formData = new FormData(form);
        for (const key of Object.keys(this.fields)) {
            if (formData.has(key)) this.fields[key] = formData.get(key);
        }
        if (formData.has('weapon-property')) this.selectedPropertyKey = formData.get('weapon-property');

        for (const selection of this.selectedProperties) {
            const customCost = formData.get(`custom-cost-${selection.id}`);
            if (customCost !== null) selection.customCost = customCost;

            selection.parameters = selection.parameters.map((parameter, index) => {
                const value = formData.get(`property-${selection.id}-parameter-${index}`);
                if (value === null) return parameter;
                return selection.parameterSlots[index]?.type === 'number' && value !== '' ? Number(value) : value;
            });
        }
    }

    static async #onAddProperty(event, _target) {
        event.preventDefault();
        this._readForm();
        const definition = this.availableProperties.find(property => property.key === this.selectedPropertyKey);
        if (!definition) return;

        const rule = getPropertyRule(definition.key);
        if (this.selectedProperties.some(property => property.key === definition.key) && !rule?.repeatable) {
            ui.notifications.warn(`${definition.key} kann nur einmal gewählt werden.`);
            return;
        }

        const conflictingProperty = getPropertyConflict(definition.key, this.selectedProperties);
        if (conflictingProperty) {
            ui.notifications.warn(
                `${definition.key} kann nicht zusammen mit ${conflictingProperty.key} gewählt werden.`
            );
            return;
        }

        const parameterSlots = normalizeParameterSlots(definition.parameterSlots);
        if (definition.key === 'Fernkampfoption') {
            parameterSlots.unshift({
                name: 'fernkampfName',
                label: 'Name der Fernkampfwaffe',
                required: true,
                type: 'text',
            });
        }

        this.selectedProperties.push({
            id: String(++this.propertyCounter),
            key: definition.key,
            value: definition.value,
            parameterSlots,
            parameters: parameterSlots.map(slot => slot.defaultValue ?? ''),
            customCost: 1,
        });
        await this.render();
    }

    static async #onRemoveProperty(event, target) {
        event.preventDefault();
        this._readForm();
        this.selectedProperties = this.selectedProperties.filter(property => property.id !== target.dataset.propertyId);
        await this.render();
    }

    static async #onCreateWeapon(event, _target) {
        event.preventDefault();
        this._readForm();
        if (!this.actor?.isOwner) {
            ui.notifications.warn('Nur Besitzer können Waffen erstellen.');
            return;
        }

        const validation = validateWeaponSelections(this.selectedProperties, getBaseWeaponCost(this.fields));
        if (!validation.valid) {
            ui.notifications.warn('Die Waffe erfüllt die K10- oder Eigenschaftsregeln noch nicht.');
            await this.render();
            return;
        }

        const itemData = buildWeaponItemData(this.weaponType, this.fields, this.selectedProperties);
        try {
            const [createdWeapon] = await this.actor.createEmbeddedDocuments('Item', [itemData], {
                weaponBuilderCreated: true,
            });

            const rangedOption = this.selectedProperties.find(property => property.key === 'Fernkampfoption');
            if (this.weaponType === 'nahkampfwaffe' && rangedOption) {
                const rangedName = String(rangedOption.parameters[0]).trim();
                const rangedData = buildRangedClone(itemData, rangedName);
                const [createdRangedWeapon] = await this.actor.createEmbeddedDocuments('Item', [rangedData], {
                    weaponBuilderCreated: true,
                });
                await createdWeapon.setFlag('ilaris-alternative-actor-sheet', 'linkedRangedId', createdRangedWeapon.id);
                await createdRangedWeapon.setFlag('ilaris-alternative-actor-sheet', 'linkedMeleeId', createdWeapon.id);
                await createdRangedWeapon.sheet.render(true);
            }

            await this.close();
        } catch (error) {
            console.error('Ilaris Alternative Actor Sheet | Waffe konnte nicht erstellt werden', error);
            ui.notifications.error('Die Waffe konnte nicht erstellt werden.');
        }
    }

    static async #onCloseDialog(event, _target) {
        event.preventDefault();
        await this.close();
    }
}
