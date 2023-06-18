import * as L from 'leaflet';

export module Toolbar {
    /**
     * Class containing code for the toolbar. Adds additional handling to the creation, edit and delete events.
     */
    export class ToolbarManager implements IToolbar {

        drawControl: L.Control.Draw;
        layerManager: ILayerManager;
        saveManger: ISaveManager;
        sidebarManager: ISidebar;
        iconManager: IIconManager;

        map: L.Map;

        constructor(map: L.Map, layerManager: ILayerManager, iconManager: IIconManager, saveManager: ISaveManager, sidebarManager: ISidebar) {

            this.map = map;
            this.layerManager = layerManager;
            this.iconManager = iconManager;
            this.saveManger = saveManager;
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
            let circleMarkerLayer = this.layerManager.getLayer("circleMarker");
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
                    this.sidebarManager.populateSidebarMarkers();
                }

                if (event.layerType === "rectangle") {
                    rectangleLayer.addLayer(layer);
                }

                if (event.layerType === "circle") {
                    feature.radius = layer._mRadius;
                    circleLayer.addLayer(layer);
                }

                if (event.layerType === "circlemarker") {
                    circleMarkerLayer.addLayer(layer);
                }

                if (event.layerType === "polyline") {
                    polylineLayer.addLayer(layer);
                }

                if (event.layerType === "polygon") {

                    polygonLayer.addLayer(layer);
                }

                this.saveManger.saveMap();
            });

            this.map.on(L.Draw.Event.EDITED, (event) => {
                this.saveManger.saveMap();
            });

            this.map.on(L.Draw.Event.DELETED, (event: any) => {

                event.layers.eachLayer((layer: any) => {
                    if (layer.feature.layerType === "marker") {
                        markerLayer.removeLayer(layer);
                        // Since a marker was removed, we need to regenerate the sidebar content
                        this.sidebarManager.populateSidebarMarkers();
                    }
                    if (layer.feature.layerType === "rectangle") {
                        rectangleLayer.removeLayer(layer);
                    }
                    if (layer.feature.layerType === "circle") {
                        circleLayer.removeLayer(layer);
                    }
                    if (layer.feature.layerType === "circlemarker") {
                        circleMarkerLayer.removeLayer(layer);
                    }
                    if (layer.feature.layerType === "polyline") {
                        polylineLayer.removeLayer(layer);
                    }
                    if (layer.feature.layerType === "polygon") {
                        polygonLayer.removeLayer(layer);
                    }
                });

                this.saveManger.saveMap();
            });
        }
    }

}