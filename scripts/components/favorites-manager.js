/**
 * Favorites Manager
 * 
 * Handles favorites component functionality including tab switching,
 * collapse/expand, and state persistence for the alternative actor sheet.
 * Uses Vanilla DOM (no jQuery dependency).
 */

export class FavoritesManager {
    
    constructor(actorId) {
        this.actorId = actorId;
    }

    /**
     * Initialize favorites component functionality
     * @param {HTMLElement} element - The rendered sheet DOM element
     */
    initialize(element) {
        // Favorites tab switching
        const tabs = element.querySelectorAll('.favorites-tab');
        for (const tab of tabs) {
            tab.addEventListener('click', this.onFavoritesTabSwitch.bind(this));
        }
        
        // Favorites collapse/expand toggle
        const collapseButtons = element.querySelectorAll('.favorites-collapse');
        for (const btn of collapseButtons) {
            btn.addEventListener('click', this.onFavoritesToggle.bind(this));
        }
        
        // Favorites clear button
        const clearButtons = element.querySelectorAll('.favorites-clear');
        for (const btn of clearButtons) {
            btn.addEventListener('click', this.onFavoritesClear.bind(this));
        }
        
        // Restore last active tab
        this.restoreFavoritesTab(element);
    }

    /**
     * Handle favorites component collapse/expand toggle
     * @param {Event} event - The originating click event
     */
    onFavoritesToggle(event) {
        event.preventDefault();
        const favoritesComponent = event.currentTarget.closest('.favorites-component');
        if (!favoritesComponent) return;

        favoritesComponent.classList.toggle('collapsed');
        
        // Update the chevron icon
        const icon = event.currentTarget.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-up');
            icon.classList.toggle('fa-chevron-down');
        }
        
        // Save collapse state to session storage
        const isCollapsed = favoritesComponent.classList.contains('collapsed');
        sessionStorage.setItem(`ilaris-favorites-collapsed-${this.actorId}`, isCollapsed);
    }

    /**
     * Handle clearing all favorites
     * @param {Event} event - The originating click event  
     */
    async onFavoritesClear(event) {
        event.preventDefault();
        
        // Show confirmation dialog using DialogV2
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Favoriten löschen" },
            content: "<p>Möchten Sie wirklich alle Favoriten löschen?</p>",
            rejectClose: false
        });

        if (confirmed) {
            // TODO: Clear favorites from actor flags
            ui.notifications.info("Favoriten gelöscht");
        }
    }

    /**
     * Handle favorites tab switching
     * @param {Event} event - The originating click event
     */
    onFavoritesTabSwitch(event) {
        event.preventDefault();
        const clickedTab = event.currentTarget;
        const targetTab = clickedTab.dataset.tab;
        
        // Update tab active states — remove active from siblings, add to clicked
        const parent = clickedTab.parentElement;
        if (parent) {
            for (const sibling of parent.querySelectorAll('.favorites-tab')) {
                sibling.classList.remove('active');
            }
        }
        clickedTab.classList.add('active');
        
        // Update content active states
        const favoritesComponent = clickedTab.closest('.favorites-component');
        if (!favoritesComponent) return;

        const allContents = favoritesComponent.querySelectorAll('.favorites-tab-content');
        for (const content of allContents) {
            content.classList.remove('active');
        }
        const targetContent = favoritesComponent.querySelector(`[data-tab-content="${targetTab}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        // Save active tab to session storage
        sessionStorage.setItem(`ilaris-favorites-active-tab-${this.actorId}`, targetTab);
        
        // Update clear button visibility (only show on favorites tab)
        const clearButton = favoritesComponent.querySelector('.favorites-clear');
        if (clearButton) {
            clearButton.style.display = (targetTab === 'favorites') ? '' : 'none';
        }
    }

    /**
     * Restore the last active favorites tab
     * @param {HTMLElement} element - The rendered sheet DOM element
     */
    restoreFavoritesTab(element) {
        const savedTab = sessionStorage.getItem(`ilaris-favorites-active-tab-${this.actorId}`) || 'combat';
        
        // Activate the saved tab
        const targetTab = element.querySelector(`.favorites-tab[data-tab="${savedTab}"]`);
        if (targetTab) {
            const parent = targetTab.parentElement;
            if (parent) {
                for (const sibling of parent.querySelectorAll('.favorites-tab')) {
                    sibling.classList.remove('active');
                }
            }
            targetTab.classList.add('active');
            
            // Activate corresponding content
            const allContents = element.querySelectorAll('.favorites-tab-content');
            for (const content of allContents) {
                content.classList.remove('active');
            }
            const targetContent = element.querySelector(`[data-tab-content="${savedTab}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Update clear button visibility
            const clearButton = element.querySelector('.favorites-clear');
            if (clearButton) {
                clearButton.style.display = (savedTab === 'favorites') ? '' : 'none';
            }
        }
        
        // Restore collapse state
        const isCollapsed = sessionStorage.getItem(`ilaris-favorites-collapsed-${this.actorId}`) === 'true';
        if (isCollapsed) {
            const favoritesComponent = element.querySelector('.favorites-component');
            if (favoritesComponent) {
                favoritesComponent.classList.add('collapsed');
            }
            
            // Update the chevron icon
            const icon = element.querySelector('.favorites-collapse i');
            if (icon) {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
            }
        }
    }
}