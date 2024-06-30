import * as vscode from "vscode";

export interface IMapManager {

    refresh: boolean;
    saveMap(path: vscode.Uri, data: string): void;
    generateMap(): string;
    readMap(path: vscode.Uri, context: vscode.ExtensionContext): Promise<mapFile | undefined>;
    getImages(wf: vscode.WorkspaceFolder, mapNames: string[], webview: vscode.Webview) : Promise<string[] | undefined>;
}