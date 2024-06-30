import axios, { AxiosInstance } from 'axios';
import * as vscode from "vscode";
import { Integration } from './Tokenizer';
import path = require('path');
import { error } from 'console';

interface DendronVault {
    fsPath: string;
    selfContained: boolean;
    name: string;
}

interface DendronNoteResponse {
    id: string;
    title: string;
    desc: string;
    updated: number;
    created: number;
    custom: {};
    fname: string;
    type: string;
    vault: DendronVault;
    contentHash: string;
    links: any[];
    anchors: {};
    children: [];
    parent: string;
    data: {};
    body: string;
}

/**
 * Provides access to Dendron notes.
 */
export class Dendron implements IIntegrator {

    instance: AxiosInstance | undefined;
    workspace: string = "";
    workspacePath: string | undefined;
    connectionRetries = 10;
    connectionRetriesDelay = 5000;
    extraPath: string = "";

    tokenizer: ITokenizer;

    constructor() {
        this.tokenizer = new Integration.Tokenizer();

        /**
         * Pull the entire rendered note as the token's content.
         * If no note is found, we leave the token content as is, for easier debugging.
         */
        this.tokenizer.addTokenDefinition({ type: "refContent", start: "![[", end: "]]", replace: async (token: IToken) => await this.noteFormat(token.content) ?? token.content });

        /**
        *Use Dendron's default behavior of showing the title instead.
        * If no note is found, we leave the token content as is, for easier debugging.
        */
        this.tokenizer.addTokenDefinition({ type: "ref", start: "[[", end: "]]", replace: async (token: IToken) => (await this.noteFind(token.content))?.title ?? token.content });
    }

    init(): void {
        throw new Error('Method not implemented.');
    }

    async parse(note: string): Promise<string> {

        let tokens = this.tokenizer.getTokens(note);

        return this.tokenizer.combine(tokens, true);
    }

    /**
     * Sets the currently active workspace for the Integrator.
     * This sets up an Axios instance for use with Dendron's Express server.
     * This requires a port written in the '.dendron.port' file, which is updated after Dendron finishes initializing.
     * If the port hasn't been updated yet, the connection will fail and another attempt will be started after an delay.
     * Set connectionRetries and connectionRetriesDelay for the number of retries and delay.
     * @param workspace Name of the workspace
     */
    async setWorkspace(workspace: string) {

        this.workspace = workspace;
        this.workspacePath = vscode.workspace.workspaceFolders?.find(i => i.name === this.workspace)?.uri.fsPath;

        this.instance = axios.create({
            baseURL: await this.getBaseUrl(workspace),
            timeout: 1000,
        });

        let path = await this.getPath(workspace);

        if (path) {
            this.extraPath = path;
        }
    }


    /**
     * Test whether the Dendron Express server can be reached,
     * @param url Base url with port.
     * @returns True if the server can be reached, false if not.
     */
    async checkConnection(url: string) {

        let result = false;

        await axios.get(url + "/version")
            .then(function (response) {
                result = true;
            })
            .catch(function (error) {
            })
            .finally(function () {
                // always executed
            });

        return result;
    }

    async readFile(fileName: string, workspace: string, checkParent: boolean = false): Promise<string | undefined> {

        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No folder or workspace opened');
            throw new Error('No folder or workspace opened');
        }

        let wf: vscode.Uri | undefined;

        /**
         * Search for the corresponding workspace if we were provided a name, otherwise we use the first available workspace.
         */
        if (workspace) {
            wf = vscode.workspace.workspaceFolders.find(i => i.name === workspace)?.uri;
        }

        if (!wf) {
            wf = vscode.workspace.workspaceFolders[0].uri;
        }

        const filePath = vscode.Uri.joinPath(wf, fileName);

