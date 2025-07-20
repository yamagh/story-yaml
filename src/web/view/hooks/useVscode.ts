import { useState, useEffect, useCallback } from 'react';
import { StoryFile, Item, WebviewMessage, ExtensionMessage } from '../../types';

const vscode = acquireVsCodeApi();

export function useVscode() {
    const [storyData, setStoryData] = useState<StoryFile | null>(null);

    const handleMessage = useCallback((event: MessageEvent<ExtensionMessage>) => {
        const message = event.data;
        if (message.command === 'update') {
            setStoryData(message.storyFile);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        postMessage({ command: 'ready' });
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [handleMessage]);

    const postMessage = (message: WebviewMessage) => {
        vscode.postMessage(message);
    };

    const addItem = (item: { itemType: string, parentTitle?: string, values: Omit<Item, 'stories' | 'sub tasks'> }) => {
        postMessage({ command: 'addItem', item });
    };

    const updateItem = (item: { originalTitle: string, updatedData: Item & { type: string } }) => {
        postMessage({ command: 'updateItem', item });
    };

    const deleteItem = (item: { title: string }) => {
        postMessage({ command: 'deleteItem', item });
    };

    const updateStoryFile = (storyFile: StoryFile) => {
        postMessage({ command: 'updateStoryFile', storyFile });
    };

    return { storyData, setStoryData, addItem, updateItem, deleteItem, updateStoryFile };
}