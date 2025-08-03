import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { Item, ItemType, Status, Story, Task, StoryFile, Epic, UiItemType } from '../../types';
import { isEpic, isStory, isTask } from '../../typeGuards';

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface StoryDataState {
    selectedItem: (Item & { type: string }) | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formParentId: string | null;
    formItemData?: (Item & { type: string });
    pendingSelection: string | null;
}

interface VscodeApi {
    addItem: (args: { itemType: UiItemType; parentId?: string; values: Omit<Item, 'stories' | 'subtasks'> }) => void;
    updateItem: (args: { id: string; updatedData: Item & { type: string } }) => void;
    deleteItem: (args: { id: string }) => void;
    updateStoryFile: (storyFile: StoryFile) => void;
}

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
        if ((isStory(node) || isTask(node)) && node['subtasks']) {
            const found = findItemAndParent(node['subtasks'], identifier, node);
            if (found) {return found;}
        }
    }
    return null;
};

export const useStoryDataMutations = (
    storyData: StoryFile | null,
    setStoryData: SetState<StoryFile | null>,
    state: StoryDataState,
    setState: SetState<StoryDataState>,
    vscodeApi: VscodeApi
) => {
    const { addItem, updateItem, deleteItem: deleteItemInVscode, updateStoryFile } = vscodeApi;

    const deleteItem = useCallback((id: string) => {
        deleteItemInVscode({ id });
        setState(prevState => ({
            ...prevState,
            selectedItem: null,
            selectedItemParent: null,
            formVisible: false,
        }));
    }, [deleteItemInVscode, setState]);

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
            const updatedItem = { ...formItemData, ...newOrUpdatedData, type: formItemData.type };
            updateItem({ id: formItemData.id!, updatedData: updatedItem });
            setState(prevState => ({
                ...prevState,
                formVisible: false,
                isEditing: false,
                formType: null,
                formParentId: null,
                formItemData: undefined,
                pendingSelection: formItemData.id!,
            }));
        } else {
            const dataToUiMap: { [key in ItemType]: UiItemType } = {
                epics: 'epic',
                stories: 'userStory',
                tasks: 'task',
                subtasks: 'subtask',
            };
            const mappedItemType = dataToUiMap[formType!];
            addItem({ itemType: mappedItemType, parentId: formParentId || undefined, values: newOrUpdatedData as Omit<Item, 'stories' | 'subtasks'> });
            setState(prevState => ({
                ...prevState,
                formVisible: false,
                isEditing: false,
                formType: null,
                formParentId: null,
                formItemData: undefined,
            }));
        }
    }, [state, addItem, updateItem, setState]);

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
                : ('stories' in activeInfo.parent ? (activeInfo.parent as Epic).stories : (activeInfo.parent as Story | Task)['subtasks']);
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
                destinationCollection = targetParent['subtasks'] = targetParent['subtasks'] || [];
            }
            destinationIndex = destinationCollection.length;
        } else {
            destinationCollection = overInfo.parent === null
                ? ('stories' in overInfo.item ? newStoryData.epics : newStoryData.tasks)
                : ('stories' in overInfo.parent ? (overInfo.parent as Epic).stories : (overInfo.parent as Story | Task)['subtasks']);
            if (!destinationCollection) {
                activeParentCollection.splice(activeIndex, 0, movedItem);
                return;
            }
            destinationIndex = destinationCollection.findIndex(i => i.id === over.id);
            const destParentType = overInfo.parent ? (('stories' in overInfo.parent) ? 'epics' : ('subtasks' in overInfo.parent ? 'stories' : 'tasks')) : 'root';
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
    }, [storyData, updateStoryFile, setStoryData]);

    return {
        deleteItem,
        handleFormSubmit,
        handleDragEnd,
        findItemAndParent,
    };
};
