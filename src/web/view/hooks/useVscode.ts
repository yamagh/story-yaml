import { useState, useEffect, useCallback } from 'react';
import { StoryFile, Item, WebviewMessage, ExtensionMessage } from '../../types';

const vscode = acquireVsCodeApi();

export function useVscode() {
    const [storyData, setStoryData] = useState<StoryFile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMessage = useCallback((event: MessageEvent<ExtensionMessage>) => {
        const message = event.data;
        switch (message.command) {
            case 'update':
                setStoryData(message.storyFile);
                setError(null); // Clear error on successful update
                break;
            case 'yamlError':
                setError(message.error);
                break;
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

    return { storyData, error, setError, setStoryData, addItem, updateItem, deleteItem, updateStoryFile };
}
