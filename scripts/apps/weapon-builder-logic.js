const MODULE_ID = 'ilaris-alternative-actor-sheet';

export const WEAPON_PROPERTY_RULES = {
    '+1W3 TP': { cost: 2, repeatable: true },
    '+1W6 TP': { cost: 4, repeatable: true },
    '+1 TP': { cost: 1, repeatable: true },
    '+1 AT': { cost: 1, repeatable: true },
    '+1 PA': { cost: 1, repeatable: true },
    'Automatischer Manövereffekt': { cost: 1 },
    Einschüchternd: { cost: 0.5, repeatable: true },
    Kopflastig: { cost: 2 },
    Leicht: { cost: 1, repeatable: true, conflicts: ['weight'] },
    Wendig: { cost: 1 },
    Rüstungsbrechend: { cost: 1 },
    Unzerstörbar: { cost: 2, conflicts: ['durability'] },
    Fernkampfoption: { cost: 2 },
    Messerstecherei: { cost: 2 },
    Schild: { cost: 2 },
    Reittier: { cost: 2 },
    Phalanx: { cost: 1 },
    Feuerwaffe: { cost: 0 },
    Parierwaffe: { cost: 0 },
    'RW kurz': { cost: 0, conflicts: ['reach'] },
    'RW mittel': { cost: 0, conflicts: ['reach'] },
    'RW lang': { cost: 0, conflicts: ['reach'] },
    Stumpf: { cost: 0 },
    Ladezeit: { cost: -4 },
    Schwer: { cost: -0.5, repeatable: true, conflicts: ['weight'] },
    Stationär: { cost: -6 },
    Unberechenbar: { cost: -2, conflicts: ['safety'] },
    Unsicher: { cost: -4, conflicts: ['safety'] },
    Zerbrechlich: { cost: -2, conflicts: ['durability'] },
    Zweihändig: { cost: -2 },
};

export function normalizeParameterSlots(parameterSlots) {
    if (Array.isArray(parameterSlots)) return parameterSlots;
    if (parameterSlots && typeof parameterSlots === 'object') return Object.values(parameterSlots);
    return [];
}

async function getConfiguredPackIds(settingName) {
    let packIds = [];
    try {
        const setting = game.settings.get('Ilaris', settingName);
        packIds = Array.isArray(setting) ? setting : JSON.parse(setting || '[]');
    } catch (error) {
        console.warn(`${MODULE_ID} | Kompendium-Setting ${settingName} konnte nicht gelesen werden`, error);
    }
    return packIds;
}

export async function loadConfiguredWeaponProperties() {
    const packIds = await getConfiguredPackIds('waffeneigenschaftenPacks');

    const properties = new Map();
    for (const packId of packIds) {
        const pack = game.packs.get(packId);
        if (!pack || pack.metadata.type !== 'Item') continue;

        const documents = await pack.getDocuments();
        for (const document of documents) {
            if (document.type !== 'waffeneigenschaft' || properties.has(document.name)) continue;
            properties.set(document.name, {
                key: document.name,
                description: document.system.text || '',
                parameterSlots: normalizeParameterSlots(document.system.parameterSlots),
                value: document.system.value ?? '',
                packId,
            });
        }
    }

    return [...properties.values()].sort((a, b) => a.key.localeCompare(b.key, 'de'));
}

export function mergeCompendiumItemNames(indexes, itemType) {
    const names = new Set();
    for (const index of indexes) {
        for (const entry of index || []) {
            if (entry.type === itemType && entry.name) names.add(entry.name);
        }
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'de'));
}

export async function loadConfiguredItemNames(settingName, itemType) {
    const packIds = await getConfiguredPackIds(settingName);
    const indexes = [];
    for (const packId of packIds) {
        const pack = game.packs.get(packId);
        if (!pack || pack.metadata.type !== 'Item') continue;
        indexes.push(await pack.getIndex({ fields: ['name', 'type'] }));
    }
    return mergeCompendiumItemNames(indexes, itemType);
}

export function getPropertyRule(key) {
    return WEAPON_PROPERTY_RULES[key] || null;
}

export function getPropertyConflict(key, selections) {
    const groups = getPropertyRule(key)?.conflicts || [];
    if (groups.length === 0) return null;

    return selections.find(selection => {
        const selectedGroups = getPropertyRule(selection.key)?.conflicts || [];
        return groups.some(group => selectedGroups.includes(group));
    });
}

export function getPropertyCost(selection) {
    const rule = getPropertyRule(selection.key);
    const baseCost = rule ? rule.cost : Number(selection.customCost ?? 1);
    const cost = Number.isFinite(baseCost) ? baseCost : 1;
    const slots = normalizeParameterSlots(selection.parameterSlots);
    const parameterIndex = slots.findIndex(slot => slot?.type === 'number');
    const parameter = selection.parameters?.[parameterIndex];

    if (parameterIndex === -1 || parameter === undefined || parameter === null || parameter === '') {
        return cost;
    }

    const multiplier = Number(parameter);
    return Number.isFinite(multiplier) ? cost * multiplier : cost;
}

