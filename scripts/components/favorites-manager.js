/**
 * Favorites Manager
 * 
 * Handles favorites component functionality including tab switching,
 * collapse/expand, and state persistence for the alternative actor sheet
 */

export class FavoritesManager {
    
    constructor(actorId) {
        this.actorId = actorId;
    }

    /**
     * Initialize favorites component functionality
     * @param {jQuery} html - The rendered HTML
     */
    initialize(html) {
        // Favorites tab switching
        html.find('.favorites-tab').click(this.onFavoritesTabSwitch.bind(this));
        
        // Favorites collapse/expand toggle
        html.find('.favorites-collapse').click(this.onFavoritesToggle.bind(this));
        
        // Favorites clear button
        html.find('.favorites-clear').click(this.onFavoritesClear.bind(this));
        
        // Restore last active tab
        this.restoreFavoritesTab(html);
        
        // TODO: Future drag and drop support will be added here
        console.log('Favorites component initialized');
    }

    /**
     * Handle favorites component collapse/expand toggle
     * @param {Event} event - The originating click event
     */
    onFavoritesToggle(event) {
        event.preventDefault();
        const favoritesComponent = $(event.currentTarget).closest('.favorites-component');
        favoritesComponent.toggleClass('collapsed');
        
        // Update the chevron icon
        const icon = $(event.currentTarget).find('i');
        icon.toggleClass('fa-chevron-up fa-chevron-down');
        
        // Save collapse state to session storage
        const isCollapsed = favoritesComponent.hasClass('collapsed');
        sessionStorage.setItem(`ilaris-favorites-collapsed-${this.actorId}`, isCollapsed);
    }

    /**
     * Handle clearing all favorites
     * @param {Event} event - The originating click event  
     */
    onFavoritesClear(event) {
        event.preventDefault();
        
        // Show confirmation dialog
        Dialog.confirm({
            title: "Favoriten löschen",
            content: "<p>Möchten Sie wirklich alle Favoriten löschen?</p>",
            yes: () => {
                // TODO: Clear favorites from actor flags
                ui.notifications.info("Favoriten gelöscht");
                console.log('All favorites cleared');
            },
            no: () => {},
            defaultYes: false
        });
    }

    /**
     * Handle favorites tab switching
     * @param {Event} event - The originating click event
     */
    onFavoritesTabSwitch(event) {
        event.preventDefault();
        const clickedTab = $(event.currentTarget);
        const targetTab = clickedTab.data('tab');
        
        // Update tab active states
        clickedTab.siblings('.favorites-tab').removeClass('active');
        clickedTab.addClass('active');
        
        // Update content active states
        const favoritesComponent = clickedTab.closest('.favorites-component');
        favoritesComponent.find('.favorites-tab-content').removeClass('active');
        favoritesComponent.find(`[data-tab-content="${targetTab}"]`).addClass('active');
        
        // Save active tab to session storage
        sessionStorage.setItem(`ilaris-favorites-active-tab-${this.actorId}`, targetTab);
        
        // Update clear button visibility (only show on favorites tab)
        const clearButton = favoritesComponent.find('.favorites-clear');
        if (targetTab === 'favorites') {
            clearButton.show();
        } else {
            clearButton.hide();
        }
        
        console.log(`Switched to favorites tab: ${targetTab}`);
    }

    /**
     * Restore the last active favorites tab
     * @param {jQuery} html - The rendered HTML
     */
    restoreFavoritesTab(html) {
        const savedTab = sessionStorage.getItem(`ilaris-favorites-active-tab-${this.actorId}`) || 'combat';
        
        // Activate the saved tab
        const targetTab = html.find(`[data-tab="${savedTab}"]`);
        if (targetTab.length) {
            targetTab.siblings('.favorites-tab').removeClass('active');
            targetTab.addClass('active');
            
            // Activate corresponding content
            html.find('.favorites-tab-content').removeClass('active');
            html.find(`[data-tab-content="${savedTab}"]`).addClass('active');
            
            // Update clear button visibility
            const clearButton = html.find('.favorites-clear');
            if (savedTab === 'favorites') {
                clearButton.show();
            } else {
                clearButton.hide();
            }
        }
        
        // Restore collapse state
        const isCollapsed = sessionStorage.getItem(`ilaris-favorites-collapsed-${this.actorId}`) === 'true';
        if (isCollapsed) {
            const favoritesComponent = html.find('.favorites-component');
            favoritesComponent.addClass('collapsed');
            
            // Update the chevron icon
            const icon = html.find('.favorites-collapse i');
            icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
        }
    }
}