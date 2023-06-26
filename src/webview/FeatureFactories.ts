import * as L from 'leaflet';
import { Utilities } from "./Utilities";

export module FeatureFactories {

    export class FeatureFactory {

        drawnItems: L.FeatureGroup;

        layerManager: ILayerManager;
        iconManager: IIconManager;

        constructor(layerManager: ILayerManager, iconManager: IIconManager) {

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
            var marker = L.marker([coord[1], coord[0]]).bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            marker.setIcon(this.iconManager.getDivIcon("marker"));
            return this.createFeature(marker, "marker", json);
        }

        createRectangle(json: feature) {

            let coord = json.geometry.coordinates as [number, number][][];

            var rectangle = L.rectangle([Utilities.xy(coord[0][0]), Utilities.xy(coord[0][1]), Utilities.xy(coord[0][2]), Utilities.xy(coord[0][3])]);
            rectangle.bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            return this.createFeature(rectangle, "rectangle", json);
        }

        createCircleMarker(json: feature) {

            let coord = json.geometry.coordinates as [number, number];

            var circleMarker = L.circleMarker([coord[1], coord[0]]).bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            return this.createFeature(circleMarker, "circlemarker", json);
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
            polygon.bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            return this.createFeature(polygon, "polygon", json);
        }

        createPolyline(json: feature) {

            /**
             * Polylines consist of multiple coordinate entries.
             */
            let coords = Utilities.getCoords(json.geometry.coordinates);
            let polyline = L.polyline(coords);
            polyline.bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            return this.createFeature(polyline, "polyline", json);
        }

        createCircle(json: feature) {

            let coord = json.geometry.coordinates as [number, number];

            let circle = L.circle([coord[1], coord[0]], json.radius ?? 1);
            circle.bindPopup("<h1>" + json.properties.name + "</h1>" + "<hr  class=separator>" + json.properties.desc);
            return this.createFeature(circle, "circle", json);
        }

        /**
         * Crate and add a feature to the map and layer manager..
         * @param element Feature to add to the given layer.
         * @param layerName Name of the layer to add this feature to.
         * @param json json of the feature.
         * @returns The feature.
         */
        createFeature(element: any, layerName: string, json: feature) {

            let layer = this.layerManager.getLayer(layerName);
            element.feature = json;
            layer.addLayer(element);
            this.drawnItems.addLayer(element);
            return element;
        }

    }

}