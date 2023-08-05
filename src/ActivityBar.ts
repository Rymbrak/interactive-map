
/**
 * Class for managing the activity bar. Provides buttons to load previously opened maps.
 */
class ActivityBar {

    vscode: { postMessage: any; };
    nonce: string;

    constructor(vscode: any, nonce: string) {

        this.vscode = vscode;
        this.nonce = nonce;
    }

    /**
     * Creates listeners for buttons in the activity bar.
     */
    addListeners() {

        let createButton = document.getElementById("createMap");
        createButton?.addEventListener("click", (e) => {
            this.vscode.postMessage({
                command: 'createMap',
            });
        });

        let openButton = document.getElementById("openMap");
        openButton?.addEventListener("click", (e) => {
            this.vscode.postMessage({
                command: 'openMap',
            });
        });
    }

    /**
     * Tells the extension to load a map at the given path.
     * @param {*} path Path for the map. (Provided by the sidebar buttons.)
     */
    loadMap(workspace: string, path: string) {

        this.vscode.postMessage({
            command: 'open',
            workspace: workspace,
            path: path
        });
    }

    /**
     *Tells the extension to refresh the activity bar window.
     */
    async refresh() {

        this.vscode.postMessage({
            command: 'refresh',
        });
    }

    /**
     * Refreshes the sidebar content and adds listeners to each entry.
     * @param {*} settings List of all Interactive Map Settings files in the workspaces as json.
     */
    updateContent(workspaces: string[], settingsArray: settings[], images: string[][]) {

        let content = document.getElementById("content");
        /**
         * Clear the innerHTML in case we have dangling elements from a previous start.
         * We don't keep any references to the listeners of respective buttons, the the GC should take care of them.
         */
        if (content) {
            content.innerHTML = "";
        }

        let index = 0;
        let btnCount = 0;

        /**
         * Create an entry for each workspace with a settings file and populate it.
         */
        for (let workspace of workspaces) {

            /**
             * Create foldable summary to host all entries for a workspace.
             */
            let wf = document.createElement("details");
            wf.className = "recentWorkspace";
            wf.setAttribute("open", "true");
            let summary = document.createElement("summary");
            summary.textContent = workspaces[index];
            wf.appendChild(summary);
            content?.appendChild(wf);

            /**
             * Create entries for every map stored in the workspaces respective settings file.
             * Each entry will have a button that loads the map on click along with images used as preview.
             */
            let settings = settingsArray[index];
            let data: string[] = settings.recent.slice(0, settings.recentMax);
            btnCount = this.createRecentEntries(wf, workspace, btnCount, data, images[index]);
            index++;
        }

    }

    /**
     * Generates HTML containing buttons for every recently opened map in the provided settings file.
     * @param {*} data Recent entries from a settings file.
     * @returns  HTML strings for buttons.
     */
    createRecentEntries(root: HTMLElement | null, workspace: string, btnCount: number, data: string[], images: string[]) {

        if (root) {

            let index = 0;

            for (const element of data) {

                let button = document.createElement("button");
                let image = document.createElement("img");

                button.className = "recentEntry";
                button.id = "recentEntry" + btnCount;

                image.className = "recentImg";
                image.setAttribute("nonce", this.nonce);
                image.src = images[index];
                button.textContent = data[index].replace(".json", "");

                button.appendChild(image);
                root.appendChild(button);

                button.addEventListener("click", (e) => this.loadMap(workspace, element));
                btnCount++;
                index++;
            }

        }
        return btnCount;
    }

}