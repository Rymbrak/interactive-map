import { Utilities } from "./Utilities";

export module Save {

    export class SaveManager implements ISaveManager {

        vscode: any;
        layerManager: ILayerManager;
        versionManager;
        filePath: string = "";
        mBounds: [number, number][] = [];

        constructor(vscode: any, layerManager: ILayerManager, versionManager: IVersionManager) {

            this.vscode = vscode;
            this.layerManager = layerManager;
            this.versionManager = versionManager;
        }

        /**
         * Saves the active map by converting all feature layers to GeoJSON and sending them to the extension.
         * The background image is stored in the workspace's interactive-map folder, with a path for it in the save file.
         */
        saveMap() {

            const polylines = this.wrapLayer("polyline");
            const polygons = this.wrapLayer("polygon");
            const rectangles = this.wrapLayer("rectangle");
            const circles = this.wrapLayer("circle");
            const markers = this.wrapLayer("marker");
            const circleMarkers = this.wrapLayer("circlemarker");
            const result =
            {
                type: 'Interactive-Map',
                version: this.versionManager.version,
                mapPath: this.filePath,
                bounds: [Utilities.xy(this.mBounds[0]),
                Utilities.xy(this.mBounds[1])],
                layers: [
                    polylines,
                    polygons,
                    rectangles,
                    circles,
                    markers,
                    circleMarkers
                ]
            };
            /**
             * Post the json back to the extension for saving.
             */
            this.vscode.postMessage({
                command: 'save',
                text: result
            });
        }

        setBounds(bounds: [number, number][]) {
            this.mBounds = bounds;
        }

        /**
         * Wraps the GeoJSON of a layer for storage in the save json.  
         * @param layerName Name of the layer.
         * @returns The layer wrapped with an extra property for its name.
         */
        wrapLayer(layerName: string) {
            /**
             * We use an  identifier in the save json, which has to be re-added when saving.
             */
            return { name: layerName, content: this.layerManager.getLayer(layerName).toGeoJSON() };
        }
    }
}