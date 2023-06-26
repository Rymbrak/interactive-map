interface ILayerManager {
    getDrawnItems(): L.FeatureGroup;
    getLayer(name: string): L.FeatureGroup;
}