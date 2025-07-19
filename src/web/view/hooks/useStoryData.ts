import { useReducer, useCallback } from 'react';
import { useVscode } from './useVscode';
import { Item, ItemType, Status, Story, Task } from '../../types';

// 状態の型定義
interface StoryDataState {
    selectedItem: (Item & { type: string }) | null;
    formVisible: boolean;
    isEditing: boolean;
    formType: ItemType | null;
    formParentId: string | null;
    formItemData?: Item;
}

// アクションの型定義
type StoryDataAction =
    | { type: 'SELECT_ITEM'; payload: { item: Item; type: string } }
    | { type: 'CLEAR_SELECTION' }
    | { type: 'SHOW_ADD_FORM'; payload: { type: ItemType; parentId: string | null } }
    | { type: 'SHOW_EDIT_FORM' }
    | { type: 'HIDE_FORM' };

// 初期状態
const initialState: StoryDataState = {
    selectedItem: null,
    formVisible: false,
    isEditing: false,
    formType: null,
    formParentId: null,
    formItemData: undefined,
};

// Reducer
function storyDataReducer(state: StoryDataState, action: StoryDataAction): StoryDataState {
    switch (action.type) {
        case 'SELECT_ITEM':
            return {
                ...state,
                selectedItem: { ...action.payload.item, type: action.payload.type },
                formVisible: false, // アイテムを選択したらフォームは隠す
            };
        case 'CLEAR_SELECTION':
            return { ...state, selectedItem: null };
        case 'SHOW_ADD_FORM':
            return {
                ...initialState, // 状態をリセット
                selectedItem: null,
                formVisible: true,
                formType: action.payload.type,
                formParentId: action.payload.parentId,
            };
        case 'SHOW_EDIT_FORM':
            if (!state.selectedItem) return state;
            const typeStr = state.selectedItem.type.toLowerCase().replace(' ', '');
            const itemType = (typeStr === 'story' ? 'stories' : typeStr + 's') as ItemType;
            return {
                ...initialState, // 状態をリセット
                formVisible: true,
                isEditing: true,
                formType: itemType,
                formItemData: state.selectedItem,
                selectedItem: null,
            };
        case 'HIDE_FORM':
            return {
                ...state,
                formVisible: false,
                isEditing: false,
                formType: null,
                formParentId: null,
                formItemData: undefined,
            };
        default:
            return state;
    }
}

export const useStoryData = () => {
    const { storyData, addItem, updateItem, deleteItem } = useVscode();
    const [state, dispatch] = useReducer(storyDataReducer, initialState);

    const selectItem = useCallback((item: Item, type: string) => {
        dispatch({ type: 'SELECT_ITEM', payload: { item, type } });
    }, []);

    const showAddItemForm = useCallback((type: ItemType, parentId: string | null = null) => {
        dispatch({ type: 'SHOW_ADD_FORM', payload: { type, parentId } });
    }, []);

    const showEditItemForm = useCallback(() => {
        dispatch({ type: 'SHOW_EDIT_FORM' });
    }, []);

    const hideForm = useCallback(() => {
        dispatch({ type: 'HIDE_FORM' });
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
        hideForm(); // フォームを閉じる
    }, [state, addItem, updateItem, hideForm]);

    return {
        storyData,
        ...state,
        selectItem,
        showAddItemForm,
        showEditItemForm,
        hideForm,
        handleFormSubmit,
        deleteItem,
    };
};