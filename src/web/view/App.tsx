import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const vscode = acquireVsCodeApi();

// --- Form Components ---

const EpicForm = ({ data, onSubmit, onCancel }: any) => (
    <form className="form-container" onSubmit={onSubmit}>
        <h3>{data.title ? 'Edit Epic' : 'Add New Epic'}</h3>
        <label>Title: <input name="title" required defaultValue={data.title || ''} /></label>
        <label>Description: <textarea name="description" defaultValue={data.description || ''}></textarea></label>
        <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </div>
    </form>
);

const StoryForm = ({ data, onSubmit, onCancel }: any) => (
    <form className="form-container" onSubmit={onSubmit}>
        <h3>{data.title ? 'Edit Story' : 'Add New Story'}</h3>
        <label>Title: <input name="title" required defaultValue={data.title || ''} /></label>
        <label>Description: <textarea name="description" defaultValue={data.description || ''}></textarea></label>
        <label>Status:
            <select name="status" defaultValue={data.status || 'ToDo'}>
                <option>ToDo</option>
                <option>WIP</option>
                <option>Done</option>
            </select>
        </label>
        <div id="story-fields">
            <label>As a: <input name="as" defaultValue={data.as || ''} /></label>
            <label>I want: <input name="i-want" defaultValue={data['i want'] || ''} /></label>
            <label>So that: <input name="so-that" defaultValue={data['so that'] || ''} /></label>
        </div>
        <label>Points: <input name="points" type="number" defaultValue={data.points || '0'} /></label>
        <label>Sprint: <input name="sprint" defaultValue={data.sprint || ''} /></label>
        <label>Definition of Done (one per line): <textarea name="dod" rows={3} defaultValue={data['definition of done']?.join('\n') || ''}></textarea></label>
        <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </div>
    </form>
);

const TaskForm = ({ data, onSubmit, onCancel }: any) => (
    <form className="form-container" onSubmit={onSubmit}>
        <h3>{data.title ? 'Edit Task' : 'Add New Task'}</h3>
        <label>Title: <input name="title" required defaultValue={data.title || ''} /></label>
        <label>Description: <textarea name="description" defaultValue={data.description || ''}></textarea></label>
        <label>Status:
            <select name="status" defaultValue={data.status || 'ToDo'}>
                <option>ToDo</option>
                <option>WIP</option>
                <option>Done</option>
            </select>
        </label>
        <label>Points: <input name="points" type="number" defaultValue={data.points || '0'} /></label>
        <label>Sprint: <input name="sprint" defaultValue={data.sprint || ''} /></label>
        <label>Definition of Done (one per line): <textarea name="dod" rows={3} defaultValue={data['definition of done']?.join('\n') || ''}></textarea></label>
        <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </div>
    </form>
);

const SubtaskForm = ({ data, onSubmit, onCancel }: any) => (
    <form className="form-container" onSubmit={onSubmit}>
        <h3>{data.title ? 'Edit Subtask' : 'Add New Subtask'}</h3>
        <label>Title: <input name="title" required defaultValue={data.title || ''} /></label>
        <label>Description: <textarea name="description" defaultValue={data.description || ''}></textarea></label>
        <label>Status:
            <select name="status" defaultValue={data.status || 'ToDo'}>
                <option>ToDo</option>
                <option>WIP</option>
                <option>Done</option>
            </select>
        </label>
        <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </div>
    </form>
);


// --- Main App Component ---

