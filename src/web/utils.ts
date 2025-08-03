import { Item, Epic, Story, Task } from "./types";

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export const findItemAndParent = (items: Item[], id: string, parent: (Epic | Story | Task) | null = null): { item: Item, parent: (Epic | Story | Task) | null } | null => {
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
};
