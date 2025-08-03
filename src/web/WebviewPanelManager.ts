import * as vscode from 'vscode';
import { WebviewMessage, ExtensionMessage, YamlParseError, FileUpdateError } from './types';
import { StoryYamlService } from './services/StoryYamlService';
import { WorkspaceService } from './services/WorkspaceService';
import { StoryEditorService } from './services/StoryEditorService';
import { getNonce } from './utils';

export class WebviewPanelManager {
    private static readonly viewType = 'storyYamlPreview';
    private _panel: vscode.WebviewPanel | undefined;
    private _document: vscode.TextDocument | undefined;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private readonly workspaceService: WorkspaceService;
    private readonly storyYamlService: StoryYamlService;
    private readonly storyEditorService: StoryEditorService;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
        this.workspaceService = new WorkspaceService();
        this.storyYamlService = new StoryYamlService();
        this.storyEditorService = new StoryEditorService(this.workspaceService, this.storyYamlService);
    }

    public async createOrShow(document: vscode.TextDocument) {
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

        this._panel.webview.html = await this._getHtmlForWebview(this._panel.webview);

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(this.handleMessage, this, this._disposables);
    }

    private async handleMessage(message: WebviewMessage) {
        if (!this._document) { return; }
        try {
            switch (message.command) {
                case 'ready':
                    return this.handleReady();
                case 'addItem':
                    return await this.handleAddItem(message);
                case 'updateItem':
                    return await this.handleUpdateItem(message);
                case 'deleteItem':
                    return await this.handleDeleteItem(message);
                case 'updateStoryFile':
                    return await this.handleUpdateStoryFile(message);
            }
        } catch (e) {
            this.handleError(e);
        }
    }

    private handleReady() {
        this.update();
    }

    private async handleAddItem(message: WebviewMessage & { command: 'addItem' }) {
        if (!this._document) { return; }
        const { storyFile, newId } = await this.storyEditorService.addItem(this._document, message.item);
        this.postMessage({ command: 'update', storyFile, newId });
    }

    private async handleUpdateItem(message: WebviewMessage & { command: 'updateItem' }) {
        if (!this._document) { return; }
        const storyFile = await this.storyEditorService.updateItem(this._document, message.item);
        this.postMessage({ command: 'update', storyFile });
    }

    private async handleDeleteItem(message: WebviewMessage & { command: 'deleteItem' }) {
        if (!this._document) { return; }
        const storyFile = await this.storyEditorService.deleteItem(this._document, message.item);
        this.postMessage({ command: 'update', storyFile });
    }

    private async handleUpdateStoryFile(message: WebviewMessage & { command: 'updateStoryFile' }) {
        if (!this._document) { return; }
        await this.storyEditorService.updateStory(this._document, message.storyFile);
    }

    private handleError(e: unknown) {
        if (e instanceof YamlParseError) {
            vscode.window.showErrorMessage(e.message);
            this.postMessage({ command: 'yamlError', error: e.message });
        } else if (e instanceof FileUpdateError) {
            vscode.window.showErrorMessage(e.message);
        } else {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
            vscode.window.showErrorMessage(`An unexpected error occurred: ${errorMessage}`);
        }
    }

    public update() {
        if (!this._panel || !this._document) {
            return;
        }
        try {
            const content = this.workspaceService.readDocument(this._document);
            const storyModel = this.storyYamlService.load(content);
            this.postMessage({ command: 'update', storyFile: storyModel.getStoryFile() });
        } catch (e) {
            if (e instanceof YamlParseError) {
                vscode.window.showErrorMessage(e.message);
                this.postMessage({ command: 'yamlError', error: e.message });
            } else {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while parsing YAML.';
                vscode.window.showErrorMessage(`Error parsing YAML: ${errorMessage}`);
                this.postMessage({ command: 'yamlError', error: errorMessage });
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

    private async _getHtmlForWebview(webview: vscode.Webview): Promise<string> {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'web', 'webview.js'));
        const nonce = getNonce();

        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'dist', 'web', 'index.html');
        const htmlContent = await vscode.workspace.fs.readFile(htmlPath);
        const decodedHtml = new TextDecoder('utf-8').decode(htmlContent);

        return decodedHtml
            .replace('{{nonce}}', nonce)
            .replace('{{scriptUri}}', scriptUri.toString());
    }
}

