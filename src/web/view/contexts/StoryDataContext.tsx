import React, { createContext, useContext, useReducer, useEffect, ReactNode, FC, useMemo, Dispatch } from 'react';
import { useVscode } from '../hooks/useVscode';
import { Item, Story, Task, StoryFile, Epic, SubTask, AddItemValues, UpdateItemValues } from '../../types';
import { DragEndEvent } from '@dnd-kit/core';
import { StoryModel } from '../../services/StoryModel';
import { findItemAndParent } from '../../utils';

// State & Reducer
interface StoryDataState {
    storyData: StoryFile | null;
    error: string | null;
}

type StoryAction =
    | { type: 'SET_STORY_DATA'; payload: StoryFile | null }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'ADD_ITEM'; payload: { itemType: 'epics' | 'stories' | 'tasks' | 'subtasks'; values: AddItemValues; parentId?: string } }
    | { type: 'UPDATE_ITEM'; payload: { id: string; updatedData: UpdateItemValues } }
    | { type: 'DELETE_ITEM'; payload: { id: string } }
    | { type: 'HANDLE_DRAG_END'; payload: DragEndEvent; findItem: typeof findItemAndParent };

const storyReducer = (state: StoryDataState, action: StoryAction): StoryDataState => {
    switch (action.type) {
        case 'SET_STORY_DATA':
            return { ...state, storyData: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'ADD_ITEM': {
            if (!state.storyData) return state;
            const model = new StoryModel(state.storyData);
            model.addItem(action.payload.itemType, action.payload.values, action.payload.parentId);
            return { ...state, storyData: model.getStoryFile() };
        }
        case 'UPDATE_ITEM': {
            if (!state.storyData) return state;
            const model = new StoryModel(state.storyData);
            model.updateItem(action.payload.id, action.payload.updatedData);
            return { ...state, storyData: model.getStoryFile() };
        }
        case 'DELETE_ITEM': {
            if (!state.storyData) return state;
            const model = new StoryModel(state.storyData);
            model.deleteItem(action.payload.id);
            return { ...state, storyData: model.getStoryFile() };
        }
        case 'HANDLE_DRAG_END': {
            const { active, over } = action.payload;
            if (!over || active.id === over.id || !state.storyData) return state;
    
            const model = new StoryModel(state.storyData);
            const allItems = [...model.getStoryFile().epics, ...model.getStoryFile().tasks];
            const activeItemInfo = action.findItem(allItems, active.id as string);
            const overItemInfo = action.findItem(allItems, over.id as string);
    
            if (!activeItemInfo) return state;
    
            const { item: activeItem } = activeItemInfo;
            const { item: overItem, parent: overItemParent } = overItemInfo || {};
    
            if (activeItem.type === 'Epic' || activeItem.type === 'Task') return state;
            if (activeItem.type === 'Story' && overItem?.type !== 'Epic') return state;
            if (activeItem.type === 'SubTask' && overItem?.type !== 'Story' && overItem?.type !== 'Task') return state;
    
            let current = overItemParent;
            while (current) {
                if (current.id === activeItem.id) return state; // Prevent nesting inside own children
                const parentInfo = action.findItem(allItems, current.id!);
                current = parentInfo?.parent || null;
            }
    
            model.deleteItem(active.id as string);
            const newModel = new StoryModel(model.getStoryFile());
    
            if (overItem) {
                if (overItem.type === 'Epic' && activeItem.type === 'Story') {
                    overItem.stories = overItem.stories || [];
                    overItem.stories.push(activeItem as Story);
                } else if ((overItem.type === 'Story' || overItem.type === 'Task') && activeItem.type === 'SubTask') {
                    overItem.subtasks = overItem.subtasks || [];
                    overItem.subtasks.push(activeItem as SubTask);
                }
                newModel.updateItem(overItem.id!, overItem);
            }
            return { ...state, storyData: newModel.getStoryFile() };
        }
        default:
            return state;
    }
};


// Context
interface StoryDataContextType {
    state: StoryDataState;
    dispatch: Dispatch<StoryAction>;
    findItemAndParent: (items: Item[], id: string, parent?: Epic | Story | Task | null) => { item: Item; parent: Epic | Story | Task | null; } | null;
}

const StoryDataContext = createContext<StoryDataContextType | undefined>(undefined);

// Provider
export const StoryDataProvider: FC<{children: ReactNode}> = ({ children }) => {
    const vscodeApi = useVscode();
    const { storyData: initialStoryData, error: initialError } = vscodeApi;

    const [state, dispatch] = useReducer(storyReducer, {
        storyData: null,
        error: null,
    });

    useEffect(() => {
        if (initialStoryData) {
            dispatch({ type: 'SET_STORY_DATA', payload: initialStoryData });
        }
    }, [initialStoryData]);

    useEffect(() => {
        if (initialError) {
            dispatch({ type: 'SET_ERROR', payload: initialError });
        }
    }, [initialError]);
    
    // Effect to notify VS Code of changes
    useEffect(() => {
        if (state.storyData) {
            vscodeApi.updateStoryFile(state.storyData);
        }
    }, [state.storyData, vscodeApi]);

    const value = useMemo(() => ({
        state,
        dispatch,
        findItemAndParent,
    }), [state]);

    return <StoryDataContext.Provider value={value}>{children}</StoryDataContext.Provider>;
};

export const useStoryData = (): StoryDataContextType => {
    const context = useContext(StoryDataContext);
    if (context === undefined) {
        throw new Error('useStoryData must be used within a StoryDataProvider');
    }
    return context;
};
