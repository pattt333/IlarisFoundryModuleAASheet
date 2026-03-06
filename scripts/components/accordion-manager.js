/**
 * Accordion Manager
 * 
 * Handles accordion functionality and state persistence for the alternative actor sheet.
 * Uses Vanilla DOM (no jQuery dependency).
 */

export class AccordionManager {
    
    constructor(actorId) {
        this.actorId = actorId;
    }

    /**
     * Initialize accordion listeners and restore states
     * @param {HTMLElement} element - The rendered sheet DOM element
     */
    initialize(element) {
        // Add accordion click listeners
        const headers = element.querySelectorAll('.accordion-header');
        for (const header of headers) {
            header.addEventListener('click', this.onAccordionToggle.bind(this));
        }
        
        // Restore saved accordion states
        this.restoreAccordionStates(element);
    }

    /**
     * Handle accordion toggle for item details
     * @param {Event} event - The originating click event
     */
    onAccordionToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const accordionItem = event.currentTarget.closest('.accordion-item');
        if (!accordionItem) return;

        const itemId = accordionItem.dataset.itemId;
        const isExpanded = accordionItem.classList.contains('expanded');
                
        // Toggle current accordion
        if (isExpanded) {
            accordionItem.classList.remove('expanded');
            this.removeAccordionState(itemId);
        } else {
            accordionItem.classList.add('expanded');
            this.saveAccordionState(itemId);
        }
    }

    /**
     * Get the storage key for accordion states
     * @returns {string} The storage key
     */
    getAccordionStorageKey() {
        return `ilaris-accordion-states-${this.actorId}`;
    }

    /**
     * Save accordion state for an item
     * @param {string} itemId - The item ID
     */
    saveAccordionState(itemId) {
        const storageKey = this.getAccordionStorageKey();
        let states = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        states[itemId] = true;
        sessionStorage.setItem(storageKey, JSON.stringify(states));
    }

    /**
     * Remove accordion state for an item
     * @param {string} itemId - The item ID
     */
    removeAccordionState(itemId) {
        const storageKey = this.getAccordionStorageKey();
        let states = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        delete states[itemId];
        sessionStorage.setItem(storageKey, JSON.stringify(states));
    }

    /**
     * Restore accordion states from session storage
     * @param {HTMLElement} element - The rendered sheet DOM element
     */
    restoreAccordionStates(element) {
        const storageKey = this.getAccordionStorageKey();
        const states = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        
        // Apply saved states
        for (const itemId of Object.keys(states)) {
            if (states[itemId]) {
                const accordionItem = element.querySelector(`.accordion-item[data-item-id="${itemId}"]`);
                if (accordionItem) {
                    accordionItem.classList.add('expanded');
                }
            }
        }
    }

    /**
     * Clear all accordion states from session storage
     */
    clearAccordionStates() {
        const storageKey = this.getAccordionStorageKey();
        sessionStorage.removeItem(storageKey);
    }
}