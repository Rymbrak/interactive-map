import * as L from 'leaflet';

export module Sidebar {

    /**
     * Class for managing the sidebar. Provides functionality for creating new panels with icons.
     */
    export class SidebarManager implements ISidebar {

        vscode: any;

        sidebar: L.Control.Sidebar;
        iconManager: IIconManager;
        layerManager: ILayerManager;
        saveManager: ISaveManager;
        mapUtilities: IFeatureUtilities;

        sidebarPolylineId = "polylines";
        sidebarPolylineTitle = "Polylines";

        sidebarPolygonId = "polygons";
        sidebarPolygonTitle = "Polygons";

        sidebarRectangleId = "rectangle";
        sidebarRectangleTitle = "Rectangles";

        sidebarCircleId = "circles";
        sidebarCircleTitle = "Circles";

        sidebarMarkerId = "markers";
        sidebarMarkerTitle = "Markers";

        sidebarCircleMarkerId = "circlemarkers";
        sidebarCircleMarkerTitle = "Circle Markers";

        sidebarSettingsId = "settings";
        sidebarSettingsTitle = "Settings";

        highlight: HTMLElement | undefined;
        highlightLayer: string = "";

        constructor(vscode: any, map: L.Map, iconManager: IIconManager, layerManager: ILayerManager, saveManager: ISaveManager, mapUtilities: IFeatureUtilities) {

            this.vscode = vscode;
            this.sidebar = L.control.sidebar({
                container: 'sidebar',
                position: 'right'
            }).addTo(map);

            this.iconManager = iconManager;
            this.layerManager = layerManager;
            this.saveManager = saveManager;
            this.mapUtilities = mapUtilities;

            /**
             * Create panels for the sidebar. Order of creation is the same order they appear in.
             */

            this.createFeaturePanel("polyline", "polyline", this.sidebarPolylineId, this.sidebarPolylineTitle);
            this.createFeaturePanel("polygon", "polygon", this.sidebarPolygonId, this.sidebarPolygonTitle);
            this.createFeaturePanel("rectangle", "rectangle", this.sidebarRectangleId, this.sidebarRectangleTitle);
            this.createFeaturePanel("circle", "circle", this.sidebarCircleId, this.sidebarCircleTitle);
            this.createFeaturePanel("marker", "marker", this.sidebarMarkerId, this.sidebarMarkerTitle);
            this.createFeaturePanel("circlemarker", "circle marker", this.sidebarCircleMarkerId, this.sidebarCircleMarkerTitle);

            this.createSettingsPanel();
        }

        /**
         * Creates a panel entry in the sidebar.
         * 
         * Panels can be accessed from the sidebar through the icon and contain a header alongside content in html.
         * @param id UID used to access the panel. Any string can be used, as long as it is unique.
         * @param icon  Icon for the sidebar, passed as html string.
         * @param content  Panel content passed as html string.
         * @param title Title of the panel page.
         */
        createPanel(id: string, icon: string, content: string, title: string) {

            let panelContent = {
                id: id,
                tab: icon,
                pane: content,
                title: title
            };

            this.sidebar.addPanel(panelContent);
        }

        /**
         * Creates a panel in the sidebar using the given icon, feature name id and title.
         * @param icon Name of the icon to be retrieved from the Icon storage.
         * @param featureName Name of the feature. It will be used in the default content.
         * @param id ID for the sidebar panel.
         * @param title Title for the sidebar panel.
         */
        createFeaturePanel(icon: string, featureName: string, id: string, title: string) {
            this.createPanel(id,
                this.iconManager.getIcon(icon, ""),
                this.emptyFeaturePanel(featureName),
                title);
        }

        /**
         * Returns a message for panels whose feature list is empty.
         * @param featureName Name of the feature in singular form such as 'marker'.
         * @returns.
         */
        emptyFeaturePanel(featureName: string) {
            return '<p class="panel">' + '<span class="markerEntryBody">' +
                "Map contains no " + featureName + "s. Use the toolbar on the left to place new " + featureName + "s." +
                '</span>' + '  </p>';
        }