export function getBaseWeaponCost(fields) {
    const w3 = Math.max(0, Number(fields.w3) || 0);
    const w6 = Math.max(0, Number(fields.w6) || 0);
    const tpModifier = Number(fields.tpModifier) || 0;
    const atBonus = Number(fields.wm_at) || 0;
    const vtBonus = Number(fields.wm_vt) || 0;
    return w3 * 2 + w6 * 4 + tpModifier + atBonus + vtBonus;
}

export function formatDamageFormula(fields) {
    const dice = [];
    const w3 = Math.max(0, Number(fields.w3) || 0);
    const w6 = Math.max(0, Number(fields.w6) || 0);
    const tpModifier = Number(fields.tpModifier) || 0;

    if (w3 > 0) dice.push(`${w3}W3`);
    if (w6 > 0) dice.push(`${w6}W6`);
    if (dice.length === 0) dice.push('0W6');
    if (tpModifier > 0) dice.push(`+${tpModifier}`);
    if (tpModifier < 0) dice.push(String(tpModifier));
    return dice.join('+').replace('+-', '-');
}

export function getTotalCost(selections, baseCost = 0) {
    return baseCost + selections.reduce((total, selection) => total + getPropertyCost(selection), 0);
}

function isHalfStep(value) {
    return Number.isFinite(value) && Math.abs(value * 2 - Math.round(value * 2)) < 0.000001;
}

export function validateWeaponSelections(selections, baseCost = 0) {
    const errors = [];
    const counts = new Map();
    const conflictGroups = new Map();

    for (const selection of selections) {
        const key = selection.key;
        const rule = getPropertyRule(key);
        counts.set(key, (counts.get(key) || 0) + 1);

        if (!rule && !isHalfStep(Number(selection.customCost ?? 1))) {
            errors.push(`Der K-Wert für ${key} muss in 0,5er-Schritten angegeben werden.`);
        }

        for (const group of rule?.conflicts || []) {
            if (conflictGroups.has(group)) {
                errors.push(`${key} kann nicht zusammen mit ${conflictGroups.get(group)} gewählt werden.`);
            } else {
                conflictGroups.set(group, key);
            }
        }

        const slots = normalizeParameterSlots(selection.parameterSlots);
        for (const [index, slot] of slots.entries()) {
            const value = selection.parameters?.[index];
            if (slot.required && (value === undefined || value === null || value === '')) {
                errors.push(`Der Parameter ${slot.label || slot.name || index + 1} für ${key} ist erforderlich.`);
            }
        }

        if (key === 'Fernkampfoption' && !String(selection.parameters?.[0] || '').trim()) {
            errors.push('Für Fernkampfoption muss ein Fernkampfname angegeben werden.');
        }
    }

    for (const [key, count] of counts) {
        if (count > 1 && !getPropertyRule(key)?.repeatable) {
            errors.push(`${key} kann nur einmal gewählt werden.`);
        }
    }

    const total = getTotalCost(selections, baseCost);
    if (Math.abs(total - 10) > 0.000001) {
        errors.push(`Die Eigenschaften ergeben K${total}; benötigt wird K10.`);
    }

    return { total, errors, valid: errors.length === 0 };
}

export function buildWeaponItemData(type, fields, selections) {
    const commonSystem = {
        tp: formatDamageFormula(fields),
        fertigkeit: fields.fertigkeit || '',
        talent: fields.talent || '',
        rw: Number(fields.rw) || 0,
        hauptwaffe: false,
        nebenwaffe: false,
        eigenschaften: selections.map(({ key, value, parameters = [] }) => ({
            key,
            ...(value === undefined || value === null || value === '' ? {} : { value }),
            parameters,
        })),
        text: '',
        manoverausgleich: { value: 0, overcomplicated: true },
    };

    const system =
        type === 'fernkampfwaffe'
            ? { ...commonSystem, wm_fk: Number(fields.wm_fk) || 0, lz: Number(fields.lz) || 0, rw_mod: 0 }
            : {
                  ...commonSystem,
                  wm_at: Number(fields.wm_at) || 0,
                  wm_vt: Number(fields.wm_vt) || 0,
                  rw_mod: 0,
              };

    return { name: fields.name?.trim() || 'Neue Waffe', type, system };
}

export function buildRangedClone(meleeData, rangedName) {
    const system = { ...meleeData.system };
    delete system.wm_at;
    delete system.wm_vt;
    system.wm_fk = 0;
    system.lz = 0;
    system.eigenschaften = (system.eigenschaften || []).filter(eigenschaft => eigenschaft.key !== 'Fernkampfoption');

    return {
        name: rangedName.trim(),
        type: 'fernkampfwaffe',
        system,
    };
}
