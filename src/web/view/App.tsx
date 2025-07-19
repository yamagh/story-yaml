import React, { useState, useEffect, useCallback } from 'react';

// Helper to escape HTML
const escapeHtml = (unsafe: any): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

const vscode = acquireVsCodeApi();

const App = () => {
    const [storyData, setStoryData] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [formState, setFormState] = useState<{
        visible: boolean;
        type: 'epics' | 'stories' | 'tasks' | null;
        parentId: string | null;
    }>({ visible: false, type: null, parentId: null });

    const handleMessage = useCallback((event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
            case 'update':
                setStoryData(message.data);
                break;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        vscode.postMessage({ command: 'ready' }); // Signal that the webview is ready
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const handleAddItem = (item: any) => {
        vscode.postMessage({
            command: 'addItem',
            item: item,
        });
        setFormState({ visible: false, type: null, parentId: null });
    };

    const showForm = (type: 'epics' | 'stories' | 'tasks', parentId: string | null = null) => {
        setSelectedItem(null);
        setFormState({ visible: true, type, parentId });
    };

    const renderTable = () => {
        if (!storyData) return <tbody></tbody>;
        const { epics = [], tasks = [] } = storyData;

        return (
            <tbody>
                {epics.map((epic: any) => (
                    <React.Fragment key={epic.title}>
                        <tr className="epic" onClick={() => setSelectedItem({ ...epic, type: 'Epic' })}>
                            <td>Epic</td>
                            <td>{epic.title} <button onClick={(e) => { e.stopPropagation(); showForm('stories', epic.title); }}>+</button></td>
                            <td></td>
                            <td></td>
                        </tr>
                        {epic.stories?.map((story: any) => (
                            <tr key={story.title} className="story" onClick={() => setSelectedItem({ ...story, type: 'Story' })}>
                                <td>Story</td>
                                <td>{story.title} <button onClick={(e) => { e.stopPropagation(); showForm('tasks', story.title); }}>+</button></td>
                                <td>{story.status}</td>
                                <td>{story.points}</td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
                {tasks.map((task: any) => (
                     <tr key={task.title} className="task" onClick={() => setSelectedItem({ ...task, type: 'Task' })}>
                        <td>Task</td>
                        <td>{task.title}</td>
                        <td>{task.status}</td>
                        <td></td>
                    </tr>
                ))}
            </tbody>
        );
    };

    const renderDetails = () => {
        if (!selectedItem) return <p>Click on an item to see details.</p>;
        // Simplified details view
        return <pre>{JSON.stringify(selectedItem, null, 2)}</pre>;
    };

    const renderForm = () => {
        if (!formState.visible) return null;

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const data: any = {
                title: formData.get('title'),
                description: formData.get('description'),
                status: formData.get('status'),
                'definition of done': (formData.get('dod') as string).split(/\\r\\n|\\n|\\r/).filter(line => line.trim() !== '')
            };

            if (formState.type === 'stories') {
                data.as = formData.get('as');
                data['i want'] = formData.get('i-want');
                data['so that'] = formData.get('so-that');
                data.points = parseInt(formData.get('points') as string, 10) || 0;
                data.sprint = formData.get('sprint');
            }
            
            handleAddItem({
                itemType: formState.type,
                parentId: formState.parentId,
                data: data
            });
        };

        return (
            <form onSubmit={handleSubmit}>
                <h3>Add New {formState.type?.slice(0, -1)}</h3>
                <label>Title: <input name="title" required /></label>
                {formState.type === 'stories' && (
                    <div id="story-fields">
                        <label>As a: <input name="as" /></label>
                        <label>I want: <input name="i-want" /></label>
                        <label>So that: <input name="so-that" /></label>
                        <label>Points: <input name="points" type="number" defaultValue="0" /></label>
                        <label>Sprint: <input name="sprint" /></label>
                    </div>
                )}
                <label>Description: <textarea name="description"></textarea></label>
                <label>Status:
                    <select name="status">
                        <option>ToDo</option>
                        <option>WIP</option>
                        <option>Done</option>
                    </select>
                </label>
                <label>Definition of Done: <textarea name="dod"></textarea></label>
                <button type="submit">Save</button>
                <button type="button" onClick={() => setFormState({ visible: false, type: null, parentId: null })}>Cancel</button>
            </form>
        );
    };

    return (
        <div style={{ display: 'flex' }}>
            <div id="table-container" style={{ flex: 1, paddingRight: '20px' }}>
                <button onClick={() => showForm('epics')}>Add New Epic</button>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Points</th>
                        </tr>
                    </thead>
                    {renderTable()}
                </table>
            </div>
            <div id="details-container" style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
                {formState.visible ? renderForm() : renderDetails()}
            </div>
        </div>
    );
};

export default App;
