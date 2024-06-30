import * as vscode from 'vscode';

/**
 * Creates  a settings file for the extension,
 */
export async function createSettings(workspace?: string) {

	let data = {
		workspace: "",
		recentMax: 10,
		recent: []
	};

	await saveSettings(JSON.stringify(data, null, 2), workspace);
}

/**
 * Reads the settings file located in the workspace with the provided name.
 * The first available workspace is used If no name is provided. Also creates a settings file if the workspace doesn't already contain one.
 * Shows a message if no workspace exists.
 * @param workspace Name of the root workspace
 * @returns The settings file's content from the provided workspace or null if there is no workspace. 
 */
export async function readSettings(workspace?: string): Promise<settings | null> {

	if (!vscode.workspace.workspaceFolders) {
		vscode.window.showInformationMessage('No folder or workspace opened');

		return null;
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

	const fileName = ".interactive-map.json";
	const path = vscode.Uri.joinPath(wf, fileName);

	// Check if settings exist, otherwise create them.
	let file: Uint8Array;

	let content: settings | null = null;
	try {
		file = await vscode.workspace.fs.readFile(path);
		content = JSON.parse(file.toString());
	} catch {
			// The settings file likely is broken or missing, so we regenerate it.
		await createSettings(workspace);
		file = await vscode.workspace.fs.readFile(path);
	}

	return content;
}

/**
 * Saves the  settings file,
 * @param {*} data Content of the settings file as JSON string.
 * @returns  An error if there is no workspace. Otherwise nothing is returned.
 */
export async function saveSettings(data: string, workspace?: string) {

	const fileName = ".interactive-map.json";

	if (!vscode.workspace.workspaceFolders) {
		return vscode.window.showInformationMessage('No folder or workspace opened');
	}

	const wf = vscode.workspace.workspaceFolders.find(i => i.name === workspace)?.uri;

	if (wf) {

		const path = vscode.Uri.joinPath(wf, fileName);
		const writeData = Buffer.from(data, 'utf8');
		await vscode.workspace.fs.writeFile(path, writeData);
	}
}

export async function getWorkspace() { }

/**
 * We should scan each workspace for a settings file and populate the sidebar accordingly.
 * If there is a multi-root workspace, we should list separate  entries for the recently used that are linked to the respective workspace.
 * When we open or create a map, we use the path to check which workspace to put it under.
 */