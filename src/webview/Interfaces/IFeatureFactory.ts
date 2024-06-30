interface IFeatureFactory {
    createMarker(element: feature): any;
    createCircleMarker(element: feature): L.Layer;
    createRectangle(element: feature): L.Layer;
    createCircle(element: feature): L.Layer;
    createPolygon(element: feature): L.Layer;
    createPolyline(element: feature): L.Layer;
}