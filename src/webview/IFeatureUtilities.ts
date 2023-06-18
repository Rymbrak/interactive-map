interface IFeatureUtilities {
    setBounds(bounds: [number, number][]): void;
    setMarkerName(number: number): void;
    setMarkerDesc(number: number): void;
    panToMarker(number: number): void;
    highlightMarker(number: number): void;
}