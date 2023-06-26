interface IFeatureUtilities {
    setBounds(bounds: [number, number][]): void;
    setFeatureName(layer: string, number: number): void;
    setFeatureDesc(layer: string, number: number): void;
    panToFeature(layer:string, number: number): void;
    highlightFeature(layer:string, number: number): void;
}