const App = () => {
    const [storyData, setStoryData] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [formState, setFormState] = useState<{
        visible: boolean;
        isEditing: boolean;
        type: 'epics' | 'stories' | 'tasks' | 'subtasks' | null;
        parentId: string | null;
        itemData?: any;
    }>({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });

    const handleMessage = useCallback((event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'update') {
            setStoryData(message.data);
            setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        vscode.postMessage({ command: 'ready' });
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    const handleAddItem = (item: any) => {
        vscode.postMessage({ command: 'addItem', item });
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
    };

    const handleUpdateItem = (item: any) => {
        vscode.postMessage({ command: 'updateItem', item });
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
    };

    const showForm = (type: 'epics' | 'stories' | 'tasks' | 'subtasks', parentId: string | null = null) => {
        setFormState({ visible: true, isEditing: false, type, parentId, itemData: undefined });
        setSelectedItem(null);
    };

    const handleSelectRow = (item: any, type: string) => {
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
        setSelectedItem({ ...item, type });
    };

    const handleEdit = () => {
        if (selectedItem) {
            const typeStr = selectedItem.type.toLowerCase().replace(' ', '');
            const itemType = (typeStr === 'story' ? 'stories' : typeStr + 's') as 'epics' | 'stories' | 'tasks' | 'subtasks';
            setFormState({
                visible: true,
                isEditing: true,
                type: itemType,
                parentId: null,
                itemData: selectedItem
            });
            setSelectedItem(null);
        }
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { isEditing, type, parentId, itemData } = formState;
        const formData = new FormData(e.target as HTMLFormElement);
        
        const newOrUpdatedData: any = {
            title: formData.get('title'),
            description: formData.get('description'),
            status: formData.get('status'),
        };

        if (type === 'stories' || type === 'tasks') {
             newOrUpdatedData.points = parseInt(formData.get('points') as string, 10) || 0;
             newOrUpdatedData.sprint = formData.get('sprint');
             newOrUpdatedData['definition of done'] = (formData.get('dod') as string || '').split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        }
        
        if (type === 'stories') {
            newOrUpdatedData.as = formData.get('as');
            newOrUpdatedData['i want'] = formData.get('i-want');
            newOrUpdatedData['so that'] = formData.get('so-that');
        }
        
        if (isEditing) {
            handleUpdateItem({ itemType: type, originalTitle: itemData.title, data: newOrUpdatedData });
        } else {
            handleAddItem({ itemType: type, parentId: parentId, data: newOrUpdatedData });
        }
    };

    const handleCancelForm = () => {
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
    };

    const renderTable = () => {
        if (!storyData) return <tbody><tr><td colSpan={5}>Loading story data...</td></tr></tbody>;
        const { epics = [], tasks = [] } = storyData;

        const renderSubTasks = (subTasks: any[]) => {
            if (!subTasks) return null;
            return subTasks.map((sub: any) => (
                <tr key={sub.title} className="subtask" onClick={(e) => { e.stopPropagation(); handleSelectRow(sub, 'SubTask'); }}>
                    <td>SubTask</td>
                    <td>{sub.title}</td>
                    <td>{sub.status}</td>
                    <td></td>
                    <td></td>
                </tr>
            ));
        };

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
                            <React.Fragment key={story.title}>
                                <tr className="story" onClick={() => handleSelectRow(story, 'Story')}>
                                    <td>Story</td>
                                    <td>{story.title}</td>
                                    <td>{story.status}</td>
                                    <td>{story.points}</td>
                                    <td><button className="add-button" onClick={(e) => { e.stopPropagation(); showForm('subtasks', story.title); }}>+</button></td>
                                </tr>
                                {renderSubTasks(story['sub tasks'])}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
                {tasks.map((task: any) => (
                     <React.Fragment key={task.title}>
                        <tr className="task" onClick={() => handleSelectRow(task, 'Task')}>
                            <td>Task</td>
                            <td>{task.title}</td>
                            <td>{task.status}</td>
                            <td>{task.points}</td>
                            <td><button className="add-button" onClick={(e) => { e.stopPropagation(); showForm('subtasks', task.title); }}>+</button></td>
                        </tr>
                        {renderSubTasks(task['sub tasks'])}
                    </React.Fragment>
                ))}
            </tbody>
        );
    };

    const renderDetails = () => {
        if (!selectedItem) return <p>Click on an item to see details or add a new item.</p>;
        const { type, title, description, status, points, as, 'i want': iWant, 'so that': soThat, 'definition of done': dod, sprint } = selectedItem;
        return (
            <div className="details-view">
                <button onClick={handleEdit}>Edit</button>
                <h3>{type}: {title}</h3>
                {description && <p><strong>Description:</strong> {description}</p>}
                {status && <p><strong>Status:</strong> {status}</p>}
                {points !== undefined && <p><strong>Points:</strong> {points}</p>}
                {sprint && <p><strong>Sprint:</strong> {sprint}</p>}
                {type === 'Story' && (<>
                    <p><strong>As a:</strong> {as}</p>
                    <p><strong>I want:</strong> {iWant}</p>
                    <p><strong>So that:</strong> {soThat}</p>
                </>)}
                {dod && dod.length > 0 && (
                    <div>
                        <strong>Definition of Done:</strong>
                        <ul>{dod.map((item: string, index: number) => <li key={index}>{item}</li>)}</ul>
                    </div>
                )}
            </div>
        );
    };

    const renderForm = () => {
        if (!formState.visible) return null;
        const props = {
            data: formState.itemData || {},
            onSubmit: handleFormSubmit,
            onCancel: handleCancelForm
        };
        switch (formState.type) {
            case 'epics': return <EpicForm {...props} />;
            case 'stories': return <StoryForm {...props} />;
            case 'tasks': return <TaskForm {...props} />;
            case 'subtasks': return <SubtaskForm {...props} />;
            default: return null;
        }
    };

    return (
        <div className="app-container">
            <div className="panel table-panel">
                <button onClick={() => showForm('epics')}>Add New Epic</button>
                <button onClick={() => showForm('tasks')}>Add New Task</button>
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
