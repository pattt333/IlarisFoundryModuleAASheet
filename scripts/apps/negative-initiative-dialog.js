/**
 * Negative Initiative Continue Dialog
 *
 * Dialog der am Ende einer Runde erscheint, wenn ein Actor negative Initiative hat.
 * Fragt ob die Aktion fortgesetzt werden soll.
 */
const { DialogV2 } = foundry.applications.api;

export class NegativeInitiativeDialog {
    /**
     * Show the negative initiative continue dialog.
     * @param {Actor} actor
     * @param {Combat} combat
     * @returns {Promise<'yes'|'no'>}
     */
    static async show(actor, _combat) {
        const content = `
            <p><strong>${actor.name}</strong> hatte negative Initiative und war diese Runde noch nicht dran.</p>
            <p>Soll die Aktion in der nächsten Runde fortgesetzt werden?</p>
        `;

        const result = await DialogV2.prompt({
            window: { title: 'Aktion fortsetzen?' },
            content: content,
            buttons: [
                {
                    action: 'yes',
                    label: 'Ja',
                    icon: 'fas fa-check',
                    default: true,
                    callback: async () => {
                        ui.notifications.info(`${actor.name} setzt die Aktion in der nächsten Runde fort.`);
                    },
                },
                {
                    action: 'no',
                    label: 'Nein',
                    icon: 'fas fa-times',
                    callback: async () => {
                        // Remove combat modifier effects
                        const effectsToRemove = actor.effects.filter(e =>
                            e.name.startsWith('Kampf-Modifikatoren Runde')
                        );
                        if (effectsToRemove.length > 0) {
                            await actor.deleteEmbeddedDocuments(
                                'ActiveEffect',
                                effectsToRemove.map(e => e.id)
                            );
                        }

                        // Clear dialogState (movedAction and movedActionRounds)
                        await actor.unsetFlag('ilaris-alternative-actor-sheet', 'dialogState');

                        ui.notifications.info(`${actor.name}'s Kampf-Modifikatoren wurden entfernt.`);
                    },
                },
            ],
        });

        return result ?? 'yes';
    }
}
