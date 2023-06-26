import * as L from 'leaflet';

export module Layers {

    /**
     * Class for managing the feature layers on the map.
     */
    export class LayerManager {

        private map: L.Map;

        /**
         * Each type of feature is stored on its own layer can can be hidden separately.
         * Further, these layers are used in the sidebar to edit their properties.
         */
        private layerMap = new Map();

        public editableLayerTypes = ["marker", "rectangle", "circle", "circlemarker", "polyline", "polygon"];

        /**
         * We store the state of layers, which is used to restore their state when the 'Show Features' layer is activated.
         * True to show a layer, false to hide.
         * For example, all layers that were active before the 'Show Features' layer was deactivated will be restored as well as any currently active layers, when it is reactivated.
         */
        public activeLayers: { layer: L.FeatureGroup, visible: boolean }[] = [];

        /**
         * We use one layer that contains all features for editing through the Draw.Control toolbar.
         * When new features are added or removed, we also note them here.
         */
        private drawnItems = L.featureGroup();

        constructor(map: L.Map) {
            this.map = map;
            this.init();
        }

        /**
         * Initialize base values for the layers and listeners.
         * 
         * Creates a layer visibility widget where layers can be turned on and off.
         */
        init() {

            /**
             * Create base layers.
             */
            let polylineLayer = new L.FeatureGroup();
            let polygonLayer = new L.FeatureGroup();
            let rectangleLayer = new L.FeatureGroup();
            let circleLayer = new L.FeatureGroup();
            let markerLayer = new L.FeatureGroup();
            let circleMarkerLayer = new L.FeatureGroup();

            /**
             * We track the active layers for the layer visibility.
             * When the 'Show Features' is activated, we activate layers based on their previous state, which we store in  'activeLayers'.
             */
            this.activeLayers =
                [
                    { layer: polylineLayer, visible: true },
                    { layer: polygonLayer, visible: true },
                    { layer: rectangleLayer, visible: true },
                    { layer: circleLayer, visible: true },
                    { layer: markerLayer, visible: true },
                    { layer: circleMarkerLayer, visible: true }
                ];

            /**
             * Each layer is assigned a name that we can later use to access it.
             */
            this.layerMap.set("polyline", polylineLayer);
            this.layerMap.set("polygon", polygonLayer);
            this.layerMap.set("rectangle", rectangleLayer);
            this.layerMap.set("circle", circleLayer);
            this.layerMap.set("marker", markerLayer);
            this.layerMap.set("circlemarker", circleMarkerLayer);

            this.setupLayerEvents();
            this.layerVisibility();
        }

        /**
         * Returns the layer with the given name.
         * @param name Name of the layer
         * @returns layer with the given name.
         */
        getLayer(name: string): L.FeatureGroup {

            return this.layerMap.get(name) ?? null;
        }

        /**
         * Returns the drawnItems layer.
         *
         *  This layer is used for editing features from the toolbar.
         * @returns The drawnItems layer.
         */
        getDrawnItems() { return this.drawnItems; }

        /**
         * Adds listeners to the 'layerremove' and 'layeradd' events, which are used to add and remove layers from the drawnItems layer.
         * The layer is used for editing features through the toolbar.
         */
        setupLayerEvents() {
            // Keep track of which layers are currently displayed through the layer selection. Otherwise drawnItems can contains nonexistent features that cause errors during editing.
            this.map.on('layerremove', (ev) => {
                this.removeDrawnItems(ev);
            });
            this.map.on('layeradd', (ev) => {
                this.addDrawnItems(ev);
            });
        }

        /**
         * Remove layers from the drawnItems layer to keep track of the actually displayed editable layers.
         *  If we do not remove them, then the edit mode will cause an error, as the drawnItems layer would contain layers that are not visible.
         * @param {*} ev 
         */
        removeDrawnItems(ev: any) {

            if (ev.layer.feature && this.editableLayerTypes.includes(ev.layer.feature.layerType)) {
                this.drawnItems.removeLayer(ev.layer);
            }
        }

        /**
         * Add editable layers to the drawnItems layer so we can edit them with the toolbar.
         * @param {*} ev 
         */
        addDrawnItems(ev: any) {

            if (ev.layer.feature && this.editableLayerTypes.includes(ev.layer.feature.layerType)) {
                this.drawnItems.addLayer(ev.layer);
            }
        }


        /**
         * Creates UI elements to hide/show feature layers.
         * Each layer has a corresponding checkbox to hide or show them.
         * Additionally, a checkbox to toggle all active layers off and restore their previous on activation is added.
         */
        layerVisibility() {

            // drawnItems = L.featureGroup().addTo(map);
            this.drawnItems = L.featureGroup();

            let control = L.control.layers({}, {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Features': this.drawnItems,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Polylines': this.getLayer("polyline"),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Polygons': this.getLayer("polygon"),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Rectangles': this.getLayer("rectangle"),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Circles': this.getLayer("circle"),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Markers': this.getLayer("marker"),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Show Circle Markers': this.getLayer("circlemarker")
            }, { position: 'topleft', collapsed: true }).addTo(this.map);

            this.map.on('overlayadd', (event) => {

                var layer = event.layer;

                /**
                 * We are reactivating the drawnItems layer ('Show Features' in the ui), therefore all previously active layers should be turned on too.
                 */
                if (layer === this.drawnItems) {

                    this.setActiveLayers(true);
                    this.setActiveLayerStatus(control);
                }
            });

            this.map.on('overlayremove', (event) => {
                var layer = event.layer;

                /**
                 * We removed the drawnItems layer, so all other layers should be turned off, and their state stored.
                 */
                if (layer === this.drawnItems) {

                    this.setActiveLayerStatus(control);
                    this.setActiveLayers(false);
                }
            });

        }

        /**
         * Set the visibility of all layers.
         * @param state Visibility to use for layers. True to show, false to hide the layers.
         */
        setActiveLayers(state: boolean) {

            if (state) {
                for (let i = 0; i < this.activeLayers.length; i++) {

                    if (this.activeLayers[i].visible) {

                        /**
                       * We need to set a timeout, otherwise the layer removal is no longer in sync. Adding and removal on the next cycle is sufficient for that.
                       */
                        setTimeout(() => {
                            this.activeLayers[i].layer.addTo(this.map);
                        }, 0);
                    }
                }
            } else {

                for (let i = 0; i < this.activeLayers.length; i++) {

                    if (this.activeLayers[i].visible) {

                        setTimeout(() => {
                            this.map.removeLayer(this.activeLayers[i].layer);
                        }, 0);
                    }
                }
            }
        }

        /**
         * Store the current state of all layers.
         * 
         * The state is used when the drawnItems layer is reactivated, restoring layers to their previous visibility state.
         * @param control 
         */
        setActiveLayerStatus(control: any) {

            /**
             * Index 0 is the show/hide all layer, we do not want its state.
             */
            for (let i = 1; i < control._layerControlInputs.length; i++) {

                let element = control._layerControlInputs[i];
                this.activeLayers[i - 1].visible = element.checked;
            }
        }
    }
}