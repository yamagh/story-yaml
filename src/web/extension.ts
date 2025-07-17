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

    // Helper to escape single quotes for use in an HTML attribute
    const escapeAttr = (str: string) => str.replace(/'/g, '&apos;');

    let tableRows = '';

    epics.forEach((epic: any, index: number) => {
        const epicDetails = { ...epic, type: 'Epic' };
        // Use single quotes for the attribute, so escape single quotes in the JSON
        const epicData = escapeAttr(JSON.stringify(epicDetails));
        tableRows += `
            <tr class="epic" data-details='${epicData}'>
                <td>Epic</td>
                <td>${epic.title}</td>
                <td></td>
                <td></td>
            </tr>
        `;
        if (epic.stories) {
            epic.stories.forEach((story: any, storyIndex: number) => {
                const storyDetails = { ...story, type: 'Story' };
                const storyData = escapeAttr(JSON.stringify(storyDetails));
                tableRows += `
                    <tr class="story" data-details='${storyData}'>
                        <td>Story</td>
                        <td>${story.title}</td>
                        <td>${story.status}</td>
                        <td>${story.points}</td>
                    </tr>
                `;
            });
        }
    });

    tasks.forEach((task: any, index: number) => {
        const taskDetails = { ...task, type: 'Task' };
        const taskData = escapeAttr(JSON.stringify(taskDetails));
        tableRows += `
            <tr class="task" data-details='${taskData}'>
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
                body { display: flex; font-family: sans-serif; }
                #table-container { flex: 1; padding-right: 20px; }
                #details-container { flex: 1; border-left: 1px solid #ccc; padding-left: 20px; }
                table { width: 100%; border-collapse: collapse; }
                tr { cursor: pointer; }
                tr:hover { background-color: #f5f5f5; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .epic { background-color: #e6f7ff; }
                .story { /* No specific background, relies on hover */ }
                .task { background-color: #f0fff0; }
                h2, h3 { border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 1em; }
                ul { padding-left: 20px; }
                p { margin-block: 0.5em; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
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
                <p>Click on an item in the table to see details here.</p>
            </div>
            <script>
                const detailsContainer = document.getElementById('details-container');

                function showDetails(data) {
                    let detailsHtml = '<h2>' + (data.title || 'Details') + '</h2>';
                    
                    if (data.description) {
                        detailsHtml += '<h3>Description</h3><pre>' + data.description + '</pre>';
                    }
                    if (data.as) {
                        detailsHtml += '<p><b>As a:</b> ' + data.as + '</p>';
                    }
                    if (data['i want']) {
                        detailsHtml += '<p><b>I want:</b> ' + data['i want'] + '</p>';
                    }
                    if (data['so that']) {
                        detailsHtml += '<p><b>So that:</b> ' + data['so that'] + '</p>';
                    }
                    if (data.status) {
                        detailsHtml += '<p><b>Status:</b> ' + data.status + '</p>';
                    }
                    if (data.points) {
                        detailsHtml += '<p><b>Points:</b> ' + data.points + '</p>';
                    }
                    if (data['acceptance criteria'] && data['acceptance criteria'].length > 0) {
                        detailsHtml += '<h3>Acceptance Criteria</h3><ul>';
                        data['acceptance criteria'].forEach(ac => {
                            detailsHtml += '<li>' + ac + '</li>';
                        });
                        detailsHtml += '</ul>';
                    }
                    if (data['sub tasks'] && data['sub tasks'].length > 0) {
                        detailsHtml += '<h3>Sub Tasks</h3><ul>';
                        data['sub tasks'].forEach(st => {
                            detailsHtml += '<li>' + st + '</li>';
                        });
                        detailsHtml += '</ul>';
                    }
                    detailsContainer.innerHTML = detailsHtml;
                }

                document.querySelectorAll('tr[data-details]').forEach(row => {
                    row.addEventListener('click', (event) => {
                        const dataString = event.currentTarget.getAttribute('data-details');
                        try {
                            const data = JSON.parse(dataString);
                            showDetails(data);
                        } catch (e) {
                            console.error('Error parsing data-details attribute:', e);
                            detailsContainer.innerHTML = '<h2>Error</h2><p>Could not parse item details.</p>';
                        }
                    });
                });
            </script>
        </body>
        </html>
    `;
}

export function deactivate() {}