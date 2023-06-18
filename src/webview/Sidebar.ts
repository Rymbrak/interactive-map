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

        sidebarMarkerId = "markers";
        sidebarMarkerTitle = "Markers";
        sidebarSettingsId = "settings";
        sidebarSettingsTitle = "Settings";

        highlight: HTMLElement | undefined;

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

            this.createMarkerPanel();
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
         * Create a panel in the sidebar that lists all markers with editable descriptions and names.
         */
        createMarkerPanel() {

            this.createPanel(this.sidebarMarkerId,
                this.iconManager.getIcon("marker"),
                '<p class="panel">' + '<span class="markerEntryBody">' +
                "Map contains no markers. Use the toolbar on the left to place new markers." +
                '</span>' + '  </p>',
                this.sidebarMarkerTitle);
        }

        /**
         * Create a panel in the sidebar containing settings.
         */
        createSettingsPanel() {

            this.createPanel(this.sidebarSettingsId,
                this.iconManager.getIcon("settings"),
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
         *  Create the HTML for the sidebar panel content. Each marker has an entry with a header, a button for locating the marker on the map and a description.
         */
        populateSidebarMarkers() {
            var entries = "";

            var index = 0;
            this.layerManager.getLayer("marker").getLayers().forEach((element: any) => {
                entries += '<div class="markerEntryBox">' +
                    '<div class="markerHeaderDiv">' +
                    this.sidebarMarkerHeaderButton(index, "marker-small") +
                    this.sidebarMarkerHeader(element.feature.properties.name, index) +
                    this.sidebarMarkerIdHeader(element._leaflet_id) +
                    '</div>' +
                    '<div class="markerHeaderDiv">' +
                    this.sidebarMarkerBody(element.feature.properties.desc, index) +
                    '</div>' +
                    '</div>';
                index++;
            });

            entries = '<div class="panelContent">' + entries + '</div>';

            this.updatePane(entries);
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
         * @param {*} content HTML content to use for updating.
         */
        updatePane(entries: string) {

            var content = '';
            content += '<h1 class="leaflet-sidebar-header">' + this.sidebarMarkerTitle;
            content += '<span class="leaflet-sidebar-close"><i class="fa fa-caret-' + this.sidebar.options.position + '"></i></span>';
            content += '</h1>';

            var pane = this.getPane(this.sidebarMarkerId);
            pane.innerHTML = content + '<p class="panel">' + entries + '  </p>';

            this.addListeners();
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
        sidebarMarkerHeader(name: string, index: number) {
            return '<textarea id="markerName' + index + '" class="markerEntryHeader" contenteditable>' +
                name +
                '</textarea>';
        }

        /**
         * Creates  a HTML button with a listener to pan towards the marker's location on the map.
         * @param {*} index Index of the marker in markerLayer.
         * @returns A HTML string.
         */
        sidebarMarkerHeaderButton(index: number, icon: string) {

            return '<button id="markerButton' + index + '" class ="btn">' +
                this.iconManager.getIcon(icon) +
                '</button>';
        }

        /**
         * Creates a HTML textarea for the marker's description.
         * @param {*} text Description of the marker as string.
         * @param {*} index Index of the marker in markerLayer.
         * @returns A HTML string.
         */
        sidebarMarkerBody(text: string, index: number) {
            return '<textarea id="marker' + index + '" class="markerEntryBody" contenteditable>' +
                text +
                '</textarea>';
        }

        /**
         * Setup listeners for the marker entries in the sidebar. 
         * 
         * Each entry consists of a location button, a name field and a body. The name and body fields have listeners to update the corresponding marker.
         */
        addListeners() {
            let index = 0;
            this.layerManager.getLayer("marker").getLayers().forEach((element: any) => {
                let number = index; // Use a temp variable, otherwise it would use the final value of index...
                document.getElementById("markerName" + index)?.addEventListener("change", (e) => this.mapUtilities.setMarkerName(number));
                document.getElementById("markerButton" + index)?.addEventListener("click", (e) => {
                    this.mapUtilities.panToMarker(number);
                    this.mapUtilities.highlightMarker(number);
                    this.highlightSidebarMarker(number);
                });
                document.getElementById("marker" + index)?.addEventListener("change", (e) => this.mapUtilities.setMarkerDesc(number));

                index++;
            });
        }

        highlightSidebarMarker(index: number) {

            var marker = document.getElementById("markerButton" + index);

            if (marker) {

                if (this.highlight) {
                    this.highlight.innerHTML = this.iconManager.getIcon("marker-small");
                }

                marker.innerHTML = this.iconManager.getIcon("marker-highlight-small");

                this.highlight = marker;
            }



        }

    }

}