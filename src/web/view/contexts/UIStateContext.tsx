import React, { createContext, useContext, useState, useCallback, ReactNode, FC, useMemo, useEffect } from 'react';
import { Item, ItemType, Story, Task, Epic, AddItemValues, UpdateItemValues } from '../../types';
import { useStoryData } from './StoryDataContext';

// UI状態コンテキストの型定義
interface UIStateContextType {
    selectedItem: Item | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formItemData?: Item;
    formParentId: string | null;
    selectItem: (item: Item) => void;
    showAddItemForm: (type: ItemType, parentId?: string | null) => void;
    showEditItemForm: () => void;
    hideForm: () => void;
    handleFormSubmit: (e: React.FormEvent) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// 状態の型定義
interface UIState {
    selectedItem: Item | null;
    selectedItemParent: (Epic | Story | Task) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formParentId: string | null;
    formItemData?: Item;
}

// 初期状態
const initialState: UIState = {
    selectedItem: null,
    selectedItemParent: null,
    formVisible: false,
    isEditing: false,
    formType: null,
    formParentId: null,
    formItemData: undefined,
};

export const UIStateProvider: FC<{children: ReactNode}> = ({ children }) => {
    const { state: storyState, dispatch: storyDispatch, findItemAndParent } = useStoryData();
    const { storyData, lastAddedItem } = storyState;
    const [state, setState] = useState<UIState>(initialState);

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
        if (lastAddedItem) {
            selectItem(lastAddedItem);
            storyDispatch({ type: 'CLEAR_LAST_ADDED_ITEM' });
        }
    }, [lastAddedItem, selectItem, storyDispatch]);

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
        if (!state.selectedItem) { return; }
        const itemToEdit = state.selectedItem;
        const typeMap: Record<Item['type'], ItemType> = {
            'Epic': 'epics',
            'Story': 'stories',
            'Task': 'tasks',
            'SubTask': 'subtasks'
        };
        const itemType = typeMap[itemToEdit.type];
        setState(prevState => ({
            ...prevState,
            formVisible: true,
            isEditing: true,
            formType: itemType,
            formItemData: itemToEdit,
            selectedItem: null,
            selectedItemParent: null,
        }));
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

    const handleFormSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!state.formType) return;

        const formData = new FormData(e.target as HTMLFormElement);
        const values = Object.fromEntries(formData.entries());

        if (state.isEditing && state.formItemData) {
            storyDispatch({ type: 'UPDATE_ITEM', payload: { id: state.formItemData.id!, updatedData: values as UpdateItemValues } });
            hideForm();
        } else {
            storyDispatch({ type: 'ADD_ITEM', payload: { itemType: state.formType, values: values as AddItemValues, parentId: state.formParentId || undefined } });
        }
    }, [state, storyDispatch, hideForm]);

    const value = useMemo(() => ({
        ...state,
        selectItem,
        showAddItemForm,
        showEditItemForm,
        hideForm,
        handleFormSubmit,
    }), [state, selectItem, showAddItemForm, showEditItemForm, hideForm, handleFormSubmit]);

    return (
        <UIStateContext.Provider value={value}>
            {children}
        </UIStateContext.Provider>
    );
};

export const useUIState = (): UIStateContextType => {
    const context = useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};