        /**
         * Create a panel in the sidebar containing settings.
         */
        createSettingsPanel() {

            this.createPanel(this.sidebarSettingsId,
                this.iconManager.getIcon("settings", ""),
                '<p class="panel">' + '<div id="dropBackground" class="drop">' +
                '<div class="verticalAlign"> ' +
                "Drop an image here to set the map's background. \n" +
                "(You must hold shift *before* entering the Interactive Map window while dragging. Also, dragging from the Vscode explorer doesn't work.)" +
                '</div>' +
                '</div>' + '  </p>',
                this.sidebarSettingsTitle);

            document.getElementById("dropBackground")?.addEventListener("drop", (e) => this.handleDrop(e), false);
            document.getElementById("dropBackground")?.addEventListener("dragover", (e) => this.allowDrop(e), false);
            document.getElementById("dropBackground")?.addEventListener("dragenter", (e) => this.allowDrop(e), false);
        }

        allowDrop(ev: any) {
            ev.preventDefault();
        }

        /**
         * Handles image drops for the map's background setting.
         * 
         * Images dropped into the settings background area are stored in the workspace's interactive-map folder (automatically created if it doesn't exist.) and used for the map's background.
         * @param e Image drag event.
         */
        async handleDrop(e: any) {
            e.stopPropagation(); // Stops some browsers from redirecting.
            e.preventDefault();
            let file = e.dataTransfer.items[0].getAsFile();
            /**
             * Read the dropped file and create an image from it,
             * The images dimensions are used to create new bounds for the map.
             */
            var reader = new FileReader();
            reader.onload = (() => {

                return (e: any) => {
                    let image = new Image();
                    image.src = e.target.result;

                    image.onload = () => {
                        // bounds uses yx instead of xy since thats Leaflet's standard.
                        let bounds: [number, number][] = [[0, 0], [image.height, image.width]];
                        this.saveManager.setBounds(bounds);
                        this.mapUtilities.setBounds(bounds);
                    };
                };
            }
            )();
            reader.readAsDataURL(file);

            var img = await file.arrayBuffer();
            var name = file.name;

            /**
             * Post the image to the extension, so it can be saved in the workspace's interactive-map folder.
             */
            this.vscode.postMessage({
                command: 'image',
                image: img,
                name: name
            });
        }

        /**
         * Function to (re)create panes in the sidebar for each tracked feature type.
         * These panes contain entries for each feature of the matching type, which allow you to edit their name and description, as well as locating them on the map.
         */
        populateSidebarFeatures() {

            this.populateSidebarFeature(this.sidebarPolylineId, this.sidebarPolylineTitle, "polyline-small", "polyline", "polyline");
            this.populateSidebarFeature(this.sidebarPolygonId, this.sidebarPolygonTitle, "polygon-small", "polygon", "polygon");
            this.populateSidebarFeature(this.sidebarRectangleId, this.sidebarRectangleTitle, "rectangle-small", "rectangle", "rectangle");
            this.populateSidebarFeature(this.sidebarCircleId, this.sidebarCircleTitle, "circle-small", "circle", "circle");
            this.populateSidebarFeature(this.sidebarMarkerId, this.sidebarMarkerTitle, "marker-small", "marker", "marker");
            this.populateSidebarFeature(this.sidebarCircleMarkerId, this.sidebarCircleMarkerTitle, "circlemarker-small", "circlemarker", "circle marker");
        }

        /**
         * Create the html for the sidebar panel content. Each feature has an entry with a header, a button for locating the feature on the map and a description.
         * @param id Id for the pane.
         * @param title Name of the pane.
         * @param headerIcon Icon used for the pane. You can pass html (such as the strings provided by the IconManager.)
         * @param layer Name of the layer from the LayerManager containing the desired features.
         */
        populateSidebarFeature(id: string, title: string, headerIcon: string, layer: string, featureName: string) {
            var entries = "";

            var index = 0;
            let layers = this.layerManager.getLayer(layer).getLayers();

            layers.forEach((element: any) => {
                entries += '<div class="markerEntryBox">' +
                    '<div class="markerHeaderDiv">' +
                    this.sidebarMarkerHeaderButton(layer, index, headerIcon) +
                    this.sidebarMarkerHeader(layer, element.feature.properties.name, index) +
                    this.sidebarMarkerIdHeader(element._leaflet_id) +
                    '</div>' +
                    '<div class="markerHeaderDiv">' +
                    this.sidebarMarkerBody(layer, element.feature.properties.desc, index) +
                    '</div>' +
                    '</div>';
                index++;
            });

            if (layers.length === 0) {
                entries += this.emptyFeaturePanel(featureName);
            }

            entries = '<div class="panelContent">' + entries + '</div>';

            this.updatePane(id, title, layer, entries);
        }

