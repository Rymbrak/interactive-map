import * as vscode from "vscode";
import { readSettings } from "./Settings";
import { getHtmlForActivityBar } from "./Template";
import { IMapManager } from "./webview/Interfaces/IMapManager";
import { Settings } from "http2";
import { log } from "console";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;
    mapManager: IMapManager;

    constructor(private readonly _extensionUri: vscode.Uri, mapManager: IMapManager) {
        this.mapManager = mapManager;
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
        };

        webviewView.webview.html = getHtmlForActivityBar(this._extensionUri, this._view?.webview);

        // Listen for messages from the Sidebar component and execute action
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "onInfo": {
                    if (!message.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(message.value);
                    break;
                }
                case "onError": {
                    if (!message.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(message.value);

                    break;
                }
                case "refresh": {

                    await this.refreshActivityBar();
                    break;
                }
                case "open": {

                    vscode.commands.executeCommand('interactive-map.open', message.workspace, message.path);
                    break;
                }
                case 'createMap': {

                    vscode.commands.executeCommand('interactive-map.createMap');
                    break;
                }
                case 'openMap': {

                    vscode.commands.executeCommand('interactive-map.openMap');
                    break;
                }
                case 'getWorkspace': {

                    let wf: vscode.WorkspaceFolder = await vscode.commands.executeCommand('interactive-map.getWorkspace');
                    let name = wf.name;
                    this._view?.webview.postMessage({ command: 'workspace', name });
                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    async refreshActivityBar() {

        let folders = vscode.workspace.workspaceFolders;
        let workspaces: string[] = [];
        let settingsArray: settings[] = [];
        let imageArray: string[][] = [];

        if (folders) {

            for (let folder of folders) {

                let settings = await readSettings(folder.name);

                /**
                 * We only care about workspaces that have settings files.
                 */
                if (settings) {

                    workspaces.push(folder.name);
                    settingsArray.push(settings);
                    let images: string[] | undefined = [];

                    if (this._view) {
                        images = await this.mapManager.getImages(folder, settings.recent, this._view?.webview);
                        
                        if (images) {
                            imageArray.push(images);
                        } else {
                            imageArray.push([]);
                        }
                    }
                }
            }

        }

        this._view?.webview.postMessage({ command: 'refresh', workspaces, settingsArray, imageArray });
    }

}