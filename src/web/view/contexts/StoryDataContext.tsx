import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, FC, useMemo } from 'react';
import { useVscode } from '../hooks/useVscode';
import { Item, ItemType, Story, Task, StoryFile, Epic } from '../../types';
import { useStoryDataMutations } from '../hooks/useStoryDataMutations';
import { DragEndEvent } from '@dnd-kit/core';

// Contextの型定義
interface StoryDataContextType {
    storyData: StoryFile | null;
    selectedItem: Item | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formItemData?: Item;
    error: string | null;
    setError: (error: string | null) => void;
    selectItem: (item: Item) => void;
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
    selectedItem: Item | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formParentId: string | null;
    formItemData?: Item;
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
    pendingSelection: null,
};

export const StoryDataProvider: FC<{children: ReactNode}> = ({ children }) => {
    const vscodeApi = useVscode();
    const { storyData: initialStoryData, error, newId, setError } = vscodeApi;
    const [storyData, setStoryData] = useState<StoryFile | null>(initialStoryData);
    const [state, setState] = useState<StoryDataState>(initialState);

    const {
        deleteItem,
        handleFormSubmit,
        handleDragEnd,
        findItemAndParent,
    } = useStoryDataMutations(storyData, setStoryData, state, setState, vscodeApi);

    useEffect(() => {
        setStoryData(initialStoryData);
    }, [initialStoryData]);

    useEffect(() => {
        if (newId) {
            setState(prevState => ({ ...prevState, pendingSelection: newId }));
        }
    }, [newId]);

    const selectItem = useCallback((item: Item) => {
        if (!storyData) {
            setState(prevState => ({
                ...prevState,
                selectedItem: item,
                selectedItemParent: null,
                formVisible: false,
            }));
            return;
        }
        const allTopLevelItems = [...(storyData.epics || []), ...(storyData.tasks || [])];
        const found = findItemAndParent(allTopLevelItems, item.id!);

        setState(prevState => ({
            ...prevState,
            selectedItem: item,
            selectedItemParent: found ? found.parent : null,
            formVisible: false,
        }));
    }, [storyData, findItemAndParent]);

    useEffect(() => {
        if (state.pendingSelection && storyData) {
            const allTopLevelItems = [...(storyData.epics || []), ...(storyData.tasks || [])];
            const found = findItemAndParent(allTopLevelItems, state.pendingSelection);
            if (found) {
                selectItem(found.item);
                setState(prevState => ({ ...prevState, pendingSelection: null }));
            }
        }
    }, [storyData, state.pendingSelection, selectItem, findItemAndParent]);

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
        const typeMap: Record<Item['type'], ItemType> = {
            'Epic': 'epics',
            'Story': 'stories',
            'Task': 'tasks',
            'SubTask': 'subtasks'
        };
        const itemType = typeMap[state.selectedItem.type];
        setState({
            ...initialState,
            formVisible: true,
            isEditing: true,
            formType: itemType,
            formItemData: state.selectedItem,
            selectedItem: null,
            selectedItemParent: null,
        });
    }, [state.selectedItem]);

    const hideForm = useCallback(() => {
        if (state.isEditing && state.formItemData) {
            selectItem(state.formItemData);
        } else if (!state.isEditing && state.formParentId) {
            if (storyData) {
                const allTopLevelItems = [...(storyData.epics || []), ...(storyData.tasks || [])];
                const parentInfo = findItemAndParent(allTopLevelItems, state.formParentId);
                if (parentInfo) {
                    selectItem(parentInfo.item);
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
            }));
        }
    }, [state, storyData, selectItem, findItemAndParent]);

    const value = useMemo(() => ({
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
    }), [
        storyData,
        state.selectedItem,
        state.selectedItemParent,
        state.formVisible,
        state.isEditing,
        state.formType,
        state.formItemData,
        error,
        setError,
        selectItem,
        showAddItemForm,
        showEditItemForm,
        hideForm,
        handleFormSubmit,
        deleteItem,
        handleDragEnd,
    ]);

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
