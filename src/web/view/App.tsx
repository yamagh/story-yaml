import React, { useState, useCallback } from 'react';
import './App.css';
import { Epic, Story, Task, SubTask, Status } from '../types';
import { useVscode } from './hooks/useVscode';
import { ItemForm } from './components/ItemForm';
import { ItemDetails } from './components/ItemDetails';
import { StoryTable } from './components/StoryTable';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';
type Item = Epic | Story | Task | SubTask;
type SelectedItem = (Epic | Story | Task | SubTask) & { type: string };

interface FormState {
    visible: boolean;
    isEditing: boolean;
    type: ItemType | null;
    parentId: string | null;
    itemData?: Item;
}

const App = () => {
    const { storyData, addItem, updateItem } = useVscode();
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [formState, setFormState] = useState<FormState>({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });

    const resetFormState = useCallback(() => {
        setFormState({ visible: false, isEditing: false, type: null, parentId: null, itemData: undefined });
    }, []);

    const handleAddItem = (item: { itemType: ItemType | null; parentId: string | null; data: Partial<Item> }) => {
        addItem(item);
        resetFormState();
    };

    const handleUpdateItem = (item: { itemType: ItemType | null; originalTitle: string; data: Partial<Item> }) => {
        updateItem(item);
        resetFormState();
    };

    const showForm = (type: ItemType, parentId: string | null = null) => {
        setFormState({ visible: true, isEditing: false, type, parentId, itemData: undefined });
        setSelectedItem(null);
    };

    const handleSelectRow = (item: Item, type: string) => {
        resetFormState();
        setSelectedItem({ ...item, type });
    };

    const handleEdit = () => {
        if (selectedItem) {
            const typeStr = selectedItem.type.toLowerCase().replace(' ', '');
            const itemType = (typeStr === 'story' ? 'stories' : typeStr + 's') as ItemType;
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
        
        const newOrUpdatedData: Partial<Item> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
        };

        if (type === 'stories' || type === 'tasks' || type === 'subtasks') {
            (newOrUpdatedData as Task).status = formData.get('status') as Status;
        }

        if (type === 'stories' || type === 'tasks') {
             (newOrUpdatedData as Task).points = parseInt(formData.get('points') as string, 10) || 0;
             (newOrUpdatedData as Task).sprint = formData.get('sprint') as string;
             (newOrUpdatedData as Task)['definition of done'] = (formData.get('dod') as string || '').split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        }
        
        if (type === 'stories') {
            (newOrUpdatedData as Story).as = formData.get('as') as string;
            (newOrUpdatedData as Story)['i want'] = formData.get('i-want') as string;
            (newOrUpdatedData as Story)['so that'] = formData.get('so-that') as string;
        }
        
        if (isEditing && itemData) {
            handleUpdateItem({ itemType: type, originalTitle: itemData.title!, data: newOrUpdatedData });
        } else {
            handleAddItem({ itemType: type, parentId: parentId, data: newOrUpdatedData });
        }
    };

    const handleCancelForm = () => {
        resetFormState();
    };

    const renderForm = () => {
        if (!formState.visible || !formState.type) return null;
        return (
            <ItemForm
                formType={formState.type}
                data={formState.itemData || {}}
                onSubmit={handleFormSubmit}
                onCancel={handleCancelForm}
            />
        );
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
                    <StoryTable
                        storyData={storyData}
                        onSelectRow={handleSelectRow}
                        onShowForm={showForm}
                    />
                </table>
            </div>
            <div className="panel details-panel">
                {formState.visible ? renderForm() : <ItemDetails selectedItem={selectedItem} onEdit={handleEdit} />}
            </div>
        </div>
    );
};

export default App;




