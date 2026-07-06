import { buildCreaturePrompt, callDeepSeekApi, parseAiCreatureResponse, validateAndClampCreature, CREATURE_EIGENSCHAFTEN } from '../utilities.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const MODULE_ID = 'ilaris-alternative-actor-sheet';

const STRENGTH_OPTIONS = [
    { value: 'schwach', label: 'Schwach' },
    { value: 'mittel', label: 'Mittel' },
    { value: 'stark', label: 'Stark' },
    { value: 'boss', label: 'Boss' },
];

const TYPE_OPTIONS = [
    { value: 'beliebig', label: 'Beliebig' },
    { value: 'humanoid', label: 'Humanoid' },
    { value: 'bestie', label: 'Bestie' },
    { value: 'dämon', label: 'Dämon' },
    { value: 'untoter', label: 'Untoter' },
    { value: 'geist', label: 'Geist' },
    { value: 'drache', label: 'Drache' },
    { value: 'elementar', label: 'Elementar' },
];

export class IlarisAlternativeAiCreatureDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['iaas-ai-creature-dialog'],
        position: { width: 700, height: 'auto' },
        window: {
            title: 'KI-Kreaturen-Generator',
            resizable: true,
        },
        actions: {
            generate: IlarisAlternativeAiCreatureDialog.#onGenerate,
        },
    };

    static PARTS = {
        form: {
            template: `modules/${MODULE_ID}/templates/apps/ai-creature-dialog.hbs`,
        },
    };

    constructor(options = {}) {
        super(options);
        this.isLoading = false;
        this.error = null;
        this.strength = 'mittel';
        this.count = 3;
        this.type = 'beliebig';
        this.description = '';
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const apiKey = game.settings.get(MODULE_ID, 'deepseekApiKey');

        return {
            ...context,
            strengthOptions: STRENGTH_OPTIONS,
            typeOptions: TYPE_OPTIONS,
            strength: this.strength,
            count: this.count,
            type: this.type,
            description: this.description,
            isLoading: this.isLoading,
            error: this.error,
            hasApiKey: Boolean(apiKey),
        };
    }

    static async #onGenerate(event, target) {
        event.preventDefault();

        const apiKey = game.settings.get(MODULE_ID, 'deepseekApiKey');
        if (!apiKey) {
            this.error = 'Kein API-Key konfiguriert. Bitte in den Moduleinstellungen einen DeepSeek API-Key hinterlegen.';
            this.render();
            return;
        }

        // Read form values
        const form = target.closest('form') || this.element?.querySelector('form');
        if (form) {
            const fd = new FormDataExtended(form);
            this.strength = fd.object.strength || 'mittel';
            this.count = Math.max(1, Math.min(10, Number(fd.object.count) || 3));
            this.type = fd.object.type || 'beliebig';
            this.description = fd.object.description || '';
        }

        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            const prompt = buildCreaturePrompt(this.description, this.strength, this.count, this.type);
            const result = await callDeepSeekApi(prompt, apiKey);

            if (!result.success) {
                this.error = result.error;
                this.isLoading = false;
                this.render();
                return;
            }

            const creatures = parseAiCreatureResponse(result.data.content);
            if (!creatures || creatures.length === 0) {
                this.error = 'Die KI-Antwort konnte nicht als gültige Kreaturen-Daten interpretiert werden. Bitte versuche es erneut.';
                this.isLoading = false;
                this.render();
                return;
            }

            // Validate, clamp, and create each creature
            let created = 0;
            for (const raw of creatures) {
                const validated = validateAndClampCreature(raw);

                // Create the actor
                const actor = await Actor.create({
                    name: validated.name,
                    type: 'kreatur',
                    system: validated.system,
                });

                // Create embedded weapon items
                if (validated.angriffe && validated.angriffe.length > 0) {
                    const items = validated.angriffe.map(a => ({
                        name: a.name,
                        type: 'angriff',
                        system: {
                            at: a.at,
                            vt: a.vt || a.at - 2,
                            tp: a.tp,
                            rw: a.rw ?? 0,
                            eigenschaften: a.eigenschaften || [],
                        },
                    }));
                    await actor.createEmbeddedDocuments('Item', items);
                }

                // Create embedded eigenschaft items
                const eigenschaften = validated.system?.eigenschaften || [];
                if (eigenschaften.length > 0) {
                    const eigenschaftItems = eigenschaften.map(name => ({
                        name,
                        type: 'eigenschaft',
                        system: {
                            description: CREATURE_EIGENSCHAFTEN[name] || '',
                        },
                    }));
                    await actor.createEmbeddedDocuments('Item', eigenschaftItems);
                }

                created++;
            }

            ui.notifications.info(`${created} Kreaturen erstellt`);
            this.isLoading = false;
            this.error = null;
            this.description = '';
            this.render();
        } catch (err) {
            this.error = `Unerwarteter Fehler: ${err.message}`;
            this.isLoading = false;
            this.render();
        }
    }
}
