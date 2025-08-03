import { StoryFile, Item, Epic, Story, Task, SubTask, AddItemValues } from '../types';
import { getNextId } from './idGenerator';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

export class StoryModel {
    private storyFile: StoryFile;

    constructor(storyFile: StoryFile) {
        this.storyFile = { ...storyFile };
        if (!this.storyFile.epics) {
            this.storyFile.epics = [];
        }
        if (!this.storyFile.tasks) {
            this.storyFile.tasks = [];
        }
    }

    public getStoryFile(): StoryFile {
        return this.storyFile;
    }

    private findItemRecursive(
        collection: Item[],
        id: string
    ): { item: Item; collection: Item[] } | null {
        for (let i = 0; i < collection.length; i++) {
            const item = collection[i];
            if (item.id === id) {
                return { item, collection };
            }
            if ('stories' in item && item.stories) {
                const found = this.findItemRecursive(item.stories, id);
                if (found) return found;
            }
            if ('subtasks' in item && item.subtasks) {
                const found = this.findItemRecursive(item.subtasks, id);
                if (found) return found;
            }
        }
        return null;
    }

    public findParent(targetId: string): Item | null {
        const find = (collection: Item[], parent: Item | null): Item | null => {
            for (const item of collection) {
                if ('stories' in item && item.stories?.some(child => child.id === targetId)) {
                    return item;
                }
                if ('subtasks' in item && item.subtasks?.some(child => child.id === targetId)) {
                    return item;
                }
                if ('stories' in item && item.stories) {
                    const found = find(item.stories, item);
                    if (found) return found;
                }
                if ('subtasks' in item && item.subtasks) {
                    const found = find(item.subtasks, item);
                    if (found) return found;
                }
            }
            return null;
        }
        return find([...this.storyFile.epics, ...this.storyFile.tasks], null);
    }

    public addItem(itemType: ItemType, values: AddItemValues, parentId?: string): string {
        const newId = getNextId();
        let newItem: Item;

        switch (itemType) {
            case 'epics':
                newItem = { id: newId, ...values, stories: [] };
                this.storyFile.epics.push(newItem as Epic);
                break;
            case 'tasks':
                newItem = { id: newId, status: 'ToDo', ...values, subtasks: [] };
                this.storyFile.tasks.push(newItem as Task);
                break;
            case 'stories':
                newItem = { id: newId, status: 'ToDo', ...values, subtasks: [] };
                const parentEpicResult = this.findItemRecursive(this.storyFile.epics, parentId!);
                if (parentEpicResult) {
                    const parentEpic = parentEpicResult.item as Epic;
                    parentEpic.stories = parentEpic.stories || [];
                    parentEpic.stories.push(newItem as Story);
                }
                break;
            case 'subtasks':
                newItem = { id: newId, status: 'ToDo', ...values };
                const parentItemResult = this.findItemRecursive([...this.storyFile.epics, ...this.storyFile.tasks], parentId!);
                if (parentItemResult) {
                    const parentItem = parentItemResult.item as Story | Task;
                    parentItem.subtasks = parentItem.subtasks || [];
                    parentItem.subtasks.push(newItem as SubTask);
                }
                break;
            default:
                throw new Error(`Unknown item type: ${itemType}`);
        }
        return newId;
    }

    public updateItem(id: string, updatedData: Partial<Item>): boolean {
        const foundInEpics = this.findItemRecursive(this.storyFile.epics, id);
        if (foundInEpics) {
            const { item, collection } = foundInEpics;
            const itemIndex = collection.findIndex(i => i.id === id);
            if (itemIndex > -1) {
                collection[itemIndex] = { ...item, ...updatedData };
                return true;
            }
        }

        const foundInTasks = this.findItemRecursive(this.storyFile.tasks, id);
        if (foundInTasks) {
            const { item, collection } = foundInTasks;
            const itemIndex = collection.findIndex(i => i.id === id);
            if (itemIndex > -1) {
                collection[itemIndex] = { ...item, ...updatedData };
                return true;
            }
        }
        return false;
    }

    public deleteItem(id: string): boolean {
        const foundInEpics = this.findItemRecursive(this.storyFile.epics, id);
        if (foundInEpics) {
            const { collection } = foundInEpics;
            const itemIndex = collection.findIndex(i => i.id === id);
            if (itemIndex > -1) {
                collection.splice(itemIndex, 1);
                return true;
            }
        }

        const foundInTasks = this.findItemRecursive(this.storyFile.tasks, id);
        if (foundInTasks) {
            const { collection } = foundInTasks;
            const itemIndex = collection.findIndex(i => i.id === id);
            if (itemIndex > -1) {
                collection.splice(itemIndex, 1);
                return true;
            }
        }
        return false;
    }
}