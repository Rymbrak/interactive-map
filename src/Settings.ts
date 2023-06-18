import * as vscode from 'vscode';

/**
 * Creates  a settings file for the extension,
 */
export async function createSettings() {

	let data = {
		recentMax: 10,
		recent: []
	};

	await saveSettings(JSON.stringify(data, null, 2));
}

/**
 * Read the extensions settings file.
 * @returns  A JSON of the settings file.
 */
export async function readSettings(): Promise<settings | null> {

	if (!vscode.workspace.workspaceFolders) {
		vscode.window.showInformationMessage('No folder or workspace opened');

		return null;
	}

	const wf = vscode.workspace.workspaceFolders[0].uri;
	const fileName = ".interactive-map.json";
	const path = vscode.Uri.joinPath(wf, fileName);

	// Check if settings exist, otherwise create them.
	let file;
	try {
		file = await vscode.workspace.fs.readFile(path);
	} catch {
		await createSettings();
		file = await vscode.workspace.fs.readFile(path);
	}

	return JSON.parse(file.toString());
}

/**
 * Saves the  settings file,
 * @param {*} data Content of the settings file as JSON string.
 * @returns  An error if there is no workspace. Otherwise nothing is returned.
 */
export async function saveSettings(data: string) {

	const fileName = ".interactive-map.json";

	if (!vscode.workspace.workspaceFolders) {
		return vscode.window.showInformationMessage('No folder or workspace opened');
	}

	const wf = vscode.workspace.workspaceFolders[0].uri;
	const path = vscode.Uri.joinPath(wf, fileName);
	const writeData = Buffer.from(data, 'utf8');
	await vscode.workspace.fs.writeFile(path, writeData);
}