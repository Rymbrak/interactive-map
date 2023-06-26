import * as vscode from "vscode";
import { getHtmlForWebview } from "./Template";
import { SidebarProvider } from "./SidebarProvider";
import { createSettings, readSettings, saveSettings } from "./Settings";
import { IMapManager } from "./webview/Interfaces/IMapManager";

export class Core {

    constructor(extensionContext: any, sidebarProvider: SidebarProvider, mapManager: IMapManager) {

        this.extensionContext = extensionContext;
        this.sidebarProvider = sidebarProvider;
        this.mapManager = mapManager;
    }

    mapManager: IMapManager;

    /**
     * Main panel for the extension. always opened in second column.
     */
    panel: vscode.WebviewPanel | undefined = undefined;

    /**
     * Filepath of the current map's image.
     */
    mapPath: string = "";
    /**
     * Filepath of the current map. Used for opening or saving the map.
     */
    fileName: string = "";
    /**
     * Bool for panel state.
     */
    isDisposed = true;
    /**
     * Listener to track whether the panel is disposed.
     */
    listener = () => {
        this.isDisposed = true;
    };

    subscription: any;

    imgFolderName = "interactive-map";

    sidebarProvider: SidebarProvider;

    extensionContext: vscode.ExtensionContext;

    refresh = false;

    /**
     * Creates a panel for the extension to display maps in.
     * @param context  Extension context provided by the extension.
     * @returns  The created panel.
     */
    createPanel(context: vscode.ExtensionContext) {

        const localResourceRoots: vscode.Uri[] = []; // TODO.
        localResourceRoots.push(vscode.Uri.file(context.extensionPath));
        vscode.workspace.workspaceFolders?.forEach(f => localResourceRoots.push(f.uri));

        this.panel = vscode.window.createWebviewPanel(
            'interactiveMap', // Identifies the type of the webview. Used internally
            'Interactive Map', // Title of the panel displayed to the user
            vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                localResourceRoots,
                retainContextWhenHidden: true
                //localResourceRoots: [vscode.Uri.joinPath(context.extensionUri), wf,  vscode.Uri.joinPath(vscode.Uri.file(config.document.uri.fsPath), "../")]
            } // Webview options. More on these later.
        );

        /**
         * We set the webview's content once, all other updates happen through the Leaflet API and imap.js.
         */
        this.panel.webview.html = getHtmlForWebview(context, this.panel.webview);

        this.addMessageListeners();

