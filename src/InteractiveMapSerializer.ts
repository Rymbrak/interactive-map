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
			/**
			 * There is a regression, where a map opened here will fail saving with w.with is not a function for some reason. There should virtually be no difference between manually opening and restoring from the webview.
			 * Even the used data is identical. so I have no clue why it fails. It seems that the filesystem isn't writeable till some user interaction happens?
			 */
			//this.core.open(this.core.extensionContext, state);
		}
	}
}