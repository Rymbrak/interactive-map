interface ISidebar {
    /**
     * Function to (re)create panes in the sidebar for each tracked feature type.
     * These panes contain entries for each feature of the matching type, which allow you to edit their name and description, as well as locating them on the map.
     */
    populateSidebarFeatures(): void;

    /**
    * Creates a panel entry in the sidebar.  Panels appear in call order.
    * 
    * Panels can be accessed from the sidebar through the icon and contain a header alongside content in html.
    * @param id UID used to access the panel. Any string can be used, as long as it is unique.
    * @param icon  Icon for the sidebar, passed as html string.
    * @param content  Panel content passed as html string.
    * @param title Title of the panel page.
    */
    createPanel(panelId: string, icon: string, content: string, title: string): void;

    /**
     * Returns the panel with the given id.
     * @param {*} id Id of the panel.
     * @returns  A panel, otherwise throws an error.
     */
    getPane(id: string): any;

    /**
    *  Update the content of a feature pane with the given id. Also creates listeners for the respective feature.
    *  Each feature has listeners to update the name and description, as well as paning to it on the map.
    * @param {*} id Id of the panel to update.
    * @param {*} name Title of the pane.
    * @param {*} entries HTML content to use for updating.
    */
    updateFeaturePane(id: string, name: string, layer: string, entries: string): void;

    /**
     * Updates the content of a pane. Content can be provided as html formatted string.
     * @param id Id of the pane.
     * @param {*} name Title of the pane.
     * @param content Html formatted string.
     */
    updatePane(id: string, name: string, content: string): void;

    /**
     * Updates the help panel's content.
     * @param html Html string used to render the help panel.
     */
    setHelpPanel(html: string): void;
}