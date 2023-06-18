// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import { getHtmlForWebview, replace } from './Template';
import { createSettings, readSettings, saveSettings } from './Settings';
import { Core } from './Core';
import { InteractiveMapSerializer } from './InteractiveMapSerializer';
import { MapManager } from './MapManager';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(this: any, context: vscode.ExtensionContext) {

	if (!vscode.workspace.workspaceFolders) {
		return vscode.window.showInformationMessage('No folder or workspace opened');
	}

	// Register the Sidebar Panel
	let mapManager = new MapManager(context);
	let  sidebarProvider = new SidebarProvider(context.extensionUri, mapManager);
	

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"interactive-map-sidebar",
			sidebarProvider
		)
	);

	let core = new Core(context, sidebarProvider, mapManager);

	vscode.window.registerWebviewPanelSerializer('interactiveMap', new InteractiveMapSerializer(core));

	let disposable = vscode.commands.registerCommand('interactive-map.openMap', () => {
		core.openMap(context);
	});

	/**
	 * Command for creating a panel with no open map.
	 */
	let disposable2 = vscode.commands.registerCommand('interactive-map.showView', () => {
		// Create and show a new webview
		core.panel = core.createPanel(context);
	});

	/**
	 * Command for creating a new map.
	 */
	let disposable3 = vscode.commands.registerCommand('interactive-map.createMap', () => {
		core.createMap();
	});

	/**
	 * Internal command for opening maps by path.
	 */
	let disposable4 = vscode.commands.registerCommand('interactive-map.open', async (file) => {

		core.fileName = file;
		core.open(context);;
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);

}

// This method is called when your extension is deactivated
export function deactivate() { }

/**
// Returns an URI for files located in the extension.
 * @param context Extension context provided by the extension.
 * @param webview Webview created by the extension
 * @param path Base path, provided for ease of use when calling the function multiple times.
 * @param pathSegments Segments to be combined.
 * @returns An URI consisting of the provided path and segments.
 */
function getURI(context: vscode.ExtensionContext, webview: vscode.Webview, path: string[], ...pathSegments: string[]) {

	return webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ...path, ...pathSegments));
}

