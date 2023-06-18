export module Utilities {

    /**
     * Returns the coordinates in Leaflet's format, reversing x and y coordinates.
     * @param json 
     * @returns 
     */
    export function getCoords(json: [number, number] | [number, number][] | [number, number][][]): [number, number][] {

        let coords: [number, number][] = [];
        json.forEach(element => {

            let coord = element as [number, number];

            coords.push(xy(coord));
        });
        return coords;
    }

    /**
     * Swaps x and y for convenience.
     * @param {*} yx 
     * @returns 
     */
    export function xy(yx: [number, number]): [number, number] {

        return [yx[1], yx[0]];
    }

}