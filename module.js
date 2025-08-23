/**
 * Ilaris Alternative Actor Sheet Module
 *
 * This module provides an alternative actor sheet for the Ilaris Foundry VTT system.
 * It extends the base Ilaris actor sheet with enhanced layout and functionality.
 */

import { IlarisAlternativeActorSheet } from './scripts/sheets/alternative-actor-sheet.js';

// Module initialization hook
Hooks.once('init', async function () {
    console.log('Ilaris Alternative Actor Sheet | Initializing module');

    // Register the alternative actor sheet
    Actors.registerSheet('Ilaris', IlarisAlternativeActorSheet, {
        types: ['held', 'kreatur'],
        makeDefault: false,
        label: 'Alternative Actor Sheet',
    });

    console.log('Ilaris Alternative Actor Sheet | Module initialized');
});

// Ready hook - called when the game is ready
Hooks.once('ready', async function () {
    console.log('Ilaris Alternative Actor Sheet | Module ready');
});
