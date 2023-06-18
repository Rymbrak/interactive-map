import * as vscode from "vscode";
import { IMapManager } from "./IMapManager";
import { getEmpty } from "./Template";

/**
 * Class for manipulating maps. Provides functions to create, read, save and retrieve elements from the maps.
 */
export class MapManager implements IMapManager {

    refresh = false;
    version: string = "0.2.0";
    /**
    * Filepath of the current map's image.
    */
    mapPath: string = "";
    /**
     * Filepath of the current map. Used for opening or saving the map.
     */
    fileName: string = "";
    extensionContext: vscode.ExtensionContext;

    constructor(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;
    }

    // Creates and saves a map file for the given name and data.
    async saveMap(fileName: string, data: string) {

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }

        const wf = vscode.workspace.workspaceFolders[0].uri;
        const path = vscode.Uri.joinPath(wf, fileName);
        const writeData = Buffer.from(data, 'utf8');

        await vscode.workspace.fs.writeFile(path, writeData);
    }

    /**
     *  Generates the contents of a new map and returns them as string.
     * @returns A string containing the JSON data for a new map.
     */
    generateMap() {

        let data = JSON.stringify(
            {
                type: "Interactive-Map",
                version: this.version,
                mapPath: "",
                bounds: [[0, 0], [1024, 1024]],
                layers: [
                    {
                        name: "polyline",
                        content: {
                            type: "FeatureCollection",
                            features: []
                        }
                    },
                    {
                        name: "polygon",
                        content: {
                            type: "FeatureCollection",
                            features: []
                        }
                    },
                    {
                        name: "rectangle",
                        content: {
                            type: "FeatureCollection",
                            features: []
                        }
                    },
                    {
                        name: "circle",
                        content: {
                            type: "FeatureCollection",
                            features: []
                        }
                    },
                    {
                        name: "marker",
                        content: {
                            type: "FeatureCollection",
                            features: []
                        }
                    },
                    {
                        name: "circleMarker",
                        content: {
                            type: "FeatureCollection",
                            features: []
                        }
                    }
                ]
            });
        return data;
    }

    /**
     * Reads the map file with the given name in the workspace.
     * Displays a message if no workspace was foumd.
     * @param fileName File name including the path starting after the workspace.
     * @param context VSCode Extension context.
     * @returns  a mapFile if the file is valid, otherwise undefined.
     */
    async readMap(fileName: string) {

        let json: mapFile;

        if (!vscode.workspace.workspaceFolders) {

            vscode.window.showInformationMessage('No folder or workspace opened');
            return;
        }

        const wf = vscode.workspace.workspaceFolders[0].uri;
        const path = vscode.Uri.joinPath(wf, fileName);

        try {
            json = JSON.parse((await vscode.workspace.fs.readFile(path)).toString());
        }
        catch {
            return undefined;
        }

        return json;
    }

    async getImages(mapNames: string[], webview: vscode.Webview) {

        let result: string[] = [];

        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No folder or workspace opened');
            return undefined;
        }

        const wf = vscode.workspace.workspaceFolders[0].uri;

        for (let i = 0; i < mapNames.length; i++) {
            let element = mapNames[i];

            let map: mapFile | undefined = await this.readMap(element);
            if (map === undefined || map?.mapPath ==="") {
                result.push(getEmpty(this.extensionContext, webview));
                continue;
            }

            result.push(webview.asWebviewUri(vscode.Uri.joinPath(wf, map.mapPath)).toString());
        }
        
        return result;
    }

}