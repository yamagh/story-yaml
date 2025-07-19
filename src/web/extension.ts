import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

let previewPanel: vscode.WebviewPanel | undefined = undefined;
let previewingDocumentUri: vscode.Uri | undefined = undefined;

// Exported for testing
export function updateStoryContent(content: string, item: { itemType: string; data: any; parentId?: string }): string {
    const doc = yaml.load(content) as any || { epics: [], tasks: [] };

    if (!doc.epics) doc.epics = [];
    if (!doc.tasks) doc.tasks = [];

    switch (item.itemType) {
        case 'epics':
            doc.epics.push(item.data);
            break;
        case 'stories':
            const parentEpic = doc.epics.find((e: any) => e.title === item.parentId);
            if (parentEpic) {
                if (!parentEpic.stories) {
                    parentEpic.stories = [];
                }
                parentEpic.stories.push(item.data);
            } else {
                doc.tasks.push(item.data);
            }
            break;
        case 'tasks':
             const parentStoryEpic = doc.epics.find((e: any) => e.stories && e.stories.find((s:any) => s.title === item.parentId));
             if (parentStoryEpic) {
                const parentStory = parentStoryEpic.stories.find((s: any) => s.title === item.parentId);
                if(parentStory){
                    if (!parentStory['sub tasks']) {
                        parentStory['sub tasks'] = [];
                    }
                    parentStory['sub tasks'].push(item.data.title);
                }
             } else {
                 doc.tasks.push(item.data);
             }
            break;
    }

    return yaml.dump(doc);
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "story-yaml" is now active in the web extension host!');

    context.subscriptions.push(vscode.commands.registerCommand('story-yaml.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        setupPreviewPanel(context, editor.document);
    }));

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (previewPanel && event.document.uri === previewingDocumentUri) {
            updateWebview(event.document, previewPanel);
        }
    }));
}

function setupPreviewPanel(context: vscode.ExtensionContext, document: vscode.TextDocument) {
    previewingDocumentUri = document.uri;
    if (previewPanel) {
        previewPanel.reveal(vscode.ViewColumn.Two);
        updateWebview(document, previewPanel);
    } else {
        previewPanel = vscode.window.createWebviewPanel(
            'storyYamlPreview',
            'Story YAML Preview',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'web')]
            }
        );

        previewPanel.webview.html = getWebviewContent(previewPanel.webview, context.extensionUri);

        previewPanel.onDidDispose(() => {
            previewPanel = undefined;
            previewingDocumentUri = undefined;
        }, null, context.subscriptions);

        previewPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'ready':
                        if (previewingDocumentUri) {
                            const doc = await vscode.workspace.openTextDocument(previewingDocumentUri);
                            updateWebview(doc, previewPanel!);
                        }
                        return;
                    case 'addItem':
                        await addItemToStoryFile(message.item);
                        if (previewingDocumentUri) {
                           const updatedDoc = await vscode.workspace.openTextDocument(previewingDocumentUri);
                           updateWebview(updatedDoc, previewPanel!);
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }
}

async function addItemToStoryFile(item: { itemType: string; data: any; parentId?: string }) {
    if (!previewingDocumentUri) {
        vscode.window.showErrorMessage('No file is being previewed.');
        return;
    }

    try {
        const rawContent = await vscode.workspace.fs.readFile(previewingDocumentUri);
        const newContent = updateStoryContent(new TextDecoder().decode(rawContent), item);
        await vscode.workspace.fs.writeFile(previewingDocumentUri, new TextEncoder().encode(newContent));
    } catch (e) {
        vscode.window.showErrorMessage(`Error updating story.yaml: ${(e as Error).message}`);
    }
}

function updateWebview(document: vscode.TextDocument, panel: vscode.WebviewPanel) {
    previewingDocumentUri = document.uri;
    try {
        const data = yaml.load(document.getText());
        panel.webview.postMessage({ command: 'update', data });
    } catch (e) {
        // Handle YAML parsing error if needed
    }
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'web', 'webview.js'));

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
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
}

export function deactivate() {}