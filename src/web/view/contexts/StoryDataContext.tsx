import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, FC } from 'react';
import { useVscode } from '../hooks/useVscode';
import { Item, ItemType, Status, Story, Task, StoryFile, Epic } from '../../types';
import { DragEndEvent } from '@dnd-kit/core';
import { isEpic, isStory, isTask } from '../../typeGuards';

// Contextの型定義
interface StoryDataContextType {
    storyData: StoryFile | null;
    selectedItem: (Item & { type: string }) | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formItemData?: Item;
    error: string | null;
    setError: (error: string | null) => void;
    selectItem: (item: Item, type: string) => void;
    showAddItemForm: (type: ItemType, parentId?: string | null) => void;
    showEditItemForm: () => void;
    hideForm: () => void;
    handleFormSubmit: (e: React.FormEvent) => void;
    deleteItem: (id: string) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}

const StoryDataContext = createContext<StoryDataContextType | undefined>(undefined);

// 状態の型定義
interface StoryDataState {
    selectedItem: (Item & { type: string }) | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formParentId: string | null;
    formItemData?: (Item & { type: string });
    formItemParentData?: (Epic | Story | Task) | null;
    pendingSelection: string | null;
}

// 初期状態
const initialState: StoryDataState = {
    selectedItem: null,
    selectedItemParent: null,
    formVisible: false,
    isEditing: false,
    formType: null,
    formParentId: null,
    formItemData: undefined,
    formItemParentData: undefined,
    pendingSelection: null,
};

const findItemAndParent = (
    nodes: Item[],
    identifier: string,
    parent: (Epic | Story | Task) | null = null
): { item: Item; parent: (Epic | Story | Task) | null; type: ItemType } | null => {
    for (const node of nodes) {
        if (node.id === identifier || node.title === identifier) {
            let type: ItemType;
            if (isEpic(node)) {
                type = 'epics';
            } else if (parent === null) {
                type = 'tasks'; // Top-level task
            } else if (isEpic(parent)) {
                type = 'stories';
            } else {
                type = 'subtasks';
            }
            return { item: node, parent, type };
        }
        if (isEpic(node) && node.stories) {
            const found = findItemAndParent(node.stories, identifier, node);
            if (found) {return found;}
        }
        if ((isStory(node) || isTask(node)) && node['sub tasks']) {
            const found = findItemAndParent(node['sub tasks'], identifier, node);
            if (found) {return found;}
        }
    }
    return null;
};

