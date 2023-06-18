
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
     * Tells the extension to load a map at the given path.
     * @param {*} path Path for the map. (Provided by the sidebar buttons.)
     */
    loadMap(path: string) {

        this.vscode.postMessage({
            command: 'open',
            path: path
        });
    }

    /**
     * Queries the extension for the settings file to refresh the sidebar content.
     */
    async refresh() {

        this.vscode.postMessage({
            command: 'refresh',
        });
    }

    /**
     * Generates HTML with buttons for every recently opened map.
     * @param {*} data 
     * @returns  HTML strings for buttons.
     */
    getRecent(data: any[], images: string[]) {

        var content = "";
        let index = 0;

        data.forEach((element) => {
            content += '<button class ="btn" id="btn' + index + '">' +
                '<img class="img" nonce="' + this.nonce + '" src=' + images[index] + ' />' +
                element.replace(".json", "") +
                "</button>";
            index++;
        });

        return content;
    }

    /**
     * Refreshes the sidebar content and adds listeners to each entry.
     * @param {*} settings  Interactive Map Settings file as json.
     */
    updateContent(settings: settings, images: string[]) {

        this.updateHTML(this.getRecent(settings.recent, images));

        let index = 0;
        settings.recent.forEach(element => {
            document.getElementById("btn" + index)?.addEventListener("click", (e) => this.loadMap(element));
            index++;
        });
    }

    /**
     * Replaces the sidebar content with the given content.
     * @param {*} html  HTML content for the sidebar element.
     */
    updateHTML(html: string) {

        let elem = document.getElementById("content");
        if (elem !== null) {
            elem.innerHTML = html;
        }
    }

}