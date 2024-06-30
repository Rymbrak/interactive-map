import * as L from 'leaflet';

export module Toolbar {
    /**
     * Class containing code for the toolbar. Adds additional handling to the creation, edit and delete events.
     */
    export class ToolbarManager implements IToolbar {

        drawControl: L.Control.Draw;
        layerManager: ILayerManager;
        saveManager: ISaveManager;
        sidebarManager: ISidebar;
        iconManager: IIconManager;

        map: L.Map;

        constructor(map: L.Map, layerManager: ILayerManager, iconManager: IIconManager, saveManager: ISaveManager, sidebarManager: ISidebar) {

            this.map = map;
            this.layerManager = layerManager;
            this.iconManager = iconManager;
            this.saveManager = saveManager;
            this.sidebarManager = sidebarManager;

            this.drawControl = this.drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: this.layerManager.getDrawnItems(),
                },
                draw: {
                    polygon: {
                        allowIntersection: false,
                        showArea: true
                    },
                    marker: {
                        icon: this.iconManager.getDivIcon("marker")
                    }
                }
            });

            this.map.addControl(this.drawControl);
            this.drawToolbar();
        }

        /**
         * Creates a toolbar containing tools for creation and manipulation of features.
         */
        drawToolbar() {

            /**
             * Get the base layers from the layer manager.
             * We will put the feature into the corresponding layer.
             */
            let markerLayer = this.layerManager.getLayer("marker");
            let rectangleLayer = this.layerManager.getLayer("rectangle");
            let circleLayer = this.layerManager.getLayer("circle");
            let circleMarkerLayer = this.layerManager.getLayer("circlemarker");
            let polylineLayer = this.layerManager.getLayer("polyline");
            let polygonLayer = this.layerManager.getLayer("polygon");

            // Called when the user finishes drawing a feature only. Editing needs a separate event
            this.map.on(L.Draw.Event.CREATED, (event: any) => {

                var layer = event.layer;
                let feature = layer.feature = layer.feature || {};
                feature.type = feature.type || "Feature";
                var props = feature.properties = feature.properties || {};
                props.desc = "";
                props.name = "";
                props.image = null;

                // Add each layer to its respective grouping layer.
                // The layeradd from the map handles adding the new layers to the drawnItems layer.
                // layerType is used to discern what type of feature a layer is.

                feature.layerType = event.layerType;

                if (event.layerType === "marker") {
                    layer.bindPopup(props.desc);
                    markerLayer.addLayer(layer);
                    layer.setIcon(this.iconManager.getDivIcon("marker"));
                    this.sidebarManager.populateSidebarFeatures();
                }

                if (event.layerType === "rectangle") {
                    layer.bindPopup(props.desc);
                    rectangleLayer.addLayer(layer);
                    this.sidebarManager.populateSidebarFeatures();
                }

                if (event.layerType === "circle") {
                    layer.bindPopup(props.desc);
                    feature.radius = layer._mRadius;
                    circleLayer.addLayer(layer);
                    this.sidebarManager.populateSidebarFeatures();
                }

                if (event.layerType === "circlemarker") {
                    layer.bindPopup(props.desc);
                    circleMarkerLayer.addLayer(layer);
                    this.sidebarManager.populateSidebarFeatures();
                }

                if (event.layerType === "polyline") {
                    layer.bindPopup(props.desc);
                    polylineLayer.addLayer(layer);
                    this.sidebarManager.populateSidebarFeatures();
                }

                if (event.layerType === "polygon") {
                    layer.bindPopup(props.desc);
                    polygonLayer.addLayer(layer);
                    this.sidebarManager.populateSidebarFeatures();
                }

                this.saveManager.saveMap();
            });

            this.map.on(L.Draw.Event.EDITED, (event: any) => {

                /**
                 * The radius of a circle is a separate property that isn't saved when we turn the layer in to GeoJson, so we need to update the radius in the feature section.
                 */
                event.layers.eachLayer((element: any) => {
                    if (element._mRadius) {
                        element.feature.radius = element._mRadius;
                    }
                });

                this.saveManager.saveMap();
            });

            this.map.on(L.Draw.Event.DELETED, (event: any) => {

                event.layers.eachLayer((layer: any) => {
                    if (layer.feature.layerType === "marker") {
                        markerLayer.removeLayer(layer);
                        // Since a marker was removed, we need to regenerate the sidebar content
                        this.sidebarManager.populateSidebarFeatures();
                    }
                    if (layer.feature.layerType === "rectangle") {
                        rectangleLayer.removeLayer(layer);
                        this.sidebarManager.populateSidebarFeatures();
                    }
                    if (layer.feature.layerType === "circle") {
                        circleLayer.removeLayer(layer);
                        this.sidebarManager.populateSidebarFeatures();
                    }
                    if (layer.feature.layerType === "circlemarker") {
                        circleMarkerLayer.removeLayer(layer);
                        this.sidebarManager.populateSidebarFeatures();
                    }
                    if (layer.feature.layerType === "polyline") {
                        polylineLayer.removeLayer(layer);
                        this.sidebarManager.populateSidebarFeatures();
                    }
                    if (layer.feature.layerType === "polygon") {
                        polygonLayer.removeLayer(layer);
                        this.sidebarManager.populateSidebarFeatures();
                    }
                });

                this.saveManager.saveMap();
            });
        }
    }

}