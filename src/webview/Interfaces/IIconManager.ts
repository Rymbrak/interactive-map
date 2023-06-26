interface IIconManager {
    getIcon(name: string, style:string): string;
    getDivIcon(name: string):  L.DivIcon;
    setIcon(name: string, value:string ): void;
}