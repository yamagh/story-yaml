import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

let previewPanel: vscode.WebviewPanel | undefined = undefined;
let previewingDocumentUri: vscode.Uri | undefined = undefined;

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
                // If parent epic not found, it could be considered a root task/story, but current logic adds to tasks.
                // For now, we assume valid parentId for stories.
            }
            break;
        case 'tasks': // This handles root-level tasks
             doc.tasks.push(item.data);
            break;
        case 'subtasks': // This handles sub-tasks nested under stories or tasks
             const findAndAddSubTask = (parents: any[]) => {
                for (const parent of parents) {
                    if (parent.title === item.parentId) {
                        if (!parent['sub tasks']) {
                            parent['sub tasks'] = [];
                        }
                        parent['sub tasks'].push(item.data);
                        return true;
                    }
                    // Also check sub-tasks of stories
                    if (parent.stories) {
                        if(findAndAddSubTask(parent.stories)) return true;
                    }
                }
                return false;
             };
             
             if (!findAndAddSubTask(doc.epics)) {
                findAndAddSubTask(doc.tasks);
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
                    case 'updateItem':
                        await updateItemInStoryFile(message.item);
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

async function updateItemInStoryFile(item: { itemType: string; originalTitle: string; data: any; }) {
    if (!previewingDocumentUri) {
        vscode.window.showErrorMessage('No file is being previewed.');
        return;
    }

    try {
        const rawContent = await vscode.workspace.fs.readFile(previewingDocumentUri);
        const newContent = updateStoryContentForItemUpdate(new TextDecoder().decode(rawContent), item);
        await vscode.workspace.fs.writeFile(previewingDocumentUri, new TextEncoder().encode(newContent));
    } catch (e) {
        vscode.window.showErrorMessage(`Error updating story.yaml: ${(e as Error).message}`);
    }
}

export function updateStoryContentForItemUpdate(content: string, item: { itemType: string; originalTitle: string; data: any; }): string {
    const doc = yaml.load(content) as any;
    if (!doc) return content;

    const findAndReplace = (collection: any[], title: string, newData: any): boolean => {
        if (!collection) return false;
        const itemIndex = collection.findIndex(i => i.title === title);
        if (itemIndex > -1) {
            collection[itemIndex] = { ...collection[itemIndex], ...newData, title: collection[itemIndex].title };
            return true;
        }
        // Recursively search in sub-tasks
        for (const item of collection) {
            if (item['sub tasks'] && findAndReplace(item['sub tasks'], title, newData)) {
                return true;
            }
            if (item.stories && findAndReplace(item.stories, title, newData)) {
                return true;
            }
        }
        return false;
    };

    // Start search from the top-level arrays
    if (!findAndReplace(doc.epics, item.originalTitle, item.data)) {
        findAndReplace(doc.tasks, item.originalTitle, item.data);
    }

    return yaml.dump(doc);
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