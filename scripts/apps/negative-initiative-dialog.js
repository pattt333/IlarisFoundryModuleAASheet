/**
 * Negative Initiative Continue Dialog
 * 
 * Dialog der am Ende einer Runde erscheint, wenn ein Actor negative Initiative hat.
 * Fragt ob die Aktion fortgesetzt werden soll.
 */
export class NegativeInitiativeDialog extends Dialog {
    
    constructor(actor, combat, dialogData = {}, options = {}) {
        const content = `
            <p><strong>${actor.name}</strong> hatte negative Initiative und war diese Runde noch nicht dran.</p>
            <p>Soll die Aktion in der nächsten Runde fortgesetzt werden?</p>
        `;
        
        super({
            title: "Aktion fortsetzen?",
            content: content,
            buttons: {
                yes: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Ja",
                    callback: async () => {
                        // Actor wird übersprungen, Effect bleibt bestehen
                        ui.notifications.info(`${actor.name} setzt die Aktion in der nächsten Runde fort.`);
                    }
                },
                no: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Nein",
                    callback: async () => {
                        // Remove combat modifier effects
                        const effectsToRemove = actor.effects.filter(e => 
                            e.name.startsWith("Kampf-Modifikatoren Runde")
                        );
                        if (effectsToRemove.length > 0) {
                            await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToRemove.map(e => e.id));
                        }
                        ui.notifications.info(`${actor.name}'s Kampf-Modifikatoren wurden entfernt.`);
                    }
                }
            },
            default: "yes"
        }, options);
        
        this.actor = actor;
        this.combat = combat;
    }
}
