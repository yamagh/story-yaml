import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "story-yaml" is now active in the web extension host!');

    let disposable = vscode.commands.registerCommand('story-yaml.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from . in a web extension host!');
    });

    context.subscriptions.push(disposable);

    let previewPanel: vscode.WebviewPanel | undefined = undefined;

    let previewCommand = vscode.commands.registerCommand('story-yaml.preview', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        if (previewPanel) {
            previewPanel.reveal(vscode.ViewColumn.Two);
        } else {
            previewPanel = vscode.window.createWebviewPanel(
                'storyYamlPreview',
                'Story YAML Preview',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true
                }
            );

            previewPanel.onDidDispose(() => {
                previewPanel = undefined;
            }, null, context.subscriptions);
        }

        updatePreview(editor.document, previewPanel);
    });

    context.subscriptions.push(previewCommand);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (previewPanel && event.document === vscode.window.activeTextEditor?.document) {
            updatePreview(event.document, previewPanel);
        }
    });
}

function updatePreview(document: vscode.TextDocument, panel: vscode.WebviewPanel) {
    try {
        const content = document.getText();
        const data = yaml.load(content);
        panel.webview.html = getWebviewContent(data);
    } catch (e) {
        panel.webview.html = `<h1>Error parsing YAML</h1><p>${(e as Error).message}</p>`;
    }
}

function getWebviewContent(data: any): string {
    const epics = data.epics || [];
    const tasks = data.tasks || [];

    let tableRows = '';

    epics.forEach((epic: any) => {
        tableRows += `
            <tr class="epic">
                <td>Epic</td>
                <td>${epic.title}</td>
                <td></td>
                <td></td>
            </tr>
        `;
        if (epic.stories) {
            epic.stories.forEach((story: any) => {
                tableRows += `
                    <tr class="story">
                        <td>Story</td>
                        <td>${story.title}</td>
                        <td>${story.status}</td>
                        <td>${story.points}</td>
                    </tr>
                `;
            });
        }
    });

    tasks.forEach((task: any) => {
        tableRows += `
            <tr class="task">
                <td>Task</td>
                <td>${task.title}</td>
                <td>${task.status}</td>
                <td></td>
            </tr>
        `;
    });

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Story YAML Preview</title>
            <style>
                body {
                    display: flex;
                }
                #table-container {
                    flex: 1;
                    padding-right: 20px;
                }
                #details-container {
                    flex: 1;
                    border-left: 1px solid #ccc;
                    padding-left: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .epic {
                    background-color: #e6f7ff;
                }
                .story {
                    padding-left: 20px;
                }
                .task {
                    background-color: #f0fff0;
                }
            </style>
        </head>
        <body>
            <div id="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
            <div id="details-container">
                <h2>Details</h2>
                <p>Click on a story to see details here.</p>
            </div>
        </body>
        </html>
    `;
}

export function deactivate() {}