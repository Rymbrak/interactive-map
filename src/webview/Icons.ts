import * as L from 'leaflet';

export module Icons {

    export class IconManager implements IIconManager {

        private iconMap = new Map();
        private divIconMap = new Map();
        private marker: string = "";
        private code: any;

        private iconSize: [number, number] = [25, 41];

        constructor(code: any) {

            this.code = code;

            /**
             * We set some basic icon html elements for use in the ui. Note, these are references to the bootstrap font, because we can't style svgs loaded from the css easily..
             * We can set the font color through the id.
             * Smaller versions of the icons are provided to make the currently highlighted element stand out more, as it will default to a larger size icon.
             * Feature versions might provide a general way to set colors of the UI.
             */
            this.setIcon("polyline", '<div class="sidebar-icon"> <i class="bi-share-fill"> </i> </div>');
            this.setIcon("polyline-small", '<div class="sidebar-icon"> <i  id="sidebar-icon" class="bi-share-fill"> </i> </div>');

            this.setIcon("polygon", '<div class="sidebar-icon"> <i class="bi-pentagon-fill"> </i> </div>');
            this.setIcon("polygon-small", '<div class="sidebar-icon"> <i  id="sidebar-icon" class="bi-pentagon-fill"> </i> </div>');

            this.setIcon("rectangle", '<div class="sidebar-icon"> <i class="bi-square-fill"> </i> </div>');
            this.setIcon("rectangle-small", '<div class="sidebar-icon"> <i  id="sidebar-icon" class="bi-square-fill"> </i> </div>');

            this.setIcon("circle", '<div class="sidebar-icon"> <i class="bi-circle-fill"> </i> </div>');
            this.setIcon("circle-small", '<div class="sidebar-icon"> <i  id="sidebar-icon" class="bi-circle-fill"> </i> </div>');

            this.setIcon("circlemarker", '<div class="sidebar-icon"> <i class="bi-circle"> </i> </div>');
            this.setIcon("circlemarker-small", '<div class="sidebar-icon"> <i id="sidebar-icon"  class="bi-circle"> </i> </div>');

            this.setIcon("marker", '<div class="sidebar-icon"> <i class="bi-geo-alt-fill"> </i> </div>');
            this.setIcon("marker-highlight", '<div class="highlight"> <i class="bi-geo-alt-fill"> </i> </div>');

            this.setIcon("marker-small", '<div class="sidebar-icon"> <i id="sidebar-icon" class="bi-geo-alt-fill"></i> </div>');
            this.setIcon("marker-highlight-small", '<div class="highlight"> <i id="sidebar-icon" class="bi-geo-alt-fill"> </i> </div>');

            this.setIcon("settings", '<div class="sidebar-icon"><i id="sidebar-icon" class="bi-gear-fill"></i> </div>');

            this.setIcon("help", '<div class="sidebar-icon"><i id="sidebar-icon" class="bi-question-circle-fill"></i> </div>');
            this.setIcon("help", '<div class="sidebar-icon"><i id="sidebar-icon" class="bi-question-circle-fill"></i> </div>');

            this.setIcon("arrow-left", '<div class="sidebar-icon"> <i class="bi-arrow-left"> </i> </div>');
            this.setIcon("suit-heart-fill", '<div class="sidebar-icon"> <i class="bi-suit-heart-fill"> </i> </div>');
            this.setIcon("folder-fill", '<div class="sidebar-icon"> <i class="bi-folder-fill"> </i> </div>');
            this.setIcon("file-image-fill", '<div class="sidebar-icon"> <i class="bi-file-image-fill"> </i> </div>');

            this.setDivIcon("marker", L.divIcon({
                className: 'marker',
                html: this.iconMap.get("marker"),
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            }));

            this.setDivIcon("marker-highlight", L.divIcon({
                className: 'marker-highlight',
                html: this.iconMap.get("marker-highlight"),
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            }));

            this.setDivIcon("svg", L.divIcon({
                className: 'svgIcon',
                html: '<div class="svgIcon"></div>',
                iconSize: [45, 45],
                iconAnchor: [15, 42]
            }));

        }

        styleHighlight(icon: string) {

            return icon.replace('<div class="sidebar-icon">', '<div class="highlight">');
        }

        /**
         * Returns the html string for an icon with the given name.
         * @param name Name of the icon.
         * @returns A html string containing the icon.
         */
        public getIcon(name: string, style: string): string {

            switch (style) {

                case "":
                    return this.iconMap.get(name);

                case "highlight":
                    return this.styleHighlight(this.iconMap.get(name));

                default:
                    return this.iconMap.get(name);
            }
        };

        /**
         * Returns the DivIcon with the given name.
         * @param name Name of the DivIcon.
         * @returns A DivIcon.
         */
        public getDivIcon(name: string): L.DivIcon {

            return this.divIconMap.get(name);
        };

        /**
         * Store a DivIcon under the given name.
         * @param name Name of the DivIcon.
         * @param divIcon DivIcon to be stored under the given name.
         */
        setDivIcon(name: string, divIcon: L.DivIcon) {

            this.divIconMap.set(name, divIcon);
        }

        /**
         * Store a html string for an icon under the given name.
         * @param name Name for the icon.
         * @param value html string used for the icon.
         */
        public setIcon(name: string, value: string) {

            this.iconMap.set(name, value);
        }

        public makeImage(path: string, color: string = "black"): string {

            let result = '<div style="mask-image:url(' + path + ');  background-color: ' + color + ';" class="svgIcon"></div>';
            return result;
        }

        public makeIcon(path: string) {
            return L.icon({
                iconUrl: path,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });
        }
    }

}