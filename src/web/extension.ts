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
                // If parent epic not found, add as a task for now.
                // A more robust solution might be to show an error.
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
                    parentStory['sub tasks'].push(item.data.title); // Tasks under stories are just titles
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

    context.subscriptions.push(vscode.commands.registerCommand('story-yaml.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from . in a web extension host!');
    }));

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
            updatePreview(event.document, previewPanel);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('story-yaml.addItem', async (item) => {
        await addItemToStoryFile(item);
        if (previewPanel && previewingDocumentUri) {
            const document = await vscode.workspace.openTextDocument(previewingDocumentUri);
            updatePreview(document, previewPanel);
        }
    }));
}

function setupPreviewPanel(context: vscode.ExtensionContext, document: vscode.TextDocument) {
    previewingDocumentUri = document.uri;
    if (previewPanel) {
        previewPanel.reveal(vscode.ViewColumn.Two);
    } else {
        previewPanel = vscode.window.createWebviewPanel(
            'storyYamlPreview',
            'Story YAML Preview',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );

        previewPanel.onDidDispose(() => {
            previewPanel = undefined;
            previewingDocumentUri = undefined;
        }, null, context.subscriptions);

        previewPanel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'addItem':
                        await addItemToStoryFile(message.item);
                        if (previewingDocumentUri) {
                           const updatedDoc = await vscode.workspace.openTextDocument(previewingDocumentUri);
                           updatePreview(updatedDoc, previewPanel!);
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }
    updatePreview(document, previewPanel);
}

async function addItemToStoryFile(item: { itemType: string; data: any; parentId?: string }) {
    if (!previewingDocumentUri) {
        vscode.window.showErrorMessage('No file is being previewed. Please open a story.yaml file and activate the preview.');
        return;
    }

    const storyUri = previewingDocumentUri;

    try {
        const rawContent = await vscode.workspace.fs.readFile(storyUri);
        const decoder = new TextDecoder();
        const currentContent = decoder.decode(rawContent);
        
        const newContent = updateStoryContent(currentContent, item);

        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(storyUri, encoder.encode(newContent));

    } catch (e) {
        vscode.window.showErrorMessage(`Error updating story.yaml: ${(e as Error).message}`);
    }
}

function updatePreview(document: vscode.TextDocument, panel: vscode.WebviewPanel) {
    previewingDocumentUri = document.uri;
    try {
        const content = document.getText();
        const data = yaml.load(content);
        panel.webview.html = getWebviewContent(data, panel.webview);
    } catch (e) {
        panel.webview.html = `<h1>Error parsing YAML</h1><p>${(e as Error).message}</p>`;
    }
}

function getWebviewContent(data: any, webview: vscode.Webview): string {
    const epics = data.epics || [];
    const tasks = data.tasks || [];

    const escapeAttr = (str: string) => str ? str.replace(/'/g, '&apos;') : '';
    const escapeHtml = (unsafe: any): string => {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    };


    let tableRows = '';

    epics.forEach((epic: any, index: number) => {
        const epicDetails = { ...epic, type: 'Epic' };
        const epicData = escapeAttr(JSON.stringify(epicDetails));
        tableRows += `
            <tr class="epic" data-details='${epicData}'>
                <td>Epic</td>
                <td>${escapeHtml(epic.title)} <button class="add-story-btn" data-epic-title="${escapeAttr(epic.title)}">+</button></td>
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
                        <td>${escapeHtml(story.title)} <button class="add-task-btn" data-story-title="${escapeAttr(story.title)}">+</button></td>
                        <td>${escapeHtml(story.status)}</td>
                        <td>${escapeHtml(story.points)}</td>
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
                <td>${escapeHtml(task.title)}</td>
                <td>${escapeHtml(task.status)}</td>
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
                .story { }
                .task { background-color: #f0fff0; }
                h2, h3 { border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 1em; }
                ul { padding-left: 20px; }
                p { margin-block: 0.5em; }
                pre { white-space: pre-wrap; word-wrap: break-word; }
                #add-item-container { margin-bottom: 10px; }
                #add-item-form { display: none; padding: 10px; }
                #add-item-form label { display: block; margin-bottom: 5px; }
                #add-item-form input, #add-item-form textarea, #add-item-form select { width: 95%; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div id="table-container">
                <div id="add-item-container">
                    <button id="add-epic-btn">Add New Epic</button>
                </div>
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
                <div id="details-view">
                    <h2>Details</h2>
                    <p>Click on an item in the table to see details here.</p>
                </div>
                <form id="add-item-form">
                    <h3 id="form-title">Add New Item</h3>
                    <input type="hidden" id="itemType" name="itemType">
                    <input type="hidden" id="parentId" name="parentId">

                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required>

                    <div id="story-fields">
                        <label for="as">As a:</label>
                        <input type="text" id="as" name="as">
                        <label for="i-want">I want:</label>
                        <input type="text" id="i-want" name="i-want">
                        <label for="so-that">So that:</label>
                        <input type="text" id="so-that" name="so-that">
                        <label for="points">Points:</label>
                        <input type="number" id="points" name="points" value="0">
                         <label for="sprint">Sprint:</label>
                        <input type="text" id="sprint" name="sprint">
                    </div>

                    <label for="description">Description:</label>
                    <textarea id="description" name="description" rows="3"></textarea>

                    <label for="status">Status:</label>
                    <select id="status" name="status">
                        <option value="ToDo">ToDo</option>
                        <option value="WIP">WIP</option>
                        <option value="Done">Done</option>
                    </select>

                    <label for="dod">Definition of Done (one per line):</label>
                    <textarea id="dod" name="dod" rows="3"></textarea>

                    <button type="submit">Save</button>
                    <button type="button" id="cancel-add-btn">Cancel</button>
                </form>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const detailsView = document.getElementById('details-view');
                const addEpicBtn = document.getElementById('add-epic-btn');
                const addItemForm = document.getElementById('add-item-form');
                const cancelAddBtn = document.getElementById('cancel-add-btn');
                const formTitle = document.getElementById('form-title');
                const itemTypeInput = document.getElementById('itemType');
                const parentIdInput = document.getElementById('parentId');
                const storyFields = document.getElementById('story-fields');

                function showDefaultDetails() {
                    detailsView.innerHTML = '<h2>Details</h2><p>Click on an item in the table to see details here.</p>';
                    detailsView.style.display = 'block';
                    addItemForm.style.display = 'none';
                }

                function resetAndHideForm() {
                    addItemForm.reset();
                    showDefaultDetails();
                }

                function showForm(type, parentId = '') {
                    formTitle.textContent = 'Add New ' + type.charAt(0).toUpperCase() + type.slice(1, -1); // Epics -> Epic
                    itemTypeInput.value = type;
                    parentIdInput.value = parentId;
                    
                    storyFields.style.display = (type === 'stories') ? 'block' : 'none';

                    detailsView.style.display = 'none';
                    addItemForm.style.display = 'block';
                }

                addEpicBtn.addEventListener('click', () => showForm('epics'));
                cancelAddBtn.addEventListener('click', resetAndHideForm);

                document.querySelectorAll('.add-story-btn').forEach(btn => {
                    btn.addEventListener('click', (event) => {
                        event.stopPropagation(); // prevent row click
                        showForm('stories', btn.dataset.epicTitle);
                    });
                });

                 document.querySelectorAll('.add-task-btn').forEach(btn => {
                    btn.addEventListener('click', (event) => {
                        event.stopPropagation();
                        showForm('tasks', btn.dataset.storyTitle);
                    });
                });

                addItemForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const itemType = itemTypeInput.value;
                    const parentId = parentIdInput.value;
                    const title = document.getElementById('title').value;
                    const description = document.getElementById('description').value;
                    const status = document.getElementById('status').value;
                    const dod = document.getElementById('dod').value.split(/\\r\\n|\\n|\\r/).filter(line => line.trim() !== '');

                    let data = { title, description, status, 'definition of done': dod };

                    if (itemType === 'stories') {
                        Object.assign(data, {
                            as: document.getElementById('as').value,
                            'i want': document.getElementById('i-want').value,
                            'so that': document.getElementById('so-that').value,
                            points: parseInt(document.getElementById('points').value, 10) || 0,
                            sprint: document.getElementById('sprint').value,
                        });
                    }

                    vscode.postMessage({
                        command: 'addItem',
                        item: { itemType, parentId, data }
                    });

                    resetAndHideForm();
                });

                function showDetails(data) {
                    let detailsHtml = '<h2>' + escapeHtml(data.title || 'Details') + '</h2>';
                    
                    if (data.description) {
                        detailsHtml += '<h3>Description</h3><pre>' + escapeHtml(data.description) + '</pre>';
                    }
                    if (data.as) {
                        detailsHtml += '<p><b>As a:</b> ' + escapeHtml(data.as) + '</p>';
                    }
                    if (data['i want']) {
                        detailsHtml += '<p><b>I want:</b> ' + escapeHtml(data['i want']) + '</p>';
                    }
                    if (data['so that']) {
                        detailsHtml += '<p><b>So that:</b> ' + escapeHtml(data['so that']) + '</p>';
                    }
                    if (data.status) {
                        detailsHtml += '<p><b>Status:</b> ' + escapeHtml(data.status) + '</p>';
                    }
                    if (data.points) {
                        detailsHtml += '<p><b>Points:</b> ' + escapeHtml(data.points) + '</p>';
                    }
                    if (data['definition of done'] && data['definition of done'].length > 0) {
                        detailsHtml += '<h3>Definition of Done</h3><ul>';
                        data['definition of done'].forEach(ac => {
                            detailsHtml += '<li>' + escapeHtml(ac) + '</li>';
                        });
                        detailsHtml += '</ul>';
                    }
                    if (data['sub tasks'] && data['sub tasks'].length > 0) {
                        detailsHtml += '<h3>Sub Tasks</h3><ul>';
                        data['sub tasks'].forEach(st => {
                            detailsHtml += '<li>' + escapeHtml(st) + '</li>';
                        });
                        detailsHtml += '</ul>';
                    }
                    detailsView.innerHTML = detailsHtml;
                    detailsView.style.display = 'block';
                    addItemForm.style.display = 'none';
                }

                document.querySelectorAll('tr[data-details]').forEach(row => {
                    row.addEventListener('click', (event) => {
                        const dataString = event.currentTarget.getAttribute('data-details');
                        try {
                            const data = JSON.parse(dataString);
                            showDetails(data);
                        } catch (e) {
                            console.error('Error parsing data-details attribute:', e);
                            detailsView.innerHTML = '<h2>Error</h2><p>Could not parse item details.</p>';
                        }
                    });
                });

                // Initial state
                showDefaultDetails();
            </script>
        </body>
        </html>
    `;
}

export function deactivate() {}