        /**
         * Returns the panel with the given id.
         * @param {*} id Id of the panel.
         * @returns  A panel, otherwise throws an error.
         */
        getPane(id: string) {

            for (let i = 0; i < this.sidebar._panes.length; i++) {
                if (this.sidebar._panes[i].id === id) {
                    return this.sidebar._panes[i];
                }
            }
            throw Error('Pane "' + id + '" not found');
        }

        /**
         *  Update the content of a pane with the given id.
         * @param {*} id Id of the panel to update.
         * @param {*} name Title of the Pane
         * @param {*} entries HTML content to use for updating.
         */
        updatePane(id: string, name: string, layer: string, entries: string) {

            var content = '';
            content += '<h1 class="leaflet-sidebar-header">' + name;
            content += '<span class="leaflet-sidebar-close"><i class="fa fa-caret-' + this.sidebar.options.position + '"></i></span>';
            content += '</h1>';

            var pane = this.getPane(id);
            pane.innerHTML = content + '<p class="panel">' + entries + '  </p>';

            this.addListeners(layer);
        }

        /**
         * Creates a HTML label for the marker's Leaflet Id.
         * @param {*} id Leaflet id.
         * @returns  A HTML string.
         */
        sidebarMarkerIdHeader(id: number) {
            return '<label class="markerEntryHeaderId">' +
                id +
                '</label>';
        }

        /**
         * Creates a HTML textarea for the marker's name.
         * @param {*} name Text to use for the header.
         * @param {*} index Index of the marker in markerLayer.
         * @returns A HTML string.
         */
        sidebarMarkerHeader(layer: string, name: string, index: number) {
            return '<textarea id="' + layer + 'Name' + index + '" class="markerEntryHeader" contenteditable>' +
                name +
                '</textarea>';
        }

        /**
         * Creates  a HTML button with a listener to pan towards the marker's location on the map.
         * @param {*} index Index of the marker in markerLayer.
         * @returns A HTML string.
         */
        sidebarMarkerHeaderButton(layer: string, index: number, icon: string) {

            return '<button id="' + layer + 'Button' + index + '" class ="btn">' +
                this.iconManager.getIcon(icon, "") +
                '</button>';
        }

        /**
         * Creates a HTML textarea for the marker's description.
         * @param {*} text Description of the marker as string.
         * @param {*} index Index of the marker in markerLayer.
         * @returns A HTML string.
         */
        sidebarMarkerBody(layer: string, text: string, index: number) {
            return '<textarea id="' + layer + index + '" class="markerEntryBody" contenteditable>' +
                text +
                '</textarea>';
        }

        /**
         * Setup listeners for the marker entries in the sidebar. 
         * 
         * Each entry consists of a location button, a name field and a body. The name and body fields have listeners to update the corresponding marker.
         * @param layer Name of the layer we want to add listeners to.
         */
        addListeners(layer: string) {
            let index = 0;
            this.layerManager.getLayer(layer).getLayers().forEach((element: any) => {
                let number = index; // Use a temp variable, otherwise it would use the final value of index...
                document.getElementById(layer + "Name" + index)?.addEventListener("change", (e) => this.mapUtilities.setFeatureName(layer, number));
                document.getElementById(layer + "Button" + index)?.addEventListener("click", (e) => {
                    this.mapUtilities.panToFeature(layer, number);
                    this.mapUtilities.highlightFeature(layer, number);
                    this.highlightSidebarMarker(layer, number);
                });
                document.getElementById(layer + index)?.addEventListener("change", (e) => this.mapUtilities.setFeatureDesc(layer, number));

                index++;
            });
        }

        /**
         * Highlight a feature in the sidebar.
         * @param index 
         */
        highlightSidebarMarker(layer: string, index: number) {

            var feature = document.getElementById(layer + "Button" + index);

            if (feature) {

                if (this.highlight) {
                    this.highlight.innerHTML = this.iconManager.getIcon(this.highlightLayer + "-small", "");
                }

                feature.innerHTML = this.iconManager.getIcon(layer + "-small", "highlight");

                /**
                 * Store current highlighted element and the layer so we can reset their values when the highlight changes.
                 */
                this.highlight = feature;
                this.highlightLayer = layer;
            }
        }

    }

}