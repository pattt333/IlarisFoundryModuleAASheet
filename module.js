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

    // Register Handlebars helpers
    _registerHandlebarsHelpers();

    // Register Handlebars partials
    await _registerHandlebarsPartials();

    // Register the alternative actor sheet
    Actors.registerSheet('Ilaris', IlarisAlternativeActorSheet, {
        types: ['held', 'kreatur'],
        makeDefault: false,
        label: 'Alternative Actor Sheet',
    });

    console.log('Ilaris Alternative Actor Sheet | Module initialized');
});

/**
 * Register custom Handlebars helpers
 */
function _registerHandlebarsHelpers() {
    // Helper for logical OR operations
    Handlebars.registerHelper('or', function (...args) {
        // Remove the Handlebars options object from the end
        const values = args.slice(0, -1);
        return values.some(Boolean);
    });

    // Helper for equality comparison
    Handlebars.registerHelper('eq', function (a, b) {
        return a === b;
    });
}

/**
 * Register Handlebars partials for reuse across templates
 */
async function _registerHandlebarsPartials() {
    const partials = ['item-component'];

    for (const partial of partials) {
        const path = `modules/ilaris-alternative-actor-sheet/templates/partials/${partial}.hbs`;
        const response = await fetch(path);
        const template = await response.text();
        Handlebars.registerPartial(partial, template);
    }
}

// Ready hook - called when the game is ready
Hooks.once('ready', async function () {
    console.log('Ilaris Alternative Actor Sheet | Module ready');
});
