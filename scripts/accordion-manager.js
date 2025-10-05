/**
 * Accordion Manager
 * 
 * Handles accordion functionality and state persistence for the alternative actor sheet
 */

export class AccordionManager {
    
    constructor(actorId) {
        this.actorId = actorId;
    }

    /**
     * Initialize accordion listeners and restore states
     * @param {jQuery} html - The rendered HTML
     */
    initialize(html) {
        // Add accordion click listeners
        html.find('.accordion-header').click(this.onAccordionToggle.bind(this));
        
        // Restore saved accordion states
        this.restoreAccordionStates(html);
    }

    /**
     * Handle accordion toggle for item details
     * @param {Event} event - The originating click event
     */
    onAccordionToggle(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const accordionItem = $(event.currentTarget).closest('.accordion-item');
        const itemId = accordionItem.data('item-id');
        const isExpanded = accordionItem.hasClass('expanded');
        
        // Close all other accordions in the same list
        accordionItem.siblings('.accordion-item').removeClass('expanded');
        
        // Toggle current accordion
        if (isExpanded) {
            accordionItem.removeClass('expanded');
            this.removeAccordionState(itemId);
        } else {
            accordionItem.addClass('expanded');
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
     * @param {jQuery} html - The rendered HTML
     */
    restoreAccordionStates(html) {
        const storageKey = this.getAccordionStorageKey();
        const states = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
        
        // Apply saved states
        Object.keys(states).forEach(itemId => {
            if (states[itemId]) {
                const accordionItem = html.find(`.accordion-item[data-item-id="${itemId}"]`);
                if (accordionItem.length) {
                    accordionItem.addClass('expanded');
                }
            }
        });
    }

    /**
     * Clear all accordion states from session storage
     */
    clearAccordionStates() {
        const storageKey = this.getAccordionStorageKey();
        sessionStorage.removeItem(storageKey);
    }
}