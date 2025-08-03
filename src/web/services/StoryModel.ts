import { StoryFile, Item, Epic, Story, Task, SubTask, AddItemValues } from '../types';
import { getNextId, initializeAndAssignIds } from './idGenerator';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

export class StoryModel {
    private storyFile: StoryFile;

    constructor(storyFile: StoryFile) {
        this.storyFile = JSON.parse(JSON.stringify(storyFile));

        if (!this.storyFile.epics) {
            this.storyFile.epics = [];
        }
        if (!this.storyFile.tasks) {
            this.storyFile.tasks = [];
        }
        this.assignTypes(this.storyFile.epics, this.storyFile.tasks);
        initializeAndAssignIds([...this.storyFile.epics, ...this.storyFile.tasks]);
    }

    private assignTypes(epics: Epic[], tasks: Task[]): void {
        epics.forEach(epic => {
            epic.type = 'Epic';
            if (epic.stories) {
                epic.stories.forEach(story => {
                    story.type = 'Story';
                    if (story.subtasks) {
                        story.subtasks.forEach(subtask => {
                            subtask.type = 'SubTask';
                        });
                    }
                });
            }
        });
        tasks.forEach(task => {
            task.type = 'Task';
            if (task.subtasks) {
                task.subtasks.forEach(subtask => {
                    subtask.type = 'SubTask';
                });
            }
        });
    }

    public getStoryFile(): StoryFile {
        return this.storyFile;
    }


    private findItemRecursive(
        collection: Item[],
        id: string
    ): Item | null {
        for (const item of collection) {
            if (item.id === id) {
                return item;
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
        const find = (collection: Item[]): Item | null => {
            for (const item of collection) {
                if ('stories' in item && item.stories?.some(child => child.id === targetId)) {
                    return item;
                }
                if ('subtasks' in item && item.subtasks?.some(child => child.id === targetId)) {
                    return item;
                }
                if ('stories' in item && item.stories) {
                    const found = find(item.stories);
                    if (found) return found;
                }
                if ('subtasks' in item && item.subtasks) {
                    const found = find(item.subtasks);
                    if (found) return found;
                }
            }
            return null;
        };
        return find([...this.storyFile.epics, ...this.storyFile.tasks]);
    }

    public addItem(itemType: ItemType, values: AddItemValues, parentId?: string): Item {
        const newId = getNextId();
        let newItem: Item;

        switch (itemType) {
            case 'epics': {
                const newEpic: Epic = { type: 'Epic', id: newId, ...values, stories: [] };
                this.storyFile.epics.push(newEpic);
                newItem = newEpic;
                break;
            }
            case 'tasks': {
                const newTask: Task = { type: 'Task', id: newId, status: 'ToDo', ...values, subtasks: [] };
                this.storyFile.tasks.push(newTask);
                newItem = newTask;
                break;
            }
            case 'stories': {
                const newStory: Story = { type: 'Story', id: newId, status: 'ToDo', ...values, subtasks: [] };
                const parentEpic = this.findItemRecursive(this.storyFile.epics, parentId!) as Epic | null;
                if (parentEpic) {
                    parentEpic.stories = parentEpic.stories || [];
                    parentEpic.stories.push(newStory);
                }
                newItem = newStory;
                break;
            }
            case 'subtasks': {
                const newSubTask: SubTask = { type: 'SubTask', id: newId, status: 'ToDo', ...values };
                const parentItem = this.findItemRecursive([...this.storyFile.epics, ...this.storyFile.tasks], parentId!) as Story | Task | null;
                if (parentItem) {
                    parentItem.subtasks = parentItem.subtasks || [];
                    parentItem.subtasks.push(newSubTask);
                }
                newItem = newSubTask;
                break;
            }
            default:
                throw new Error(`Unknown item type: ${itemType}`);
        }
        return newItem;
    }

    private updateItemRecursive(collection: Item[], id: string, updatedData: Partial<Omit<Item, 'type'>>): boolean {
        const itemIndex = collection.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            collection[itemIndex] = { ...collection[itemIndex], ...updatedData } as Item;
            return true;
        }

        for (const item of collection) {
            if ('stories' in item && item.stories && this.updateItemRecursive(item.stories, id, updatedData)) {
                return true;
            }
            if ('subtasks' in item && item.subtasks && this.updateItemRecursive(item.subtasks, id, updatedData)) {
                return true;
            }
        }
        return false;
    }

    public updateItem(id: string, updatedData: Partial<Omit<Item, 'type'>>): boolean {
        if (this.updateItemRecursive(this.storyFile.epics, id, updatedData)) {
            return true;
        }
        return this.updateItemRecursive(this.storyFile.tasks, id, updatedData);
    }

    private deleteItemRecursive(collection: Item[], id: string): boolean {
        const itemIndex = collection.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            collection.splice(itemIndex, 1);
            return true;
        }

        for (const item of collection) {
            if ('stories' in item && item.stories && this.deleteItemRecursive(item.stories, id)) {
                return true;
            }
            if ('subtasks' in item && item.subtasks && this.deleteItemRecursive(item.subtasks, id)) {
                return true;
            }
        }
        return false;
    }

    public deleteItem(id: string): boolean {
        if (this.deleteItemRecursive(this.storyFile.epics, id)) {
            return true;
        }
        return this.deleteItemRecursive(this.storyFile.tasks, id);
    }
}