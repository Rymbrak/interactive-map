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
         * Changes the name for the marker at the given index.
         * @param {*} index Index of the edited marker in the markerLayer.
         */
        setMarkerName(index: number) {
            let text = (<HTMLInputElement>document.getElementById("markerName" + index))?.value;
            let marker: any = this.layerManager.getLayer("marker").getLayers()[index];

            marker.feature.properties.name = text;

            this.setMarkerDesc(index);
        }

        /**
         * Changes the description and name for the marker at the given index.
         * @param {*} index Index of the marker in the markerLayer.
         */
        setMarkerDesc(index: number) {
            let text = (<HTMLInputElement>document.getElementById("marker" + index))?.value;
            let marker: any = this.layerManager.getLayer("marker").getLayers()[index];

            marker.feature.properties.desc = text;
            marker.getPopup().setContent("<h1>" + marker.feature.properties.name + "</h1>" + "<hr  class=separator>" + text);

            /**
             * Since we modified a layer, the map has to be saved.
             */
            this.saveManager.saveMap();
        }

        /**
         * Pan to the marker with the given index.
         * @param {*} index Index of the marker in the markerLayer.
         */
        panToMarker(index: number) {

            var marker: any = this.layerManager.getLayer("marker").getLayers()[index];
            this.map.panTo(marker.getLatLng());
        }

        /**
         * Replaces the icon of the marker with the given id, so it is easier to locate.
         * Only one marker is kept highlighted at a time, the previous one is reset to its icon.
         * @param index Index of the marker in the marker layer.
         */
        highlightMarker(index: number){
            var marker: any = this.layerManager.getLayer("marker").getLayers()[index];
            this.highlight?.setIcon(this.iconManager.getDivIcon("marker"));
            this.highlight = marker;
            this.highlight.setIcon(this.iconManager.getDivIcon("marker-highlight"));
        }

        setBounds (bounds:  [number, number][]){
            this.map.fitBounds(bounds);
        }
    }
}