        try {

            return (await vscode.workspace.fs.readFile(filePath))?.toString();
        } catch (error) {

            if (checkParent) {
                //throw new Error('Could not read file:' + filePath.toString() + " Checking parent directory instead.");
                let parentDirectory = filePath.path.substring(0, filePath.path.lastIndexOf(path.sep));
                parentDirectory = parentDirectory.substring(0, parentDirectory.lastIndexOf(path.sep));

                if (parentDirectory) {
                    const parentDirectoryPath = vscode.Uri.joinPath(vscode.Uri.file(parentDirectory), fileName);

                    try {
                        return (await vscode.workspace.fs.readFile(parentDirectoryPath))?.toString();
                    } catch (error) {

                        console.log(error);
                    }
                }
            } else {
                console.log(error);
            }
        }
    }

    async getParentURI() {
    }

    async getPath(workspace: string): Promise<string | undefined> {
        let fileName = "dendron.code-workspace";
        let settings = await this.readFile(fileName, workspace, true);

        if (typeof (settings) === 'string') {
            let json = JSON.parse(settings);
            return json.folders[0].path;
        }
    }

    /**
     * Returns the current dendron port used by the passed workspace.
     * @param workspace Name of the workspace with the dendron engine.
     * @returns  Port of the dendron engine.
     */
    async getPort(workspace: string) {

        const fileName = ".dendron.port";

        try {
            return await this.readFile(fileName, workspace, true);
        } catch {
            console.log("Couldn't read port from '.dendron.port' in directory or parent.");

        }
    }

    /**
     * Returns a local url used for contacting the dendron api.
     * @param workspace Name of the active workspace.
     * @returns  Url with the current dendron port.
     */
    async getBaseUrl(workspace: string) {

        let url = "";

        /**
         * Read the port file and try to establish a connection.
         * If it fails, wait for a delay and reread the port, then try again.
         */
        for (let i = 0; i < this.connectionRetries; i++) {
            let port = await this.getPort(workspace);
            url = `http://localhost:${port}`;

            if (await this.checkConnection(url)) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, this.connectionRetriesDelay));
        }
        return url;
    }

    /**
     * Returns the note the note with the given name.
     * The note name is the filename without extension.
     * For example: 'root.category.note'
     * Requires the Dendron Express server to be running.
     * @param noteName Name of the note to render.
     * @returns A html formatted string or undefined if no such note exists.
     */
    async noteFind(noteName: string): Promise<DendronNoteResponse | undefined> {

        let result: DendronNoteResponse | undefined = undefined;
        /**
          * We need to edit the workspacePath if the notes are stored in a separate folder.
          */
        let request = {
            fname: noteName,
            vault: this.getVault(),
            ws: this.workspacePath?.replace(path.sep + this.extraPath, "")
        };

        if (this.instance) {

            await this.instance.post('api/note/find?', request)
                .then(function (response) {
                    /**
                     * Dendron responds with an array named data, containing all notes it found for the given id, we need the first.
                     */
                    result = response.data.data[0];
                })
                .catch(function (error) {
                    console.log(error, request);
                })
                .finally(function () {
                    // always executed
                });
        }

        return result;
    }

    /**
     * Returns the html string for the note with the given name.
     * The note name is the filename without extension.
     * For example: 'root.category.note'
     * Requires the Dendron Express server to be running.
     * @param noteName Name of the note to render.
     * @returns A html formatted string or undefined if the note doesn't exist.
     */
    async noteRender(noteName: string): Promise<string | undefined> {

        /**
         * We first lookup the note and then pass it to the render request.
         */
        let note = await this.noteFind(noteName);

        let result = undefined;


        if (this.instance && note) {
            /**
             * We need to edit the workspacePath if the notes are stored in a separate folder.
             */
            let request = {
                id: note.id,
                ws: this.workspacePath?.replace(path.sep + this.extraPath, ""),
                note: note
            };
            this.instance.getUri();
            await this.instance.post('api/note/render?', request)
                .then(function (response) {

                    /**
                     * The API returns a html formatted string.
                     */
                    result = response.data.data;
                })
                .catch(function (error) {
                    console.log(error);
                })
                .finally(function () {
                    // always executed
                });
        }

        return result;
    }

    /**
     * Formats a note, replacing block references with their actual content.
     * @param noteName Name of the note.
     * @returns 
     */
    async noteFormat(noteName: string): Promise<string | undefined> {

        let result = undefined;

        let name = noteName;

        let arg = name.split('#');

        if (arg.length > 1) {

            name = arg[0];
            result = await this.noteRender(name);
            let lines = result?.split(/\r?\n/);

            /**
             * Blocks start with headers and an id of the same name. We'll search for the line containing a block and take everything from there on till we find another heading signaling a block start.
             * If the next line contains backlinks, we can stop. (They aren't currently supported anyway.)
             */
            let block = 'id=\"' + arg[1];
            let blockEnd = undefined;
            let add = false;
            let blockText = "";
            let reachedEnd = true;
            let headingDepth = 999;

            if (arg.length === 3) {
                block = arg[1].substring(0, arg[1].length - 1);
                blockEnd = arg[2];
                reachedEnd = false;
            }

            if (lines) {

                for (let i = 0; i < lines?.length; i++) {

                    if (lines[i].indexOf(block) !== -1 || add) {
                        blockText += lines[i];
                        add = true;
                        let tempDepth = parseInt(lines[i][2]);
                        if (tempDepth < headingDepth) {
                            headingDepth = tempDepth;
                        }

                        if (blockEnd && lines[i].indexOf(blockEnd) !== -1) {
                            reachedEnd = true;
                        }
                    }

                    if (reachedEnd && (lines[i + 1].startsWith("<h") && add)) {

                        let newHeadingDepth = parseInt(lines[i + 1][2]);

                        if (newHeadingDepth <= headingDepth) {

                            add = false;
                            break;
                        }
                    } else if (i + 1 < lines.length && lines[i + 1] === "<strong>Backlinks</strong>") {
                        break;
                    }
                }
                return blockText;
            }

        } else {
            return result = this.noteRender(name);
        }
    }

    async noteWrite(noteName: string, content: string) {
        let result: DendronNoteResponse | undefined = undefined;
        if (this.instance) {

            await this.instance.post('api/note/write?', {
                node: this.makeNode(noteName, content),
                ws: this.workspacePath
            })
                .then(function (response) {
                    result = response.data.data[0];
                })
                .catch(function (error) {
                    console.log(error);
                })
                .finally(function () {
                    // always executed
                });
        }
    }

    /**
     * Generate a random id from alphanumeric values.
     * @returns A randomized string.
     */
    generateId() {

        let id = '';
        const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 24; i++) {
            id += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return id;
    }

    getVault(): DendronVault {
        return {
            fsPath: ".",
            selfContained: true,
            name: this.workspace
        };
    }

    makeNode(name: string, body: string) {
        return {
            fname: name,
            vault: this.getVault(),
            title: name,
            schemaStub: false,
            type: "note",
            updated: 0,
            created: 0,
            id: this.generateId(),
            desc: "",
            links: [],
            anchors: {},
            children: [],
            parent: null,
            body: body,
            data: {}
        };
    }

}
