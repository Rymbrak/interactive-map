import * as vscode from "vscode";

export interface IMapManager {

    refresh: boolean;
    saveMap(fileName: string, data: string): void;
    generateMap(): string;
    readMap(fileName: string, context: vscode.ExtensionContext): Promise<mapFile | undefined>;
    getImages(mapNames: string[], webview: vscode.Webview) : Promise<string[] | undefined>;
}