export module Load {

    /**
     * Provides functionality to load layers from a file and add them to the map.
     */
    export class LoadManager implements ILoadManager {

        map: L.Map;
        layerManager: ILayerManager;
        featureFactory: IFeatureFactory;

        constructor(map: L.Map, layerManager: ILayerManager, featureFactory: IFeatureFactory) {

            this.map = map;
            this.layerManager = layerManager;
            this.featureFactory = featureFactory;
        }

        /**
         * Load layers from the provided json array. The JSON contains entries for each feature. Relevant entries are made for the respective layers in the sidebar.
         * @param {*} json JSON object loaded from a map file.
         */
        loadLayers(json: layer[]) {

            json.forEach(element => {
                if (element.name === "marker") {
                    this.loadMarkers(element);
                }

                if (element.name === "circleMarker") {
                    this.loadCircleMarkers(element);
                }

                if (element.name === "rectangle") {
                    this.loadRectangles(element);
                }

                if (element.name === "circle") {
                    this.loadCircles(element);
                }

                if (element.name === "polygon") {
                    this.loadPolygons(element);
                }

                if (element.name === "polyline") {
                    this.loadPolylines(element);
                }
            });
        }

        loadMarkers(json: layer) {

            json.content.features.forEach(element => {
                this.featureFactory.createMarker(element);
            });
            this.layerManager.getLayer("marker").addTo(this.map);
        }

        loadCircleMarkers(json: layer) {

            json.content.features.forEach(element => {
                this.featureFactory.createCircleMarker(element);
            });
            this.layerManager.getLayer("circleMarker").addTo(this.map);
        }

        loadRectangles(json: layer) {

            json.content.features.forEach(element => {
                this.featureFactory.createRectangle(element);
            });
            this.layerManager.getLayer("rectangle").addTo(this.map);
        }

        loadCircles(json: layer) {

            json.content.features.forEach(element => {
                this.featureFactory.createCircle(element);
            });
            this.layerManager.getLayer("circle").addTo(this.map);
        }

        loadPolygons(json: layer) {

            json.content.features.forEach(element => {
                this.featureFactory.createPolygon(element);
            });
            this.layerManager.getLayer("polygon").addTo(this.map);
        }

        loadPolylines(json: layer) {

            json.content.features.forEach(element => {
                this.featureFactory.createPolyline(element);
            });
            this.layerManager.getLayer("polyline").addTo(this.map);
        }
    }
}