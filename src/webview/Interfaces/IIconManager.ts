interface IIconManager {
    getIcon(name: string, style: string): string;
    getDivIcon(name: string): L.DivIcon;
    setIcon(name: string, value: string): void;
    /**
     * Creates  a html string for an image from the given path and color.
     * @param path 
     * @param color 
     */
    makeImage(path: string, color: string): string;
    makeIcon(path: string): L.Icon;
}