/**
 * Run directly with: node --test scripts/apps/_spec_/weapon-builder-logic.spec.js
 * The project has no npm test script, so this uses the Node.js built-in runner.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildRangedClone,
    buildWeaponItemData,
    formatDamageFormula,
    getBaseWeaponCost,
    getPropertyConflict,
    getPropertyCost,
    mergeCompendiumItemNames,
    validateWeaponSelections,
} from '../weapon-builder-logic.js';

test('resolves catalog values and the default custom value', () => {
    assert.equal(getPropertyCost({ key: '+1 TP' }), 1);
    assert.equal(getPropertyCost({ key: 'Hausregel' }), 1);
});

test('scales a property K value by its first numeric parameter', () => {
    const parameterSlots = [{ name: 'stufe', type: 'number' }];

    assert.equal(getPropertyCost({ key: '+1 TP', parameterSlots, parameters: [3] }), 3);
    assert.equal(getPropertyCost({ key: 'Schwer', parameterSlots, parameters: [4] }), -2);
    assert.equal(getPropertyCost({ key: 'Hausregel', customCost: 1.5, parameterSlots, parameters: [2] }), 3);
    assert.equal(getPropertyCost({ key: '+1 TP', parameterSlots, parameters: [''] }), 1);
});

test('requires K10 and accepts custom half-point values', () => {
    const result = validateWeaponSelections([{ key: 'Hausregel', customCost: 10 }]);
    assert.equal(result.valid, true);

    const invalidStep = validateWeaponSelections([{ key: 'Hausregel', customCost: 10.2 }]);
    assert.equal(invalidStep.valid, false);
    assert.match(invalidStep.errors.join(' '), /0,5er-Schritten/);
});

test('rejects conflicts and duplicate non-stackable properties', () => {
    assert.equal(getPropertyConflict('Schwer', [{ key: 'Leicht' }])?.key, 'Leicht');

    const conflict = validateWeaponSelections([
        { key: 'Leicht' },
        { key: 'Schwer' },
        { key: 'Hausregel', customCost: 9.5 },
    ]);
    assert.equal(conflict.valid, false);
    assert.match(conflict.errors.join(' '), /kann nicht zusammen/);

    const duplicate = validateWeaponSelections([
        { key: 'Hausregel', customCost: 1 },
        { key: 'Hausregel', customCost: 1 },
        { key: 'Andere Hausregel', customCost: 8 },
    ]);
    assert.equal(duplicate.valid, false);
    assert.match(duplicate.errors.join(' '), /kann nur einmal/);
});

test('requires property parameters and the Fernkampfoption name', () => {
    const result = validateWeaponSelections([
        {
            key: 'Fernkampfoption',
            parameters: [''],
            parameterSlots: [{ label: 'Name der Fernkampfwaffe', required: true }],
        },
        { key: 'Hausregel', customCost: 8 },
    ]);

    assert.equal(result.valid, false);
    assert.match(result.errors.join(' '), /Fernkampfname/);
});

test('derives a ranged clone without Fernkampfoption', () => {
    const clone = buildRangedClone(
        {
            name: 'Axt',
            type: 'nahkampfwaffe',
            system: {
                wm_at: 1,
                wm_vt: 2,
                eigenschaften: [
                    { key: 'Fernkampfoption', parameters: ['Axtpistole'] },
                    { key: '+1 TP', parameters: [] },
                ],
            },
        },
        'Axtpistole'
    );

    assert.equal(clone.name, 'Axtpistole');
    assert.equal(clone.type, 'fernkampfwaffe');
    assert.equal(clone.system.wm_fk, 0);
    assert.equal(clone.system.eigenschaften.length, 1);
    assert.equal(clone.system.eigenschaften[0].key, '+1 TP');
});

test('merges configured skill and talent names by item type', () => {
    const indexes = [
        [
            { name: 'Einhandklingenwaffen', type: 'fertigkeit' },
            { name: 'Finte', type: 'talent' },
        ],
        [
            { name: 'Einhandklingenwaffen', type: 'fertigkeit' },
            { name: 'Wuchtschlag', type: 'talent' },
        ],
    ];

    assert.deepEqual(mergeCompendiumItemNames(indexes, 'fertigkeit'), ['Einhandklingenwaffen']);
    assert.deepEqual(mergeCompendiumItemNames(indexes, 'talent'), ['Finte', 'Wuchtschlag']);
});

test('includes structured damage and signed melee modifiers in the K budget', () => {
    assert.equal(getBaseWeaponCost({ w3: 1, w6: 1, tpModifier: -2, wm_at: 2, wm_vt: 1 }), 7);
    assert.equal(getBaseWeaponCost({ w3: 0, w6: 0, tpModifier: 0, wm_at: -2, wm_vt: -1 }), -3);
    assert.equal(formatDamageFormula({ w3: 1, w6: 2, tpModifier: -3 }), '1W3+2W6-3');
});

test('preserves an optional fixed value from a weapon property', () => {
    const weapon = buildWeaponItemData('nahkampfwaffe', { w3: 0, w6: 1, tpModifier: 0, wm_at: 0, wm_vt: 0 }, [
        { key: 'Gewicht', value: 'Leicht', parameters: [] },
    ]);

    assert.deepEqual(weapon.system.eigenschaften, [{ key: 'Gewicht', value: 'Leicht', parameters: [] }]);
});
