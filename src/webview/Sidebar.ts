import * as L from 'leaflet';
import { Integration } from '../integration/Tokenizer';
import { IconBrowser } from './IconBrowser';

export module Sidebar {

    /**
     * Class for managing the sidebar. Provides functionality for creating new panels with icons.
     */
    export class SidebarManager implements ISidebar {

        vscode: any;

        sidebar: L.Control.Sidebar;
        iconManager: IIconManager;
        iconBrowser: IconBrowser.IconBrowser;
        layerManager: ILayerManager;
        saveManager: ISaveManager;
        mapUtilities: IFeatureUtilities;
        helpPanel: IHelpPanel;

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
        highlightIcon: string = "";
        highlightLayer: string = "";
        highlightIndex: number = -1;

        tokenizer = new Integration.Tokenizer();

        constructor(vscode: any, map: L.Map, iconManager: IIconManager, iconBrowser: IconBrowser.IconBrowser, layerManager: ILayerManager, saveManager: ISaveManager, mapUtilities: IFeatureUtilities, helpPanel: IHelpPanel) {

            this.vscode = vscode;
            this.sidebar = L.control.sidebar({
                container: 'sidebar',
                position: 'right'
            }).addTo(map);

            this.iconManager = iconManager;
            this.iconBrowser = iconBrowser;
            this.layerManager = layerManager;
            this.saveManager = saveManager;
            this.mapUtilities = mapUtilities;
            this.helpPanel = helpPanel;

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
            /**
             * Panel with additional information on general use.
             */
            this.createPanel("help", this.iconManager.getIcon("help", ""), this.helpPanel.getContent(), "Help");
            this.requestHtml("help-general");
        }


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


        requestHtml(path: string) {
            this.vscode.postMessage({
                command: 'requestHtml',
                name: path
            });
        }

        async setHelpPanel(html: string): Promise<void> {

            /**
             * The base tokenizer has a definition for bootstrap icons that we can use to insert them into the html.
             */
            let text = await this.tokenizer.combine(this.tokenizer.getTokens(html), true);
            this.updatePane("help", "Help", text);
        }

        updatePane(id: string, name: string, content: string): void {

            let header = "";
            header += '<h1 class="leaflet-sidebar-header">' + name;
            header += '<span class="leaflet-sidebar-close"><i class="fa fa-caret-' + this.sidebar.options.position + '"></i></span>';
            header += '</h1>';
            var pane = this.getPane(id);
            /**
             * panelContent allows scrolling.
             */
            pane.innerHTML = header + '<p class="panel">' + '<div class="panelContent">' + content + '</div>' + '  </p>';
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

                let custom = false;
                let actualIcon = headerIcon;
                /**
                 * Check whether a source for the icon exists and use it in that case.
                 * Otherwise we use the standard icon.
                 */
                if (element.feature.properties.src && element.feature.properties.src !== "") {

                    actualIcon = this.iconManager.makeImage(element.feature.properties.src, element.feature.properties.color);
                    custom = true;
                }

                entries += '<div class="markerEntryBox">' +
                    '<div class="markerHeaderDiv">' +
                    this.sidebarMarkerHeaderButton(layer, index, actualIcon, custom) +
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

            this.updateFeaturePane(id, title, layer, entries);
        }

        getPane(id: string) {

            for (let i = 0; i < this.sidebar._panes.length; i++) {
                if (this.sidebar._panes[i].id === id) {
                    return this.sidebar._panes[i];
                }
            }
            throw Error('Pane "' + id + '" not found');
        }

        updateFeaturePane(id: string, name: string, layer: string, entries: string) {

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
        sidebarMarkerHeaderButton(layer: string, index: number, icon: string, custom: boolean) {

            let iconBody = custom ? icon : this.iconManager.getIcon(icon, "");
            return '<button id="' + layer + 'Button' + index + '" class ="btn">' +
                iconBody +
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
                /**
                 * We can set the icon by right clicking the marker.
                 */
                document.getElementById(layer + "Button" + index)?.addEventListener("contextmenu", (e) => {

                    let icon: string = "";
                    if (this.iconBrowser.currentIcon !== "") {
                        icon = this.iconManager.makeImage(this.iconBrowser.currentIcon, this.mapUtilities.baseColor);
                    } else {
                        icon = this.iconManager.getIcon("marker", "");
                    }

                    let lIcon = this.iconManager.makeIcon(this.iconBrowser.currentIcon);
                    this.mapUtilities.setFeatureIcon(layer, number, lIcon, this.iconBrowser.currentIcon);
                    this.setMarkerIcon(layer, number, icon);
                    this.saveManager.saveMap();

                    /**
                     * In case that the marker is the current highlight, we need to update the highlight and highlightIcon
                     */
                    if (this.highlightLayer === layer && this.highlightIndex === number && this.highlight) {
                        this.setMarkerIcon(layer, number, this.toHighlight(icon));
                        this.highlightIcon = icon;
                    }

                });

                document.getElementById(layer + index)?.addEventListener("change", (e) => this.mapUtilities.setFeatureDesc(layer, number));
                index++;
            });
        }

        setMarkerIcon(layer: string, index: number, icon: string) {

            var feature = document.getElementById(layer + "Button" + index);

            if (feature) {
                feature.innerHTML = icon;
            }
        }

        /**
         * Highlight a feature in the sidebar.
         * @param index 
         */
        highlightSidebarMarker(layer: string, index: number) {

            var feature = document.getElementById(layer + "Button" + index);

            if (feature) {

                if (this.highlight) {
                    /**
                     * Reset previous highlight
                     */
                    this.highlight.innerHTML = this.highlightIcon;
                }

                //Store current highlight's icon
                this.highlightIcon = feature.innerHTML;
                let highlighted = this.toHighlight(feature.innerHTML);

                if (highlighted !== feature.innerHTML) {

                    feature.innerHTML = highlighted;
                } else {

                    feature.innerHTML = this.iconManager.getIcon(layer + "-small", "highlight");
                }

                /**
                 * Store current highlighted element and the layer so we can reset their values when the highlight changes.
                 */
                this.highlight = feature;
                this.highlightLayer = layer;
                this.highlightIndex = index;
            }
        }

        /**
         * Replaces the background color with the highlight color. Used to change svg icons to highlighted variants.
         * @param icon 
         * @returns 
         */
        toHighlight(icon: string): string {
            /**
             * Match any css legal color format: rgb(a) /hsl with word and the rest matches the parentheses content.
             * The remaining regular expressions are for color names(just a word) and hex colors.
             */
            let backgroundColor: RegExp = /background-color: ((\w+\(([^\)]+)\))|\w+|#\w+)/;
            let backgroundColorHighlight: string = "background-color: yellow;";
            return icon.replace(backgroundColor, backgroundColorHighlight);
        }
    }
}