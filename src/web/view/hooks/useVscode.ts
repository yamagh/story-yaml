import { useState, useEffect, useCallback } from 'react';
import { StoryFile, Item } from '../types';

const vscode = acquireVsCodeApi();

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

export function useVscode() {
    const [storyData, setStoryData] = useState<StoryFile | null>(null);

    const handleMessage = useCallback((event: MessageEvent) => {
        const message = event.data;
        if (message.command === 'update') {
            setStoryData(message.data);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        vscode.postMessage({ command: 'ready' });
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const addItem = (item: { itemType: ItemType | null; parentId: string | null; data: Partial<Item> }) => {
        vscode.postMessage({ command: 'addItem', item });
    };

    const updateItem = (item: { itemType: ItemType | null; originalTitle: string; data: Partial<Item> }) => {
        vscode.postMessage({ command: 'updateItem', item });
    };

    return { storyData, addItem, updateItem, setStoryData };
}
