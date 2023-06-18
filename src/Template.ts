import * as vscode from 'vscode';
import * as  path from 'path';
import * as fs from 'fs';

/**
 * Provides the html files with injected values for the extension.
 */

/**
 * Creates an HTML string containing the webview content, including paths for scripts and css.
 * @param context Extension context provided by the extension.
 * @param webview Webview created by the extension
 * @returns HTML for the panel.
 */
export function getHtmlForWebview(context: vscode.ExtensionContext, webview: vscode.Webview) {

    let pairs: { key: string, value: string }[] = [];

    pairs.push({
        key: 'scriptIMap',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'out', 'webview.js')).toString()
    });
    pairs.push({
        key: 'scriptCoord',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'lib', 'Leaflet.Coordinates', 'dist', 'Leaflet.Coordinates-0.1.5.src.js')).toString()
    });
    pairs.push({
        key: 'emptyMap',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'empty.png')).toString()
    });
    pairs.push({
        key: 'scriptSidePanel',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'lib', 'leaflet-sidebar-v2', 'js', 'leaflet-sidebar.min.js')).toString()
    });
    pairs.push({
        key: 'cssDraw',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'node_modules', 'leaflet-draw', 'dist', 'leaflet.draw.css')).toString()
    });
    pairs.push({
        key: 'cssLeaflet',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'node_modules', 'leaflet', 'dist', 'leaflet.css')).toString()
    });
    pairs.push({
        key: 'cssIMap',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'imap.css')).toString()
    });
    pairs.push({
        key: 'cssBootstrap',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'bootstrap-icons.css')).toString()
    });
    pairs.push({
        key: 'cssCoord',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'lib', 'Leaflet.Coordinates', 'dist', 'Leaflet.Coordinates-0.1.5.css')).toString()
    });
    pairs.push({
        key: 'cssSidePanel',
        value: webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'lib', 'leaflet-sidebar-v2', 'css', 'leaflet-sidebar.css')).toString()
    });
    pairs.push({
        key: 'webview.cspSource',
        value: webview.cspSource
    });
    pairs.push({
        key: 'nonce',
        value: getNonce()
    });

    let html = getWebviewContent(vscode.Uri.file(path.join(context.extensionPath, 'out', 'html', 'interactive-map.html')));
    let result: string = replace(html, pairs);

    return result;
}

/**
 * Creates an HTML string containing the activity bar webview content, including paths for scripts and css.
 * @param context Extension context provided by the extension.
 * @param webview Webview created by the extension
 * @returns HTML for the panel.
 */
export function getHtmlForActivityBar(uri: vscode.Uri, webview: vscode.Webview) {

    let pairs: { key: string, value: string }[] = [];

    pairs.push({
        key: 'scriptUri',
        value: webview.asWebviewUri(vscode.Uri.joinPath(uri, "out", "ActivityBar.js")).toString()
    });
    pairs.push({
        key: 'styleMainUri',
        value: webview.asWebviewUri(vscode.Uri.joinPath(uri, "media", "panel.css")).toString()
    });
    pairs.push({
        key: 'webview.cspSource',
        value: webview.cspSource
    });
    pairs.push({
        key: 'nonce',
        value: getNonce()
    });

    let html = getWebviewContent(vscode.Uri.parse(vscode.Uri.joinPath(uri, 'out', 'html', 'activity-bar.html').toString()));
    let result: string = replace(html, pairs);

    return result;
}

/**
 * Read the html file and return it as a string.
 * @param context 
 * @returns 
 */
function getWebviewContent(pathToHtml: vscode.Uri) {

    const pathUri = pathToHtml.with({ scheme: 'vscode-resource' });
    const html = fs.readFileSync(pathUri.fsPath, 'utf8');
    return html;
}

/**
 * Generate a random nonce from alphanumeric values.
 * @returns A randomized string.
 */
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function replace(text: string, pairs: { key: string, value: string }[]) {

    pairs.forEach(element => {
        text = text.replaceAll("${" + element.key + "}", element.value);
    });

    return text;
}

export function getEmpty(context: vscode.ExtensionContext, webview: vscode.Webview) {
    return webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'empty.png')).toString();
}