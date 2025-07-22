import * as yaml from 'js-yaml';
import { StoryFile, Epic, Story, Task, SubTask, Item, AddItemValues } from '../types';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';
type ItemData = Epic | Story | Task | SubTask;

export class StoryYamlService {
    private static nextId = 0;

    private static addUniqueIds(items: Item[]): Item[] {
        const assignId = (item: Item) => {
            if (!item.id) {
                item.id = (this.nextId++).toString();
            }
            if ('stories' in item && item.stories) {
                item.stories.forEach(assignId);
            }
            if ('sub tasks' in item && item['sub tasks']) {
                item['sub tasks'].forEach(assignId);
            }
        };
        items.forEach(assignId);
        return items;
    }

    public static loadYaml(content: string): StoryFile {
        const doc = yaml.load(content) as StoryFile;
        const validatedDoc = doc || { epics: [], tasks: [] };
        if (!validatedDoc.epics) {
            validatedDoc.epics = [];
        }
        if (!validatedDoc.tasks) {
            validatedDoc.tasks = [];
        }
        this.nextId = 0;
        this.addUniqueIds(validatedDoc.epics);
        this.addUniqueIds(validatedDoc.tasks);
        return validatedDoc;
    }

    private static removeIds(items: Item[]): Omit<Item, 'id'>[] {
        return items.map(item => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, ...rest } = item;
            if ('stories' in rest && rest.stories) {
                rest.stories = this.removeIds(rest.stories) as Story[];
            }
            if ('sub tasks' in rest && rest['sub tasks']) {
                rest['sub tasks'] = this.removeIds(rest['sub tasks']) as SubTask[];
            }
            return rest;
        });
    }

    public static saveStoryFile(storyFile: StoryFile): string {
        const cleanEpics = this.removeIds(storyFile.epics);
        const cleanTasks = this.removeIds(storyFile.tasks);
        return yaml.dump({ epics: cleanEpics, tasks: cleanTasks });
    }

    public static updateStoryContent(content: string, item: { itemType: string; parentId?: string; values: AddItemValues }): string {
        const doc = this.loadYaml(content);

        if (!doc.epics) { doc.epics = []; }
        if (!doc.tasks) { doc.tasks = []; }

        const itemType = item.itemType as ItemType;
        let data: ItemData;
        const newId = (this.nextId++).toString();

        switch (itemType) {
            case 'epics':
                data = { id: newId, ...item.values, stories: [] };
                break;
            case 'stories':
            case 'tasks':
                data = { id: newId, 'sub tasks': [], status: 'ToDo', ...item.values };
                break;
            case 'subtasks':
                data = { id: newId, status: 'ToDo', ...item.values };
                break;
            default:
                return content;
        }

        this.addItem(doc, { itemType, data, parentId: item.parentId });

        return this.saveStoryFile(doc);
    }

    private static addItem(doc: StoryFile, item: { itemType: ItemType; data: ItemData; parentId?: string }) {
        switch (item.itemType) {
            case 'epics':
                doc.epics.push(item.data as Epic);
                break;
            case 'stories':
                this.addStory(doc, item.data as Story, item.parentId);
                break;
            case 'tasks':
                doc.tasks.push(item.data as Task);
                break;
            case 'subtasks':
                this.addSubTask(doc, item.data as SubTask, item.parentId);
                break;
        }
    }

    private static addStory(doc: StoryFile, story: Story, parentId?: string) {
        const parentEpic = doc.epics.find((e) => e.id === parentId);
        if (parentEpic) {
            if (!parentEpic.stories) {
                parentEpic.stories = [];
            }
            parentEpic.stories.push(story);
        }
    }

    private static addSubTask(doc: StoryFile, subTask: SubTask, parentId?: string) {
        const findParent = (items: (Epic | Story | Task)[]): (Epic | Story | Task) | undefined => {
            for (const item of items) {
                if (item.id === parentId) {
                    return item;
                }
                if ('stories' in item && item.stories) {
                    const found = findParent(item.stories);
                    if (found) { return found; }
                }
                if ('sub tasks' in item && item['sub tasks']) {
                    const found = findParent(item['sub tasks']);
                    if (found) { return found; }
                }
            }
            return undefined;
        };

        const parent = findParent(doc.epics) || findParent(doc.tasks);

        if (parent && 'sub tasks' in parent) {
            if (!parent['sub tasks']) {
                parent['sub tasks'] = [];
            }
            parent['sub tasks'].push(subTask);
        }
    }

    public static updateStoryContentForItemUpdate(content: string, item: { id: string, updatedData: Partial<Item> & { type: string } }): string {
        const doc = this.loadYaml(content);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type: _type, ...newData } = item.updatedData;

        this.findAndReplace(doc.epics, item.id, newData);
        this.findAndReplace(doc.tasks, item.id, newData);

        return this.saveStoryFile(doc);
    }

    private static findAndReplace(collection: (Epic | Story | Task | SubTask)[], id: string, newData: Partial<ItemData>): boolean {
        if (!collection) { return false; }
        const itemIndex = collection.findIndex(i => i.id === id);
        if (itemIndex > -1) {
            collection[itemIndex] = { ...collection[itemIndex], ...newData };
            return true;
        }
        for (const currentItem of collection) {
            if ('stories' in currentItem && currentItem.stories && this.findAndReplace(currentItem.stories, id, newData)) {
                return true;
            }
            if ('sub tasks' in currentItem && currentItem['sub tasks'] && this.findAndReplace(currentItem['sub tasks'], id, newData)) {
                return true;
            }
        }
        return false;
    }

    public static deleteItemFromStoryFile(content: string, itemToDelete: { id: string }): string {
        const doc = this.loadYaml(content);

        const removeItem = (collection: Item[], id: string): boolean => {
            if (!collection) { return false; }
            const itemIndex = collection.findIndex(i => i.id === id);
            if (itemIndex > -1) {
                collection.splice(itemIndex, 1);
                return true;
            }
            for (const currentItem of collection) {
                if ('stories' in currentItem && currentItem.stories && removeItem(currentItem.stories, id)) {
                    return true;
                }
                if ('sub tasks' in currentItem && currentItem['sub tasks'] && removeItem(currentItem['sub tasks'], id)) {
                    return true;
                }
            }
            return false;
        };

        if (!removeItem(doc.epics, itemToDelete.id)) {
            removeItem(doc.tasks, itemToDelete.id);
        }

        return this.saveStoryFile(doc);
    }
}

