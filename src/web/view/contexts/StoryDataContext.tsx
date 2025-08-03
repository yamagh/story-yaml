import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, FC, useMemo } from 'react';
import { useVscode } from '../hooks/useVscode';
import { Item, Story, Task, StoryFile, Epic, SubTask } from '../../types';
import { DragEndEvent } from '@dnd-kit/core';
import { StoryModel } from '../../services/StoryModel';

// データコンテキストの型定義
interface StoryDataContextType {
    storyData: StoryFile | null;
    error: string | null;
    setError: (error: string | null) => void;
    addItem: (itemType: 'epics' | 'stories' | 'tasks' | 'subtasks', values: any, parentId?: string) => string | undefined;
    updateItem: (id: string, updatedData: any) => void;
    deleteItem: (id:string) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    findItemAndParent: (items: Item[], id: string, parent?: Epic | Story | Task | null) => { item: Item; parent: Epic | Story | Task | null; } | null;
}

const StoryDataContext = createContext<StoryDataContextType | undefined>(undefined);

export const StoryDataProvider: FC<{children: ReactNode}> = ({ children }) => {
    const vscodeApi = useVscode();
    const { storyData: initialStoryData, error, setError } = vscodeApi;
    const [storyData, setStoryData] = useState<StoryFile | null>(initialStoryData);

    const updateStoryData = useCallback((newStoryData: StoryFile, newId?: string) => {
        setStoryData(newStoryData);
        vscodeApi.updateStoryFile(newStoryData, newId);
    }, [setStoryData, vscodeApi]);

    const findItemAndParent = useCallback((items: Item[], id: string, parent: (Epic | Story | Task) | null = null): { item: Item, parent: (Epic | Story | Task) | null } | null => {
        for (const item of items) {
            if (item.id === id) return { item, parent };
            if ('stories' in item && item.stories) {
                const found = findItemAndParent(item.stories, id, item as Epic);
                if (found) return found;
            }
            if ('subtasks' in item && item.subtasks) {
                const found = findItemAndParent(item.subtasks, id, item as Story | Task);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const addItem = useCallback((itemType: 'epics' | 'stories' | 'tasks' | 'subtasks', values: any, parentId?: string) => {
        if (!storyData) return;
        const model = new StoryModel(storyData);
        const newId = model.addItem(itemType, values, parentId);
        const newStoryData = model.getStoryFile();
        setStoryData(newStoryData);
        vscodeApi.updateStoryFile(newStoryData, newId);
        return newId;
    }, [storyData, vscodeApi]);

    const updateItem = useCallback((id: string, updatedData: any) => {
        if (!storyData) return;
        const model = new StoryModel(storyData);
        model.updateItem(id, updatedData);
        updateStoryData(model.getStoryFile());
    }, [storyData, updateStoryData]);

    const deleteItem = useCallback((id: string) => {
        if (!storyData) return;
        const model = new StoryModel(storyData);
        model.deleteItem(id);
        updateStoryData(model.getStoryFile());
    }, [storyData, updateStoryData]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !storyData) return;

        const model = new StoryModel(storyData);
        const allItems = [...model.getStoryFile().epics, ...model.getStoryFile().tasks];
        const activeItemInfo = findItemAndParent(allItems, active.id as string);
        const overItemInfo = findItemAndParent(allItems, over.id as string);
        if (!activeItemInfo) return;

        const { item: activeItem } = activeItemInfo;
        const { item: overItem, parent: overItemParent } = overItemInfo || {};

        if (activeItem.type === 'Epic' || activeItem.type === 'Task') return;
        if (activeItem.type === 'Story' && overItem?.type !== 'Epic') return;
        if (activeItem.type === 'SubTask' && overItem?.type !== 'Story' && overItem?.type !== 'Task') return;

        let current = overItemParent;
        while (current) {
            if (current.id === activeItem.id) return;
            const parentInfo = findItemAndParent(allItems, current.id!);
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
        updateStoryData(newModel.getStoryFile());
    }, [storyData, updateStoryData, findItemAndParent]);

    useEffect(() => {
        setStoryData(initialStoryData);
    }, [initialStoryData]);

    const value = useMemo(() => ({
        storyData, error, setError,
        addItem, updateItem, deleteItem, handleDragEnd, findItemAndParent,
    }), [
        storyData, error, setError,
        addItem, updateItem, deleteItem, handleDragEnd, findItemAndParent,
    ]);

    return <StoryDataContext.Provider value={value}>{children}</StoryDataContext.Provider>;
};

export const useStoryData = (): StoryDataContextType => {
    const context = useContext(StoryDataContext);
    if (context === undefined) {
        throw new Error('useStoryData must be used within a StoryDataProvider');
    }
    return context;
};
