import React, { useState, useCallback, useReducer } from 'react';
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

type FormAction =
    | { type: 'SHOW_ADD_FORM'; payload: { type: ItemType; parentId: string | null } }
    | { type: 'SHOW_EDIT_FORM'; payload: { type: ItemType; itemData: Item } }
    | { type: 'HIDE_FORM' };

const initialFormState: FormState = {
    visible: false,
    isEditing: false,
    type: null,
    parentId: null,
    itemData: undefined,
};

function formReducer(state: FormState, action: FormAction): FormState {
    switch (action.type) {
        case 'SHOW_ADD_FORM':
            return {
                ...initialFormState,
                visible: true,
                type: action.payload.type,
                parentId: action.payload.parentId,
            };
        case 'SHOW_EDIT_FORM':
            return {
                ...initialFormState,
                visible: true,
                isEditing: true,
                type: action.payload.type,
                itemData: action.payload.itemData,
            };
        case 'HIDE_FORM':
            return initialFormState;
        default:
            return state;
    }
}

const App = () => {
    const { storyData, addItem, updateItem } = useVscode();
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const [formState, dispatchFormAction] = useReducer(formReducer, initialFormState);

    const handleAddItem = useCallback((item: { itemType: ItemType | null; parentId: string | null; data: Partial<Item> }) => {
        addItem(item);
        dispatchFormAction({ type: 'HIDE_FORM' });
    }, [addItem]);

    const handleUpdateItem = useCallback((item: { itemType: ItemType | null; originalTitle: string; data: Partial<Item> }) => {
        updateItem(item);
        dispatchFormAction({ type: 'HIDE_FORM' });
    }, [updateItem]);

    const showForm = useCallback((type: ItemType, parentId: string | null = null) => {
        dispatchFormAction({ type: 'SHOW_ADD_FORM', payload: { type, parentId } });
        setSelectedItem(null);
    }, []);

    const handleSelectRow = useCallback((item: Item, type: string) => {
        dispatchFormAction({ type: 'HIDE_FORM' });
        setSelectedItem({ ...item, type });
    }, []);

    const handleEdit = useCallback(() => {
        if (selectedItem) {
            const typeStr = selectedItem.type.toLowerCase().replace(' ', '');
            const itemType = (typeStr === 'story' ? 'stories' : typeStr + 's') as ItemType;
            dispatchFormAction({ type: 'SHOW_EDIT_FORM', payload: { type: itemType, itemData: selectedItem } });
            setSelectedItem(null);
        }
    }, [selectedItem]);
    
    const handleFormSubmit = useCallback((e: React.FormEvent) => {
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
    }, [formState, handleAddItem, handleUpdateItem]);

    const handleCancelForm = useCallback(() => {
        dispatchFormAction({ type: 'HIDE_FORM' });
    }, []);

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




