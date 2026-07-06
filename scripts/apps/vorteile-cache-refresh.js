import { refreshVorteileCache } from '../utilities.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Minimal application for the registerMenu API.
 * Runs refreshVorteileCache on open and closes immediately.
 */
export class VorteileCacheRefresh extends HandlebarsApplicationMixin(ApplicationV2) {
    static PARTS = {};

    async _prepareContext() {
        const count = await refreshVorteileCache();
        if (count > 0) {
            ui.notifications.info(`${count} Vorteile im Cache gespeichert`);
        } else {
            ui.notifications.warn('Keine Vorteile gefunden. Ist das Vorteile-Kompendium verfügbar?');
        }
        await this.close();
        return {};
    }
}
