export module MapUtilities {

    /**
     * Class containing functions for the map and features.
     */
    export class FeatureUtilities {

        map: L.Map;
        saveManager: ISaveManager;
        layerManager: ILayerManager;
        iconManager: IIconManager;
        vscode: { postMessage: any; };

        private highlight: any;
        private normalColor: string = "";
        public highlightColor: string = "gold";
        public baseColor: string = "rgb(99, 161, 255)";

        constructor(vscode: { postMessage: any; }, map: L.Map, layerManager: ILayerManager, iconManager: IIconManager, saveManager: ISaveManager) {

            this.map = map;
            this.saveManager = saveManager;
            this.iconManager = iconManager;
            this.layerManager = layerManager;
            this.vscode = vscode;
        }

        /**
         * Changes the name for the feature at the given index.
         * @param layer Name of the layer.
         * @param number Feature index in the layer.
         */
        setFeatureName(layer: string, index: number) {
            let text = (<HTMLInputElement>document.getElementById(layer + "Name" + index))?.value;
            let feature: any = this.layerManager.getLayer(layer).getLayers()[index];

            feature.feature.properties.name = text;

            this.setFeatureDesc(layer, index);
        }
        /**
         * Changes the description and name for the feature at the given index.
         * @param layer Name of the layer.
         * @param number Feature index in the layer.
         */
        setFeatureDesc(layer: string, index: number) {
            let text = (<HTMLInputElement>document.getElementById(layer + index))?.value;
            let feature: any = this.layerManager.getLayer(layer).getLayers()[index];

            /**
             * Sent a parse request to the extension. It will send an answer processed by the html, which updates the marker's popup description. 
             * The parsed note is not stored anywhere, we'll have to reparse every time we view the note.
             * For Dendron, this requires Dendron's express server to be running.
             */
            this.vscode.postMessage({
                command: 'parseNote',
                layer: layer,
                index: index,
                note: "<h1>" + feature.feature.properties.name + "</h1>" + "<hr  class=separator>" + text
            });

            feature.feature.properties.desc = text;
            // This should be set by the html script.
            // feature.getPopup().setContent("<h1>" + feature.feature.properties.name + "</h1>" + "<hr  class=separator>" + text);

            /**
             * Since we modified a layer, the map has to be saved.
             */
            this.saveManager.saveMap();
        }

        /**
         * Set a marker's  popup text. Text can contain html tags for styling.
         * @param layer Name of the layer.
         * @param number Feature index in the layer.
         * @param text Popup text in html format.
         */
        setMarkerPopup(layer: string, index: number, text: string) {
            let feature: any = this.layerManager.getLayer(layer).getLayers()[index];
            feature.getPopup().setContent(text);
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

            if (this.highlight) {

                if (this.highlight?.setIcon && this.highlight._icon) {
                    if (this.highlight._icon.className.includes("svgIcon")) {
                        //this.highlight?.setIcon(this.iconManager.getDivIcon("marker"));
                        this.highlight._icon.style.backgroundColor = this.normalColor;
                    } else {

                        this.highlight.setIcon(this.iconManager.getDivIcon("marker"));
                    }
                } else if (this.highlight.setStyle) {

                    this.highlight.setStyle({ color: this.baseColor });
                }
            }

            if (feature.setIcon && feature._icon) {
                this.normalColor = feature._icon.style.backgroundColor;
            }

            this.highlight = feature;
            /**
             * Set new highlight
             * Not every feature is icon based.
             */
            if (feature.setIcon) {
                /**
                 * Check whether we are handling the base icon or an svgIcon.
                 * The svg icons are handled by using the backgroundColor property to color them with a mask-image.
                 */
                if (feature._icon.className.includes("svgIcon")) {

                    feature._icon.style.backgroundColor = this.highlightColor;
                } else {

                    this.highlight.setIcon(this.iconManager.getDivIcon("marker-highlight"));
                }

            } else {

                this.highlight?.setStyle({ color: this.highlightColor });
            }
        }

        setBounds(bounds: [number, number][]) {
            this.map.fitBounds(bounds);
        }

        setFeatureIcon(layer: string, index: number, icon: L.Icon, src: string): void {
            var featureLayer: any = this.layerManager.getLayer(layer).getLayers()[index];
            
            if (src !== "") {
            featureLayer.setIcon(this.iconManager.getDivIcon("svg"));

                featureLayer._icon.src = "";
                featureLayer._icon.style.backgroundColor = this.baseColor;
                featureLayer._icon.style.maskImage = "url(" + src + ")";
                featureLayer._icon.style.maskSize = 'cover';
                featureLayer.feature.properties.color = this.baseColor;
                featureLayer.feature.properties.src = src;

                if (featureLayer === this.highlight) {
                    featureLayer._icon.style.backgroundColor = this.highlightColor;
                    this.normalColor = this.baseColor;
                }
            } else {
                /**
                 * No image was selected, reset the marker.
                 */
                featureLayer.setIcon(this.iconManager.getDivIcon("marker"));
                featureLayer._icon.src = "";
                featureLayer._icon.style.backgroundColor = "transparent";
                featureLayer._icon.style.maskImage = "";
                featureLayer.feature.properties.color = "transparent";
                featureLayer.feature.properties.src = "";

            }
        }
    }
}