import * as vscode from 'vscode';
import { WebviewPanelManager } from './WebviewPanelManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "story-yaml" is now active in the web extension host!');

    const panelManager = new WebviewPanelManager(context.extensionUri);

    context.subscriptions.push(
        vscode.commands.registerCommand('story-yaml.preview', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await panelManager.createOrShow(editor.document);
            } else {
                vscode.window.showErrorMessage('No active editor');
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            panelManager.update();
        })
    );
}

export function deactivate() {}