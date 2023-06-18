import * as L from 'leaflet';

declare module 'leaflet' {

    export namespace control {

        function coordinates(options?: CoordinatesConstructorOptions): any;

        interface CoordinatesConstructorOptions {
            /**
             * The initial position of the control (one of the map corners).
             *
             * @default 'topleft'
             */
            position?: ControlPosition | undefined;
            decimals?: number;
            decimalSeperator?: string;
            labelTemplateLat?: string;
            labelTemplateLng?: string;
            enableUserInput?: boolean;
            useDMS?: boolean;
            useLatLngOrder: boolean;
            markerType: (latlng: LatLngExpression, options?: MarkerOptions | undefined) => Marker<any>;
            markerProps?: any;
            /**
             * The options used to configure the draw toolbar.
             *
             * @default {}
             */
            draw?: L.Control.DrawOptions | undefined;

            /**
             * The options used to configure the edit toolbar.
             *
             * @default false
             */
            edit?: L.Control.EditOptions | undefined;
        }
    }
}