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
    fileUri: vscode.Uri | undefined;
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
 * Provides the user with a file dialog to open a map. The selected file is read and displayed in the webview.
 * Does nothing if the file is not a map.
 * @param context Extension context provided by the extension.
 * @returns  An error if there is no workspace. Otherwise nothing is returned.
 */
    async openMap(context: vscode.ExtensionContext) {

        let filters = {
            'JSON': ['json']
        };

        let file: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({ canSelectMany: false , filters: filters });

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }
        const wf = vscode.workspace.workspaceFolders[0].uri;

        if (!this.panel || this.isDisposed) {
            this.panel = this.createPanel(context);
        }

        if (file) {

            try {

                this.fileUri = file[0];

                await this.open(context, file[0]);
            } catch (error) {
                return vscode.window.showInformationMessage('Map does not exist.');
            }
        }
    }

    /**
     * Opens the provided map file.
     * @param context Extension context provided by the extension.
      * @returns  An error if there is no workspace. Otherwise nothing is returned.
     */
    async open(context: vscode.ExtensionContext, path: vscode.Uri) {

        if (!vscode.workspace.workspaceFolders) {

            vscode.window.showInformationMessage('No folder or workspace opened');
            return;
        }

        const wf = vscode.workspace.getWorkspaceFolder(path)?.uri;
        if (wf) {

            if (!this.panel || this.isDisposed) {
                this.panel = this.createPanel(context);
            }

            let json = await this.mapManager.readMap(path, context);
            let name = path.path.replace(wf.path + "/", "");

            if (json === undefined) {
                /**
                 * The map file doesn't exist, so we delete it from the recent entry.
                 */
                this.removeRecent(path, name);
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

            // Send a message to our webview.
            // You can send any JSON serializable data.
            this.panel.webview.postMessage({ command: 'openMap', path, imagePath, bounds, layers });

            await this.addRecent(path, name);
        }
    }

    /**
     * Removes the given entry from the recent map list and saves the settings.
     * @param path Path to add to the recently opened map list.
     */
    async removeRecent(uri: vscode.Uri, path: string) {

        let wfName = vscode.workspace.getWorkspaceFolder(uri)?.name;
        let settings = await readSettings(wfName);

        if (settings === null) {
            /**
             * Settings  weren't read or created because we aren't in a workspace or folder.
             */
            return;
        }

        if (settings.recent.includes(path)) {

            settings.recent.splice(settings.recent.indexOf(path), 1);
        }

        await saveSettings(JSON.stringify(settings, null, 2), wfName);

        this.sidebarProvider.refreshActivityBar();
    }

    /**
     * Updates the recently opened map list and saves the settings.
     * @param path Path to add to the recently opened map list.
     */
    async addRecent(uri: vscode.Uri, path: string) {

        let wfName = vscode.workspace.getWorkspaceFolder(uri)?.name;
        let settings = await readSettings(wfName);

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
        await saveSettings(JSON.stringify(settings, null, 2), wfName);

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

                            if (this.fileUri) {

                                this.saveMap(this.fileUri, JSON.stringify(result));
                            }
                            return;
                        case 'refresh':
                            if (this.panel) {
                                this.sidebarProvider.refreshActivityBar();
                            }
                            return;
                        case 'image':
                            this.createImgFolder();
                            /**
                             * We can grab the workspace from the currently open map. A map should be open, since this is would only be called through the interactive map view's sidebar.
                             */
                            if (this.fileUri) {
                                let workspace = vscode.workspace.getWorkspaceFolder(this.fileUri)?.uri;

                                if (workspace) {
                                    this.saveImage(workspace, message.image, message.name);
                                    this.mapPath = this.imgFolderName + "/" + message.name;
                                    this.refresh = true;
                                    this.saveCall();
                                }
                            }
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

    /**
     * Saves the given image under the given name in the image folder, used for previous on the activity bar.
     * Overwrites files with the same name.
     * @param image Image as ArrayBuffer
     * @param name Name for the file.
     * @returns 
     */
    async saveImage(workspace: vscode.Uri, image: ArrayBuffer, name: string) {

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }

        const path = vscode.Uri.joinPath(workspace, this.imgFolderName, name);

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

    /**
     * Creates and saves a map file with the provided data at the given path.
     * @param fileName  Relative path of the file.
     * @param data Content for the file.
     */
    async saveMap(file: vscode.Uri, data: string) {

        await this.mapManager.saveMap(file, data);
        if (this.refresh) {
            this.refresh = false;
            this.open(this.extensionContext, file);
        }
    }

    /**
     * Asks the user for a name and creates a new map file.
     * @returns 
     */
    async createMap() {

        let filters = {
            'JSON': ['json']
        };

        let file: vscode.Uri | undefined = await vscode.window.showSaveDialog({ filters: filters , title: "Enter a file name (no extension needed)" });

        if (!vscode.workspace.workspaceFolders) {
            return vscode.window.showInformationMessage('No folder or workspace opened');
        }
        const wf = vscode.workspace.workspaceFolders[0].uri;

        if (file) {
            file = vscode.Uri.file(file.path + ".json");
            this.fileUri = file;
            let data = this.mapManager.generateMap();

            await this.saveMap(file, data);
            this.open(this.extensionContext, file);
        }

        /**
        * Either the prompt was cancelled or an empty string was passed, so we do not create a file.
        */
    }

}