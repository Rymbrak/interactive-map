import * as L from 'leaflet';
import { Utilities } from "./Utilities";

export module FeatureFactories {

    export class FeatureFactory {

        drawnItems: L.FeatureGroup;

        layerManager: ILayerManager;
        iconManager: IIconManager;
        vscode: { postMessage: any; };

        constructor(vscode: { postMessage: any; }, layerManager: ILayerManager, iconManager: IIconManager) {

            this.vscode = vscode;
            this.layerManager = layerManager;
            this.iconManager = iconManager;
            this.drawnItems = this.layerManager.getDrawnItems();
        }

        /**
         * Create a marker from json and add it to the map via the drawnItems layer. Each marker is also added to the markerLayer.
         * @param {*} json 
         */
        createMarker(json: feature) {

            let coord = json.geometry.coordinates as [number, number];

            // l.marker expects coordinates in y,x instead of x,y which is provided by the json.
            var marker = L.marker([coord[1], coord[0]]);

            if (json.properties.src && json.properties.src !== "") {

                marker.setIcon(this.iconManager.getDivIcon("svg"));
                return this.createFeatureWithPopup(marker, "marker", json, true);
            } else {

                marker.setIcon(this.iconManager.getDivIcon("marker"));
                return this.createFeatureWithPopup(marker, "marker", json, false);
            }
        }

        createRectangle(json: feature) {

            let coord = json.geometry.coordinates as [number, number][][];
            var rectangle = L.rectangle([Utilities.xy(coord[0][0]), Utilities.xy(coord[0][1]), Utilities.xy(coord[0][2]), Utilities.xy(coord[0][3])]);
            return this.createFeatureWithPopup(rectangle, "rectangle", json);
        }

        createCircleMarker(json: feature) {

            let coord = json.geometry.coordinates as [number, number];

            var circleMarker = L.circleMarker([coord[1], coord[0]]);
            return this.createFeatureWithPopup(circleMarker, "circlemarker", json);
        }

        createPolygon(json: feature) {

            /**
             * The GeoJSON for polygons contains an extra outer array, which we have to unpack before getting to the actual coords.
             * We use any since otherwise the type check will think that we could just get a number, which should not happen unless the json has ben tempered with.
             */
            let polyCoords: any = json.geometry.coordinates[0];

            /**
            * Polygons consist of multiple coordinate entries.
            */
            let coords = Utilities.getCoords(polyCoords);

            let polygon = L.polygon(coords);

            return this.createFeatureWithPopup(polygon, "polygon", json);
        }

        createPolyline(json: feature) {

            /**
             * Polylines consist of multiple coordinate entries.
             */
            let coords = Utilities.getCoords(json.geometry.coordinates);
            let polyline = L.polyline(coords);
            return this.createFeatureWithPopup(polyline, "polyline", json);
        }

        createCircle(json: feature) {

            let coord = json.geometry.coordinates as [number, number];
            let circle = L.circle([coord[1], coord[0]], json.radius ?? 1);
            return this.createFeatureWithPopup(circle, "circle", json);
        }

        createFeatureWithPopup(element: any, layerName: string, json: feature, svg: boolean = false) {
            element.bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            element = this.createFeature(element, layerName, json, svg);

            let lManager = this.layerManager;
            let vscode = this.vscode;

            element.on('popupopen', function (popup: any) {

                /**
                 * Sent a parse request to the extension. It will send an answer processed by the html, which updates the marker's popup description. 
                 * The parsed note is not stored anywhere, we'll have to reparse every time we view the note.
                * For Dendron, this requires Dendron's express server to be running.
                */
                vscode.postMessage({
                    command: 'parseNote',
                    layer: layerName,
                    index: lManager.getLayer(layerName).getLayers().indexOf(element),
                    note: "<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc
                });

            });
            return element;
        }

        /**
         * Crate and add a feature to the map and layer manager.
         * @param element Feature to add to the given layer.
         * @param layerName Name of the layer to add this feature to.
         * @param json json of the feature.
         * @returns The feature.
         */
        createFeature(element: any, layerName: string, json: feature, svg: boolean = false) {

            let layer = this.layerManager.getLayer(layerName);
            element.feature = json;

            layer.addLayer(element);
            this.drawnItems.addLayer(element);

            if (svg) {
                /**
                 * The _icon property only exists after the element has been added to drawnItems.
                 */
                element._icon.style.backgroundColor = json.properties.color;
                element._icon.style.maskImage = "url(" + json.properties.src + ")";
                element._icon.style.maskSize = 'cover';

            }

            return element;
        }
    }
}