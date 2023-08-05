import * as vscode from "vscode";
import { Core } from "./Core";
import { getHtmlForWebview } from "./Template";

export class InteractiveMapSerializer implements vscode.WebviewPanelSerializer {

	core: Core;

	constructor(core: Core) {
		this.core = core;
	}

	async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {

		webviewPanel.webview.html = getHtmlForWebview(this.core.extensionContext, webviewPanel.webview);
		this.core.panel = webviewPanel;

		this.core.addMessageListeners();

		this.core.fileUri = state;
		if (state) {
			this.core.open(this.core.extensionContext, state);
		}
	}
}