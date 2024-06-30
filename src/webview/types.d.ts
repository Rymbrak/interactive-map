interface mapFile {

    type: string;
    version: string;
    mapPath: string;
    bounds: [number, number][];
    layers: layer[];
}

interface layer {

    name: string;
    content: layerContent;
}

interface layerContent { 
    
    type: string;
    features: feature[];
}

interface feature {

    type: string;

    properties: {

        desc: string;
        name: string;
        image: any;
        color: string;
        src: string;
    };

    layerType: string;
    radius?: number;

    geometry: {

        type: string;
        coordinates: [number, number] | [number, number][] | [number, number][][];
    };

}
