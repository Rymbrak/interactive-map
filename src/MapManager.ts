import * as vscode from "vscode";
import { IMapManager } from "./interfaces/IMapManager";
import { getEmpty } from "./Template";
import { write } from "fs";

/**
 * Class for manipulating maps. Provides functions to create, read, save and retrieve elements from the maps.
 */
export class MapManager implements IMapManager {

    refresh = false;
    versionManager: IVersionManager;

    /**
    * Filepath of the current map's image.
    */
    mapPath: string = "";
    /**
     * Filepath of the current map. Used for opening or saving the map.
     */
    fileName: string = "";
    extensionContext: vscode.ExtensionContext;

    constructor(extensionContext: vscode.ExtensionContext, versionManager: IVersionManager) {
        this.extensionContext = extensionContext;
        this.versionManager = versionManager;
    }

    // Creates and saves a map file for the given name and data.
    async saveMap(path: vscode.Uri, data: string) {

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }

        const writeData = Buffer.from(data, 'utf8');

        try {

            await vscode.workspace.fs.writeFile(path, writeData);
        } catch (error) {

            console.log("Error while writing", error);
        }
    }

    /**
     *  Generates the contents of a new map and returns them as string.
     * @returns A string containing the JSON data for a new map.
     */
    generateMap() {

        let data = JSON.stringify(
            {
                type: "Interactive-Map",
                version: this.versionManager.version,
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
                        name: "circlemarker",
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
     * Displays a message if no workspace was found.
     * @param fileName File name including the path starting after the workspace.
     * @param context VSCode Extension context.
     * @returns  a mapFile if the file is valid, otherwise undefined.
     */
    async readMap(path: vscode.Uri) {

        let json: mapFile;

        if (!vscode.workspace.workspaceFolders) {

            vscode.window.showInformationMessage('No folder or workspace opened');
            return;
        }

        let content: string;

        try {
            content = (await vscode.workspace.fs.readFile(path)).toString();
            /*
              * Check the content and apply patches for differing versions if needed.
              */
            content = this.versionManager.convert(content);
            json = JSON.parse(content);
        }
        catch {
            return undefined;
        }

        return json;
    }

    async getImages(wf: vscode.WorkspaceFolder, mapNames: string[], webview: vscode.Webview) {

        let result: string[] = [];

        for (let i = 0; i < mapNames.length; i++) {
            let element = vscode.Uri.joinPath(wf.uri, mapNames[i]);

            let map: mapFile | undefined = await this.readMap(element);
            if (map === undefined || map?.mapPath === "") {
                result.push(getEmpty(this.extensionContext, webview));
                continue;
            }

            result.push(webview.asWebviewUri(vscode.Uri.joinPath(wf.uri, map.mapPath)).toString());
        }

        return result;
    }
}