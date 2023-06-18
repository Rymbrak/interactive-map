import { FeatureFactories } from "./FeatureFactories";
import { Icons } from "./Icons";
import { Layers } from "./Layers";
import { Sidebar } from "./Sidebar";
import { Save } from "./Save";
import { Toolbar } from "./Toolbar";
import * as L from 'leaflet';
import "leaflet-draw";
import { MapUtilities } from "./MapUtilities";
import { Load } from "./Load";
import { Utilities } from "./Utilities";

export module InteractiveMap {

    /**
     * 
     * @param code 
     * @param image 
     * @returns 
     */
    export function main(code: any, image: string) {

        let map: InteractiveMap = new InteractiveMap(code, image);

        return map;
    }

    /**
     * Main class of the webview. Creates the map and relevant UI.
     */
    export class InteractiveMap {

        vscode: any;

        featureFactory: IFeatureFactory;
        iconManager: IIconManager;
        layerManager: ILayerManager;
        sidebarManager: ISidebar;
        saveManager: ISaveManager;
        mapUtilities: IFeatureUtilities;
        toolbarManager: IToolbar;
        loadManager: ILoadManager;

        map: L.Map;

        filePath: string = "";

        public constructor(code: any, image: string) {

            this.vscode = code;

            this.map = L.map('map', {
                crs: L.CRS.Simple,
                minZoom: -5,
            });

            /**
             * Create all the necessary objects to provide functionality.
             */
            this.iconManager = new Icons.IconManager();
            this.layerManager = new Layers.LayerManager(this.map);
            this.featureFactory = new FeatureFactories.FeatureFactory(this.layerManager, this.iconManager);
            this.saveManager = new Save.SaveManager(this.vscode, this.layerManager);
            this.init(image);

            this.mapUtilities = new MapUtilities.FeatureUtilities(this.map, this.layerManager, this.iconManager, this.saveManager);
            this.sidebarManager = new Sidebar.SidebarManager(this.vscode, this.map, this.iconManager, this.layerManager, this.saveManager, this.mapUtilities);
            this.toolbarManager = new Toolbar.ToolbarManager(this.map, this.layerManager, this.iconManager, this.saveManager, this.sidebarManager);
            this.loadManager = new Load.LoadManager(this.map, this.layerManager, this.featureFactory);
        }

        private init(image: string) {

            /**
             * Setup the map and add coordinates ui.
             */
            this.setMap(image, [[0, 0], [1024, 1024]]);
            this.drawCoordinates();
        }

        /**
        * Sets the background image and bounds of the current map.
        * @param {*} image Used as background.
        * @param {*} bounds Size of the map. To prevent distortions, use the images width and height, or scaled multiples.
        */
        setMap(image: string, bounds: [number, number][]) {

            bounds[0] = Utilities.xy(bounds[0]);
            bounds[1] = Utilities.xy(bounds[1]);

            this.saveManager.setBounds(bounds);
            /**
             * The previous overlay is cleared when we load a new map.
             */
            L.imageOverlay(image, bounds).addTo(this.map);
            this.map.fitBounds(bounds);
        }

        /**
         * Creates a coordinate label in the bottom left area that tracks the mouse position on the map.
         */
        drawCoordinates() {

            L.control.coordinates({
                position: "bottomleft", //optional default "bottomright"
                decimals: 0, //optional default 4
                decimalSeperator: ".", //optional default "."
                labelTemplateLat: "Y: {y}", //optional default "Lat: {y}"
                labelTemplateLng: "X: {x}", //optional default "Lng: {x}"
                enableUserInput: false, //optional default true
                useDMS: false, //optional default false
                useLatLngOrder: false, //ordering of labels, default false-> lng-lat
                markerType: L.marker, //optional default L.marker
                markerProps: {}, //optional default {},
            }).addTo(this.map);
        }

        /**
         * Loads the given layers into the map and generates sidebar content based on them.
         * @param layers Layers to load. Each entry is a layer containing features of the same type.
         */
        public load(layers: layer[]) {
            this.loadManager.loadLayers(layers);
            this.sidebarManager.populateSidebarMarkers();
        }

        /**
        * Clear map data, removing layers of previous the map and prepare it for further use.
        * 
        * Adds the drawnItems layer to the map.
        */
        clear() {

            /**
             * Get each layer and remove all their content.
             */
            this.layerManager.getLayer("polyline").clearLayers();
            this.layerManager.getLayer("polygon").clearLayers();
            this.layerManager.getLayer("rectangle").clearLayers();
            this.layerManager.getLayer("circle").clearLayers();
            this.layerManager.getLayer("marker").clearLayers();
            this.layerManager.getLayer("circleMarker").clearLayers();
            this.layerManager.getDrawnItems().clearLayers();

            /**
             * Remove all layers from the map.
             */
            this.map.eachLayer((layer) => {
                layer.remove();
            });

            /**
             * Re-add the drawnItems layer, since we require it for adding, editing and removing features.
             */
            this.layerManager.getDrawnItems().addTo(this.map);
        }
    }
}