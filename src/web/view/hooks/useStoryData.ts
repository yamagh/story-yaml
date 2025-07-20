import { useState, useCallback, useEffect } from 'react';
import { useVscode } from './useVscode';
import { Item, ItemType, Status, Story, Task, StoryFile, Epic, SubTask } from '../../types';
import { DragEndEvent } from '@dnd-kit/core';

// 状態の型定義
interface StoryDataState {
    selectedItem: (Item & { type: string }) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formParentId: string | null;
    formItemData?: Item;
}

// 初期状態
const initialState: StoryDataState = {
    selectedItem: null,
    formVisible: false,
    isEditing: false,
    formType: null,
    formParentId: null,
    formItemData: undefined,
};

const findItemAndParent = (
    nodes: (Epic | Task | Story | SubTask)[],
    id: string,
    parent: (Epic | Story | Task) | null = null
): { item: Item; parent: (Epic | Story | Task) | null; type: ItemType } | null => {
    for (const node of nodes) {
        if (node.title === id) {
            let type: ItemType;
            if ('stories' in node) {
                type = 'epics';
            } else if (parent === null) {
                type = 'tasks'; // Top-level task
            } else if ('stories' in parent) {
                type = 'stories';
            } else {
                type = 'subtasks';
            }
            return { item: node, parent, type };
        }
        if ('stories' in node && node.stories) {
            const found = findItemAndParent(node.stories, id, node);
            if (found) return found;
        }
        if ('sub tasks' in node && node['sub tasks']) {
            const found = findItemAndParent(node['sub tasks'], id, node);
            if (found) return found;
        }
    }
    return null;
};


export const useStoryData = () => {
    const { storyData: initialStoryData, addItem, updateItem, deleteItem, updateStoryFile } = useVscode();
    const [storyData, setStoryData] = useState<StoryFile | null>(initialStoryData);
    const [state, setState] = useState<StoryDataState>(initialState);

    useEffect(() => {
        setStoryData(initialStoryData);
    }, [initialStoryData]);

    const selectItem = useCallback((item: Item, type: string) => {
        setState(prevState => ({
            ...prevState,
            selectedItem: { ...item, type },
            formVisible: false,
        }));
    }, []);

    const showAddItemForm = useCallback((type: ItemType, parentId: string | null = null) => {
        setState({
            ...initialState,
            selectedItem: null,
            formVisible: true,
            formType: type,
            formParentId: parentId,
        });
    }, []);

    const showEditItemForm = useCallback(() => {
        if (!state.selectedItem) return;
        const typeStr = state.selectedItem.type.toLowerCase().replace(' ', '');
        const itemType = (typeStr === 'story' ? 'stories' : typeStr + 's') as ItemType;
        setState({
            ...initialState,
            formVisible: true,
            isEditing: true,
            formType: itemType,
            formItemData: state.selectedItem,
            selectedItem: null,
        });
    }, [state.selectedItem]);

    const hideForm = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            formVisible: false,
            isEditing: false,
            formType: null,
            formParentId: null,
            formItemData: undefined,
        }));
    }, []);

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
            updateItem({ originalTitle: formItemData.title, updatedData });
        } else {
            addItem({ itemType: formType!, parentTitle: formParentId || undefined, values: newOrUpdatedData as any });
        }
        hideForm();
    }, [state, addItem, updateItem, hideForm]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || !active.id || !over.id || active.id === over.id) {
            return;
        }

        const newStoryData = JSON.parse(JSON.stringify(storyData)) as StoryFile;
        if (!newStoryData) return;

        const allTopLevelItems: (Epic | Task)[] = [...newStoryData.epics, ...newStoryData.tasks];

        const activeInfo = findItemAndParent(allTopLevelItems, active.id.toString());
        const overInfo = findItemAndParent(allTopLevelItems, over.id.toString());

        if (!activeInfo || !overInfo) return;

        // --- 1. Remove the active item from its original parent ---
        const activeParentCollection: any[] | undefined =
            activeInfo.parent === null
                ? ('stories' in activeInfo.item ? newStoryData.epics : newStoryData.tasks)
                : ('stories' in activeInfo.parent ? (activeInfo.parent as Epic).stories : (activeInfo.parent as Story | Task)['sub tasks']);

        if (!activeParentCollection) return;
        const activeIndex = activeParentCollection.findIndex(i => i.title === active.id);
        if (activeIndex === -1) return;

        const [movedItem] = activeParentCollection.splice(activeIndex, 1);
        if (!movedItem) return;

        // --- 2. Determine destination and insert ---
        const activeType = activeInfo.type;
        const overType = overInfo.type;

        let destinationCollection: any[] | undefined;
        let destinationIndex: number;

        const isDroppingOnContainer = (activeType === 'stories' && overType === 'epics') || (activeType === 'subtasks' && (overType === 'stories' || overType === 'tasks'));

        if (isDroppingOnContainer) {
            // Case A: Dropping ON a container to reparent the item
            if (overType === 'epics') {
                const targetEpic = overInfo.item as Epic;
                destinationCollection = targetEpic.stories = targetEpic.stories || [];
            } else { // overType is 'stories' or 'tasks'
                const targetParent = overInfo.item as Story | Task;
                destinationCollection = targetParent['sub tasks'] = targetParent['sub tasks'] || [];
            }
            destinationIndex = destinationCollection.length; // Append to the end of the container
        } else {
            // Case B: Dropping ON an item to reorder
            destinationCollection = overInfo.parent === null
                ? ('stories' in overInfo.item ? newStoryData.epics : newStoryData.tasks)
                : ('stories' in overInfo.parent ? (overInfo.parent as Epic).stories : (overInfo.parent as Story | Task)['sub tasks']);

            if (!destinationCollection) {
                activeParentCollection.splice(activeIndex, 0, movedItem); // Revert
                return;
            }
            destinationIndex = destinationCollection.findIndex(i => i.title === over.id);

            // --- Validation for reordering ---
            const destParentType = overInfo.parent ? (('stories' in overInfo.parent) ? 'epics' : ('sub tasks' in overInfo.parent ? 'stories' : 'tasks')) : 'root';
            
            if (activeType === 'epics' && destParentType !== 'root') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
            if (activeType === 'tasks' && destParentType !== 'root') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
            if (activeType === 'stories' && destParentType !== 'epics') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
            if (activeType === 'subtasks' && destParentType !== 'stories' && destParentType !== 'tasks') { activeParentCollection.splice(activeIndex, 0, movedItem); return; }
        }

        if (destinationIndex === -1) {
            activeParentCollection.splice(activeIndex, 0, movedItem); // Revert
            return;
        }

        destinationCollection.splice(destinationIndex, 0, movedItem);

        setStoryData(newStoryData);
        updateStoryFile(newStoryData);

    }, [storyData, updateStoryFile]);

    return {
        storyData,
        ...state,
        selectItem,
        showAddItemForm,
        showEditItemForm,
        hideForm,
        handleFormSubmit,
        deleteItem,
        handleDragEnd,
    };
};