        return this.panel;
    }

    /**
 * Asks a user for a path to a map file excluding the extension name, reads the file if it exists and tells the panel to display it.
 * @param context Extension context provided by the extension.
 * @returns  An error if there is no workspace. Otherwise nothing is returned.
 */
    async openMap(context: vscode.ExtensionContext) {

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }

        if (!this.panel || this.isDisposed) {
            this.panel = this.createPanel(context);
        }

        try {
            const selectedText = "";
            this.fileName = await vscode.window.showInputBox({
                placeHolder: "Map Name",
                prompt: "Enter name of the map to open.",
                value: selectedText
            }) + '.json' ?? "";
            await this.open(context);
        } catch (error) {
            return vscode.window.showInformationMessage('Map does not exist.');
        }
    }

    /**
     * Opens the currently active map.
     * @param context Extension context provided by the extension.
      * @returns  An error if there is no workspace. Otherwise nothing is returned.
     */
    async open(context: vscode.ExtensionContext) {

        if (!vscode.workspace.workspaceFolders) {

            vscode.window.showInformationMessage('No folder or workspace opened');
            return;
        }
        const wf = vscode.workspace.workspaceFolders[0].uri;

        if (!this.panel || this.isDisposed) {
            this.panel = this.createPanel(context);
        }

        let json = await this.mapManager.readMap(this.fileName, context);
        const path = vscode.Uri.joinPath(wf, this.fileName);

        if (json === undefined) {
            /**
             * The map file doesn't exist, so we delete it from the recent entry.
             */
            this.removeRecent(this.fileName);
            return;
        }

        this.mapPath = json["mapPath"];
        let imagePath = "";

        /**
         * If the background image path is empty, we just pass an empty string, which will be resolved to the empty background placeholder.
         */
        if (this.mapPath !== "") {
            imagePath = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(wf, this.mapPath)).toString();
        }
        const layers = json["layers"];
        const bounds = json["bounds"];

        let fileName = this.fileName;

        // Send a message to our webview.
        // You can send any JSON serializable data.
        this.panel.webview.postMessage({ command: 'openMap', path, imagePath, bounds, layers, fileName });
        await this.addRecent(this.fileName);

    }

    /**
     * Removes the given entry from the recent map list and saves the settings.
     * @param path Path to add to the recently opened map list.
     */
    async removeRecent(path: string) {

        let settings = await readSettings();

        if (settings === null) {
            /**
             * Settings  weren't read or created because we aren't in a workspace or folder.
             */
            return;
        }

        if (settings.recent.includes(path)) {

            settings.recent.splice(settings.recent.indexOf(path), 1);
        }

        await saveSettings(JSON.stringify(settings, null, 2));

        this.sidebarProvider.refreshActivityBar();
    }

    /**
     * Updates the recently opened map list and saves the settings.
     * @param path Path to add to the recently opened map list.
     */
    async addRecent(path: string) {

        let settings = await readSettings();

        if (settings === null) {
            /**
             * Settings  weren't read or created because we aren't in a workspace or folder.
             */
            return;
        }

        if (settings.recent.includes(path)) {

            settings.recent.splice(0, 0, settings.recent.splice(settings.recent.indexOf(path), 1)[0]);
        } else {
            settings.recent.unshift(path);
        }
        await saveSettings(JSON.stringify(settings, null, 2));

        this.sidebarProvider.refreshActivityBar();
    }

    /**
     * Adds listeners for messages posted from the webview.
     */
    addMessageListeners() {
        if (this.panel) {

            // Handle messages from the webview
            this.panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'save':
                            var result = message.text;
                            result.mapPath = this.mapPath;
                            this.saveMap(this.fileName, JSON.stringify(result));
                            return;
                        case 'refresh':
                            if (this.panel) {
                                this.sidebarProvider.refreshActivityBar();
                            }
                            return;
                        case 'image':
                            this.createImgFolder();
                            this.saveImage(message.image, message.name);
                            this.mapPath = this.imgFolderName + "/" + message.name;
                            this.refresh = true;
                            this.saveCall();
                            return;

                    }
                },
                undefined,
                this.extensionContext.subscriptions
            );

            this.isDisposed = false;
            this.subscription = this.panel.onDidDispose(this.listener);
        }
    }

    /**
     * Creates a folder for images used in interactive maps.
     * @returns 
     */
    async createImgFolder() {

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }
        const wf = vscode.workspace.workspaceFolders[0].uri;
        const path = vscode.Uri.joinPath(wf, this.imgFolderName);

        let directory;
        try {
            directory = await vscode.workspace.fs.readDirectory(path);
        } catch {
            await createSettings();
            await vscode.workspace.fs.createDirectory(path);
        }
    }

    async saveImage(image: ArrayBuffer, name: string) {

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }
        const wf = vscode.workspace.workspaceFolders[0].uri;
        const path = vscode.Uri.joinPath(wf, this.imgFolderName, name);

        await vscode.workspace.fs.writeFile(path, new Uint8Array(image));
    }

    /**
     * Notify the webview to generate a json from the map and return it to be written into a file.
     * @param context 
     */
    saveCall() {

        if (!this.panel) {
            this.panel = this.createPanel(this.extensionContext);
        }
        this.panel.webview.postMessage({ command: 'saveMap' });
    }

    // Creates and saves a map file for the given name and data.
    async saveMap(fileName: string, data: string) {

        await this.mapManager.saveMap(fileName, data);
        if (this.refresh) {
            this.refresh = false;
            this.open(this.extensionContext);
        }
    }


    // Asks the user for a name and creates a new map file.
    async createMap() {

        let selectedText: string | undefined;
        selectedText = await vscode.window.showInputBox({
            placeHolder: "Map Name",
            prompt: "Enter a name for the map",
            value: selectedText
        });
        this.fileName = selectedText  + '.json' ?? "";

        /**
         * Either the prompt was cancelled or an empty string was passed, so we do not create a file.
         */
        if (selectedText) {
            this.fileName = selectedText  + '.json';
            let data = this.mapManager.generateMap();

            await this.saveMap(this.fileName, data);
            this.open(this.extensionContext);
        }
    }

}