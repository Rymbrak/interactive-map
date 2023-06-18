import * as vscode from "vscode";
import { readSettings } from "./Settings";
import { getHtmlForActivityBar } from "./Template";
import { IMapManager } from "./IMapManager";

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

                    vscode.commands.executeCommand('interactive-map.open', message.path);
                    break;
                }
            }
        });
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    async refreshActivityBar() {
        let settings = await readSettings();
        let images: string[] | undefined = [];
        if (settings && this._view) {
            images = await this.mapManager.getImages(settings.recent, this._view?.webview);
        }

        this._view?.webview.postMessage({ command: 'refresh', settings, images });
    }

}