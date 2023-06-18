import * as L from 'leaflet';

export module Icons {

    export class IconManager implements IIconManager {

        private iconMap = new Map();
        private divIconMap = new Map();
        private marker: string = "";

        private iconSize: [number, number] = [25, 41];

        constructor() {

            /**
             * We set some basic icon html elements for use in the ui. Note, these are references to the bootstrap font, because we can't style svgs loaded from the css easily..
             * We can set the font color through the id.
             */
            this.setIcon("marker", '<div class="sidebar-icon"> <i class="bi-geo-alt-fill"> </i> </div>');
            this.setIcon("marker-highlight",'<div class="highlight"> <i  class="bi-geo-alt-fill"> </i> </div>');
            this.setIcon("settings", '<div class="sidebar-icon"><i id="sidebar-icon" class="bi-gear-fill"></i> </div>');
            this.setIcon("marker-small", '<div class="sidebar-icon"> <i id="sidebar-icon" class="bi-geo-alt-fill"></i> </div>');
            this.setIcon("marker-highlight-small",'<div class="highlight"> <i id="sidebar-icon" class="bi-geo-alt-fill"> </i> </div>');

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

        }

        /**
         * Returns the html string for an icon with the given name.
         * @param name Name of the icon.
         * @returns A html string containing the icon.
         */
        public getIcon(name: string): string {

            return this.iconMap.get(name);
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
        setDivIcon(name: string, divIcon: L.DivIcon){

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

    }

}