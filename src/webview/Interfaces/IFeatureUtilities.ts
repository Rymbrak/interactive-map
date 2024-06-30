interface IFeatureUtilities {

    baseColor: string;
    highlightColor: string;
    
    setBounds(bounds: [number, number][]): void;
    /**
     * Changes the name for the feature at the given index.
     * @param layer Name of the layer.
     * @param number Feature index in the layer.
     */
    setFeatureName(layer: string, number: number): void;
    /**
     * Changes the description and name for the feature at the given index.
     * @param layer Name of the layer.
     * @param number Feature index in the layer.
     */
    setFeatureDesc(layer: string, number: number): void;
    setMarkerPopup(layer: string, index: number, text: string): void
    panToFeature(layer:string, number: number): void;
    highlightFeature(layer: string, number: number): void;
    setFeatureIcon(layer:string, number: number, icon:L.Icon,src:string): void;
}