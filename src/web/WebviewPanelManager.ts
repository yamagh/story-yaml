import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { StoryFile, WebviewMessage, ExtensionMessage } from './types';
import { StoryYamlService } from './services/StoryYamlService';

export class WebviewPanelManager {
    private static readonly viewType = 'storyYamlPreview';
    private _panel: vscode.WebviewPanel | undefined;
    private _document: vscode.TextDocument | undefined;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public createOrShow(document: vscode.TextDocument) {
        this._document = document;
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (this._panel) {
            this._panel.reveal(column);
            this.update();
            return;
        }

        this._panel = vscode.window.createWebviewPanel(
            WebviewPanelManager.viewType,
            'Story YAML Preview',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist', 'web')]
            }
        );

        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message: WebviewMessage) => {
                switch (message.command) {
                    case 'ready':
                        this.update();
                        return;
                    case 'addItem':
                        await this.addItemToStoryFile(message);
                        this.update();
                        return;
                    case 'updateItem':
                        await this.updateItemInStoryFile(message);
                        this.update();
                        return;
                    case 'deleteItem':
                        await this.deleteItemFromStoryFile(message);
                        this.update();
                        return;
                    case 'updateStoryFile':
                        await this.updateStoryFile(message);
                        // No need to call update() here as the change originated from the webview
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public update() {
        if (!this._panel || !this._document) {
            return;
        }
        try {
            const storyFile = yaml.load(this._document.getText()) as StoryFile;
            this.postMessage({ command: 'update', storyFile });
        } catch (e) {
            if (e instanceof Error) {
                vscode.window.showErrorMessage(`Error parsing YAML: ${e.message}`);
            } else {
                vscode.window.showErrorMessage(`An unknown error occurred while parsing YAML.`);
            }
        }
    }

    public dispose() {
        this._panel?.dispose();
        this._panel = undefined;
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private postMessage(message: ExtensionMessage) {
        this._panel?.webview.postMessage(message);
    }

    private async updateStoryFile(message: WebviewMessage & { command: 'updateStoryFile' }) {
        if (!this._document) return;
        const newContent = StoryYamlService.saveStoryFile(message.storyFile);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(this._document.uri, new vscode.Range(0, 0, this._document.lineCount, 0), newContent);
        await vscode.workspace.applyEdit(edit);
    }

    private async addItemToStoryFile(message: WebviewMessage & { command: 'addItem' }) {
        if (!this._document) return;
        const newContent = StoryYamlService.updateStoryContent(this._document.getText(), message.item);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(this._document.uri, new vscode.Range(0, 0, this._document.lineCount, 0), newContent);
        await vscode.workspace.applyEdit(edit);
    }

    private async updateItemInStoryFile(message: WebviewMessage & { command: 'updateItem' }) {
        if (!this._document) return;
        const newContent = StoryYamlService.updateStoryContentForItemUpdate(this._document.getText(), message.item);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(this._document.uri, new vscode.Range(0, 0, this._document.lineCount, 0), newContent);
        await vscode.workspace.applyEdit(edit);
    }

    private async deleteItemFromStoryFile(message: WebviewMessage & { command: 'deleteItem' }) {
        if (!this._document) return;
        const newContent = StoryYamlService.deleteItemFromStoryFile(this._document.getText(), message.item);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(this._document.uri, new vscode.Range(0, 0, this._document.lineCount, 0), newContent);
        await vscode.workspace.applyEdit(edit);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'web', 'webview.js'));
        const nonce = getNonce();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Story YAML Preview</title>
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
