import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const vscode = acquireVsCodeApi();

const App = () => {
    const [storyData, setStoryData] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [formState, setFormState] = useState<{
        visible: boolean;
        isEditing: boolean;
        type: 'epics' | 'stories' | 'tasks' | null;
        parentId: string | null;
        itemData?: any;
    }>({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });

    const handleMessage = useCallback((event: MessageEvent) => {
        const message = event.data;
        switch (message.command) {
            case 'update':
                setStoryData(message.data);
                setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
                break;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        vscode.postMessage({ command: 'ready' });
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const handleAddItem = (item: any) => {
        vscode.postMessage({
            command: 'addItem',
            item: item,
        });
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
    };

    const handleUpdateItem = (item: any) => {
        vscode.postMessage({
            command: 'updateItem',
            item: item,
        });
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
    };

    const showForm = (type: 'epics' | 'stories' | 'tasks', parentId: string | null = null, isEditing = false) => {
        const itemData = isEditing ? selectedItem : undefined;
        setSelectedItem(null);
        setFormState({ visible: true, isEditing, type, parentId, itemData });
    };

    const handleSelectRow = (item: any, type: string) => {
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
        setSelectedItem({ ...item, type });
    };

    const renderTable = () => {
        if (!storyData) return <tbody><tr><td colSpan={5}>Loading story data...</td></tr></tbody>;
        const { epics = [], tasks = [] } = storyData;

        if (epics.length === 0 && tasks.length === 0) {
            return <tbody><tr><td colSpan={5}>No items in story.yaml. Click "Add New Epic" to start.</td></tr></tbody>;
        }

        return (
            <tbody>
                {epics.map((epic: any) => (
                    <React.Fragment key={epic.title}>
                        <tr className="epic" onClick={() => handleSelectRow(epic, 'Epic')}>
                            <td>Epic</td>
                            <td>{epic.title}</td>
                            <td></td>
                            <td></td>
                            <td><button className="add-button" onClick={(e) => { e.stopPropagation(); showForm('stories', epic.title); }}>+</button></td>
                        </tr>
                        {epic.stories?.map((story: any) => (
                            <tr key={story.title} className="story" onClick={() => handleSelectRow(story, 'Story')}>
                                <td>Story</td>
                                <td>{story.title}</td>
                                <td>{story.status}</td>
                                <td>{story.points}</td>
                                <td><button className="add-button" onClick={(e) => { e.stopPropagation(); showForm('tasks', story.title); }}>+</button></td>
                            </tr>
                        ))}
                    </React.Fragment>
                ))}
                {tasks.map((task: any) => (
                     <tr key={task.title} className="task" onClick={() => handleSelectRow(task, 'Task')}>
                        <td>Task</td>
                        <td>{task.title}</td>
                        <td>{task.status}</td>
                        <td></td>
                        <td></td>
                    </tr>
                ))}
            </tbody>
        );
    };

    const handleEdit = () => {
        if (selectedItem) {
            const itemType = (selectedItem.type.toLowerCase() + 's') as 'epics' | 'stories' | 'tasks';
            // The form will be populated with selectedItem data
            showForm(itemType, null, true); 
        }
    };

    const renderDetails = () => {
        if (!selectedItem) return <p>Click on an item to see details or add a new item.</p>;

        const { type, title, description, status, points, as, 'i want': iWant, 'so that': soThat, 'definition of done': dod } = selectedItem;

        return (
            <div className="details-view">
                <button onClick={handleEdit}>Edit</button>
                <h3>{type}: {title}</h3>
                {description && <p><strong>Description:</strong> {description}</p>}
                {status && <p><strong>Status:</strong> {status}</p>}
                {type === 'Story' && points !== undefined && <p><strong>Points:</strong> {points}</p>}
                
                {type === 'Story' && (
                    <>
                        <p><strong>As a:</strong> {as}</p>
                        <p><strong>I want:</strong> {iWant}</p>
                        <p><strong>So that:</strong> {soThat}</p>
                    </>
                )}

                {dod && dod.length > 0 && (
                    <div>
                        <strong>Definition of Done:</strong>
                        <ul>
                            {dod.map((item: string, index: number) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderForm = () => {
        if (!formState.visible) return null;

        const { isEditing, itemData } = formState;
        const data = itemData || {};

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const newOrUpdatedData: any = {
                // Title is the key, so it cannot be changed in edit mode.
                title: isEditing ? data.title : formData.get('title'),
                description: formData.get('description'),
                status: formData.get('status'),
                'definition of done': (formData.get('dod') as string).split(/\r\n|\n|\r/).filter(line => line.trim() !== '')
            };

            if (formState.type === 'stories') {
                newOrUpdatedData.as = formData.get('as');
                newOrUpdatedData['i want'] = formData.get('i-want');
                newOrUpdatedData['so that'] = formData.get('so-that');
                newOrUpdatedData.points = parseInt(formData.get('points') as string, 10) || 0;
                newOrUpdatedData.sprint = formData.get('sprint');
            }
            
            if (isEditing) {
                handleUpdateItem({
                    itemType: formState.type,
                    // Pass original title to identify the item
                    originalTitle: data.title,
                    data: newOrUpdatedData
                });
            } else {
                handleAddItem({
                    itemType: formState.type,
                    parentId: formState.parentId,
                    data: newOrUpdatedData
                });
            }
        };

        return (
            <form className="form-container" onSubmit={handleSubmit}>
                <h3>{isEditing ? `Edit ${formState.type?.slice(0, -1)}` : `Add New ${formState.type?.slice(0, -1)}`}</h3>
                <label>Title: <input name="title" required defaultValue={data.title || ''} readOnly={isEditing} /></label>
                {formState.type === 'stories' && (
                    <div id="story-fields">
                        <label>As a: <input name="as" defaultValue={data.as || ''} /></label>
                        <label>I want: <input name="i-want" defaultValue={data['i want'] || ''} /></label>
                        <label>So that: <input name="so-that" defaultValue={data['so that'] || ''} /></label>
                        <label>Points: <input name="points" type="number" defaultValue={data.points || '0'} /></label>
                        <label>Sprint: <input name="sprint" defaultValue={data.sprint || ''} /></label>
                    </div>
                )}
                <label>Description: <textarea name="description" defaultValue={data.description || ''}></textarea></label>
                <label>Status:
                    <select name="status" defaultValue={data.status || 'ToDo'}>
                        <option>ToDo</option>
                        <option>WIP</option>
                        <option>Done</option>
                    </select>
                </label>
                <label>Definition of Done (one per line): <textarea name="dod" rows={3} defaultValue={data['definition of done']?.join('\n') || ''}></textarea></label>
                <div className="form-actions">
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined })}>Cancel</button>
                </div>
            </form>
        );
    };

    return (
        <div className="app-container">
            <div className="panel table-panel">
                <button onClick={() => showForm('epics')}>Add New Epic</button>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Points</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    {renderTable()}
                </table>
            </div>
            <div className="panel details-panel">
                {formState.visible ? renderForm() : renderDetails()}
            </div>
        </div>
    );
};

export default App;