export const StoryDataProvider: FC<{children: ReactNode}> = ({ children }) => {
    const { storyData: initialStoryData, error, setError, addItem, updateItem, deleteItem: deleteItemInVscode, updateStoryFile } = useVscode();
    const [storyData, setStoryData] = useState<StoryFile | null>(initialStoryData);
    const [state, setState] = useState<StoryDataState>(initialState);

    useEffect(() => {
        setStoryData(initialStoryData);
    }, [initialStoryData]);

    const deleteItem = useCallback((id: string) => {
        deleteItemInVscode({ id });
        setState(prevState => ({
            ...prevState,
            selectedItem: null,
            selectedItemParent: null,
            formVisible: false,
        }));
    }, [deleteItemInVscode]);

    const selectItem = useCallback((item: Item, type: string) => {
        if (!storyData) {
            setState(prevState => ({
                ...prevState,
                selectedItem: { ...item, type },
                selectedItemParent: null,
                formVisible: false,
            }));
            return;
        }
        const allTopLevelItems = [...(storyData.epics || []), ...(storyData.tasks || [])];
        const found = findItemAndParent(allTopLevelItems, item.id!);

        setState(prevState => ({
            ...prevState,
            selectedItem: { ...item, type },
            selectedItemParent: found ? found.parent : null,
            formVisible: false,
        }));
    }, [storyData]);

    const showAddItemForm = useCallback((type: ItemType, parentId: string | null = null) => {
        setState({
            ...initialState,
            selectedItem: null,
            selectedItemParent: null,
            formVisible: true,
            formType: type,
            formParentId: parentId,
        });
    }, []);

    const showEditItemForm = useCallback(() => {
        if (!state.selectedItem) {return;}
        const typeStr = state.selectedItem.type.toLowerCase().replace(' ', '');
        const itemType = (typeStr === 'story' ? 'stories' : typeStr + 's') as ItemType;
        setState({
            ...initialState,
            formVisible: true,
            isEditing: true,
            formType: itemType,
            formItemData: state.selectedItem,
            formItemParentData: state.selectedItemParent,
            selectedItem: null,
            selectedItemParent: null,
        });
    }, [state.selectedItem, state.selectedItemParent]);

    const hideForm = useCallback(() => {
        if (state.isEditing && state.formItemData) {
            const itemType = state.formItemData.type;
            selectItem(state.formItemData, itemType);
        } else if (!state.isEditing && state.formParentId) {
            if (storyData) {
                const allTopLevelItems = [...(storyData.epics || []), ...(storyData.tasks || [])];
                const parentInfo = findItemAndParent(allTopLevelItems, state.formParentId);
                if (parentInfo) {
                    const parentTypeString = parentInfo.type.slice(0, -1);
                    const type = parentTypeString.charAt(0).toUpperCase() + parentTypeString.slice(1);
                    selectItem(parentInfo.item, type);
                }
            }
        } else {
            setState(prevState => ({
                ...prevState,
                formVisible: false,
                isEditing: false,
                formType: null,
                formParentId: null,
                formItemData: undefined,
                formItemParentData: undefined,
            }));
        }
    }, [state, storyData, selectItem]);

    const handleFormSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const { isEditing, formType, formParentId, formItemData } = state;
        const formData = new FormData(e.target as HTMLFormElement);

        const newOrUpdatedData: Partial<Item> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
        };

        if (formType === 'stories' || formType === 'tasks' || formType === 'subtasks') {
            (newOrUpdatedData as Task).status = formData.get('status') as Status;
        }
        if (formType === 'stories' || formType === 'tasks') {
            (newOrUpdatedData as Task).points = parseInt(formData.get('points') as string, 10) || 0;
            (newOrUpdatedData as Task).sprint = formData.get('sprint') as string;
            (newOrUpdatedData as Task)['definition of done'] = (formData.get('dod') as string || '').split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        }
        if (formType === 'stories') {
            (newOrUpdatedData as Story).as = formData.get('as') as string;
            (newOrUpdatedData as Story)['i want'] = formData.get('i-want') as string;
            (newOrUpdatedData as Story)['so that'] = formData.get('so-that') as string;
        }

        if (isEditing && formItemData) {
            const updatedData = { ...formItemData, ...newOrUpdatedData, type: formType! };
            updateItem({ id: formItemData.id!, updatedData });
            setState(prevState => ({
                ...prevState,
                pendingSelection: formItemData.id!,
            }));
        } else {
            addItem({ itemType: formType!, parentId: formParentId || undefined, values: newOrUpdatedData as Omit<Item, 'stories' | 'sub tasks'> });
            setState(prevState => ({
                ...prevState,
                pendingSelection: newOrUpdatedData.title || null,
            }));
        }

        setState(prevState => ({
            ...prevState,
            formVisible: false,
            isEditing: false,
            formType: null,
            formParentId: null,
            formItemData: undefined,
            formItemParentData: undefined,
        }));

    }, [state, addItem, updateItem]);

    useEffect(() => {
        if (state.pendingSelection && storyData) {
            const allTopLevelItems = [...(storyData.epics || []), ...(storyData.tasks || [])];
            const found = findItemAndParent(allTopLevelItems, state.pendingSelection);
            if (found) {
                const itemTypeString = found.type.slice(0, -1);
                const type = itemTypeString.charAt(0).toUpperCase() + itemTypeString.slice(1);
                selectItem(found.item, type);
                setState(prevState => ({ ...prevState, pendingSelection: null }));
            }
        }
    }, [storyData, state.pendingSelection, selectItem]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !active.id || !over.id || active.id === over.id) return;
        const newStoryData = JSON.parse(JSON.stringify(storyData)) as StoryFile;
        if (!newStoryData) return;
        const allTopLevelItems: (Epic | Task)[] = [...(newStoryData.epics || []), ...(newStoryData.tasks || [])];
        const activeInfo = findItemAndParent(allTopLevelItems, active.id.toString());
        const overInfo = findItemAndParent(allTopLevelItems, over.id.toString());
        if (!activeInfo || !overInfo) return;

        const activeParentCollection: Item[] | undefined =
            activeInfo.parent === null
                ? ('stories' in activeInfo.item ? newStoryData.epics : newStoryData.tasks)
                : ('stories' in activeInfo.parent ? (activeInfo.parent as Epic).stories : (activeInfo.parent as Story | Task)['sub tasks']);
        if (!activeParentCollection) return;
        const activeIndex = activeParentCollection.findIndex(i => i.id === active.id);
        if (activeIndex === -1) return;
        const [movedItem] = activeParentCollection.splice(activeIndex, 1);
        if (!movedItem) return;

        const activeType = activeInfo.type;
        const overType = overInfo.type;
        let destinationCollection: Item[] | undefined;
        let destinationIndex: number;
        const isDroppingOnContainer = (activeType === 'stories' && overType === 'epics') || (activeType === 'subtasks' && (overType === 'stories' || overType === 'tasks'));

        if (isDroppingOnContainer) {
            if (overType === 'epics') {
                const targetEpic = overInfo.item as Epic;
                destinationCollection = targetEpic.stories = targetEpic.stories || [];
            } else {
                const targetParent = overInfo.item as Story | Task;
                destinationCollection = targetParent['sub tasks'] = targetParent['sub tasks'] || [];
            }
            destinationIndex = destinationCollection.length;
        } else {
            destinationCollection = overInfo.parent === null
                ? ('stories' in overInfo.item ? newStoryData.epics : newStoryData.tasks)
                : ('stories' in overInfo.parent ? (overInfo.parent as Epic).stories : (overInfo.parent as Story | Task)['sub tasks']);
            if (!destinationCollection) {
                activeParentCollection.splice(activeIndex, 0, movedItem);
                return;
            }
            destinationIndex = destinationCollection.findIndex(i => i.id === over.id);
            const destParentType = overInfo.parent ? (('stories' in overInfo.parent) ? 'epics' : ('sub tasks' in overInfo.parent ? 'stories' : 'tasks')) : 'root';
            if (activeType === 'epics' && destParentType !== 'root') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
            if (activeType === 'tasks' && destParentType !== 'root') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
            if (activeType === 'stories' && destParentType !== 'epics') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
            if (activeType === 'subtasks' && destParentType !== 'stories' && destParentType !== 'tasks') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
        }

        if (destinationIndex === -1) {
            activeParentCollection.splice(activeIndex, 0, movedItem);
            return;
        }
        destinationCollection.splice(destinationIndex, 0, movedItem);
        setStoryData(newStoryData);
        updateStoryFile(newStoryData);
    }, [storyData, updateStoryFile]);

    const value = {
        storyData,
        selectedItem: state.selectedItem,
        selectedItemParent: state.selectedItemParent,
        formVisible: state.formVisible,
        isEditing: state.isEditing,
        formType: state.formType,
        formItemData: state.formItemData,
        error,
        setError,
        selectItem,
        showAddItemForm,
        showEditItemForm,
        hideForm,
        handleFormSubmit,
        deleteItem,
        handleDragEnd,
    };

    return (
        <StoryDataContext.Provider value={value}>
            {children}
        </StoryDataContext.Provider>
    );
};

export const useStoryData = (): StoryDataContextType => {
    const context = useContext(StoryDataContext);
    if (context === undefined) {
        throw new Error('useStoryData must be used within a StoryDataProvider');
    }
    return context;
};