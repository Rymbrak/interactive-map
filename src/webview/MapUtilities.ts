export module MapUtilities {

    /**
     * Class containing functions for the map and features.
     */
    export class FeatureUtilities {

        map: L.Map;
        saveManager: ISaveManager;
        layerManager: ILayerManager;
        iconManager: IIconManager;

        private highlight: any;

        constructor(map: L.Map, layerManager: ILayerManager, iconManager: IIconManager, saveManager: ISaveManager) {

            this.map = map;
            this.saveManager = saveManager;
            this.iconManager = iconManager;
            this.layerManager = layerManager;
        }

        /**
         * Changes the name for the feature at the given index.
         * @param {*} index Index of the edited marker in the markerLayer.
         */
        setFeatureName(layer: string, index: number) {
            let text = (<HTMLInputElement>document.getElementById(layer + "Name" + index))?.value;
            let feature: any = this.layerManager.getLayer(layer).getLayers()[index];

            feature.feature.properties.name = text;

            this.setFeatureDesc(layer, index);
        }

        /**
         * Changes the description and name for the feature at the given index.
         * @param {*} index Index of the marker in the markerLayer.
         */
        setFeatureDesc(layer: string, index: number) {
            let text = (<HTMLInputElement>document.getElementById(layer + index))?.value;
            let feature: any = this.layerManager.getLayer(layer).getLayers()[index];

            feature.feature.properties.desc = text;
            feature.getPopup().setContent("<h1>" + feature.feature.properties.name + "</h1>" + "<hr  class=separator>" + text);

            /**
             * Since we modified a layer, the map has to be saved.
             */
            this.saveManager.saveMap();
        }

        /**
         * Pan to the feature with the given index.
         * @param {*} index Index of the marker in the markerLayer.
         */
        panToFeature(layer: string, index: number) {

            var feature: any = this.layerManager.getLayer(layer).getLayers()[index];

            /**
             * The retrieved feature could be any feature type, not all support getLatLng, such as those descending from polyline.
             * We can use getCenter instead for those.
             */
            if (feature.getLatLng) {
                this.map.panTo(feature.getLatLng());
            } else if (feature.getCenter) {
                this.map.panTo(feature.getCenter());
            }
        }

        /**
         * Replaces the icon of the marker with the given id, so it is easier to locate.
         * Only one marker is kept highlighted at a time, the previous one is reset to its icon.
         * @param index Index of the marker in the marker layer.
         */
        highlightFeature(layer: string, index: number) {
            /**
             * Current feature which we will highlight.
             */
            var feature: any = this.layerManager.getLayer(layer).getLayers()[index];


            /**
             * Reset previous highlight
             * Currently only markers use icons.
             */
            if (this.highlight?.setIcon) {

                this.highlight?.setIcon(this.iconManager.getDivIcon("marker"));

            } else {

                this.highlight?.setStyle({ color: "rgb(99, 161, 255)" });
            }

            /**
             * Set new highlight
             * Not every feature is icon based.
             */
            if (feature.setIcon) {

                this.highlight = feature;
                this.highlight.setIcon(this.iconManager.getDivIcon("marker-highlight"));
                
            } else {

                feature.setStyle({ color: "gold" });
                this.highlight = feature;
            }
        }

        setBounds(bounds: [number, number][]) {
            this.map.fitBounds(bounds);
        }
    }
}