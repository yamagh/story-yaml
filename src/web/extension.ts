import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { StoryFile, Epic, Story, Task, SubTask } from './types';

let previewPanel: vscode.WebviewPanel | undefined = undefined;
let previewingDocumentUri: vscode.Uri | undefined = undefined;

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';
type ItemData = Epic | Story | Task | SubTask;

export function updateStoryContent(content: string, item: { itemType: ItemType; data: ItemData; parentId?: string }): string {
    const doc = yaml.load(content) as StoryFile || { epics: [], tasks: [] };

    if (!doc.epics) doc.epics = [];
    if (!doc.tasks) doc.tasks = [];

    switch (item.itemType) {
        case 'epics':
            doc.epics.push(item.data as Epic);
            break;
        case 'stories':
            const parentEpic = doc.epics.find((e) => e.title === item.parentId);
            if (parentEpic) {
                if (!parentEpic.stories) {
                    parentEpic.stories = [];
                }
                parentEpic.stories.push(item.data as Story);
            }
            break;
        case 'tasks':
             doc.tasks.push(item.data as Task);
            break;
        case 'subtasks':
             const findAndAddSubTask = (parents: (Epic | Story | Task)[]) => {
                for (const parent of parents) {
                    if (parent.title === item.parentId) {
                        if (!parent['sub tasks']) {
                            parent['sub tasks'] = [];
                        }
                        parent['sub tasks'].push(item.data as SubTask);
                        return true;
                    }
                    if ('stories' in parent && parent.stories) {
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

async function addItemToStoryFile(item: { itemType: ItemType; data: ItemData; parentId?: string }) {
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

async function updateItemInStoryFile(item: { itemType: ItemType; originalTitle: string; data: Partial<ItemData>; }) {
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

export function updateStoryContentForItemUpdate(content: string, item: { itemType: ItemType; originalTitle: string; data: Partial<ItemData>; }): string {
    const doc = yaml.load(content) as StoryFile;
    if (!doc) return content;

    const findAndReplace = (collection: (Epic | Story | Task | SubTask)[], title: string, newData: Partial<ItemData>): boolean => {
        if (!collection) return false;
        const itemIndex = collection.findIndex(i => i.title === title);
        if (itemIndex > -1) {
            collection[itemIndex] = { ...collection[itemIndex], ...newData };
            return true;
        }
        for (const currentItem of collection) {
            if ('stories' in currentItem && currentItem.stories && findAndReplace(currentItem.stories, title, newData)) {
                return true;
            }
            if ('sub tasks' in currentItem && currentItem['sub tasks'] && findAndReplace(currentItem['sub tasks'], title, newData)) {
                return true;
            }
        }
        return false;
    };

    if (!findAndReplace(doc.epics, item.originalTitle, item.data)) {
        findAndReplace(doc.tasks, item.originalTitle, item.data);
    }

    return yaml.dump(doc);
}

function updateWebview(document: vscode.TextDocument, panel: vscode.WebviewPanel) {
    previewingDocumentUri = document.uri;
    try {
        const data = yaml.load(document.getText()) as StoryFile;
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