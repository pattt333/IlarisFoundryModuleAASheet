/**
 * Run directly with: node --test scripts/apps/_spec_/fertigkeit-dialog.spec.js
 * The project has no npm test script, so this uses the Node.js built-in runner.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMessageMode } from '../fertigkeit-dialog-logic.js';

const v14Modes = { public: {}, self: {}, gm: {}, blind: {} };

test('maps legacy Foundry roll modes to V14 message modes', () => {
    assert.equal(normalizeMessageMode('publicroll', v14Modes), 'public');
    assert.equal(normalizeMessageMode('selfroll', v14Modes), 'self');
    assert.equal(normalizeMessageMode('gmroll', v14Modes), 'gm');
    assert.equal(normalizeMessageMode('blindroll', v14Modes), 'blind');
});

test('keeps supported V14 message modes', () => {
    assert.equal(normalizeMessageMode('public', v14Modes), 'public');
    assert.equal(normalizeMessageMode('self', v14Modes), 'self');
    assert.equal(normalizeMessageMode('gm', v14Modes), 'gm');
    assert.equal(normalizeMessageMode('blind', v14Modes), 'blind');
});

test('falls back to public for empty or unknown modes', () => {
    assert.equal(normalizeMessageMode('', v14Modes), 'public');
    assert.equal(normalizeMessageMode(undefined, v14Modes), 'public');
    assert.equal(normalizeMessageMode('unsupported', v14Modes), 'public');
});
