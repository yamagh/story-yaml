import * as yaml from 'js-yaml';
import { StoryFile, Epic, Story, Task, SubTask, Item } from '../types';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';
type ItemData = Epic | Story | Task | SubTask;

export class StoryYamlService {
    private static loadYaml(content: string): StoryFile {
        try {
            const doc = yaml.load(content) as StoryFile;
            return doc || { epics: [], tasks: [] };
        } catch (e) {
            throw e;
        }
    }

    public static saveStoryFile(storyFile: StoryFile): string {
        return yaml.dump(storyFile);
    }

    public static updateStoryContent(content: string, item: { itemType: string; parentTitle?: string; values: Omit<Item, 'stories' | 'sub tasks'> }): string {
        const doc = this.loadYaml(content);

        if (!doc.epics) {doc.epics = [];}
        if (!doc.tasks) {doc.tasks = [];}

        const itemType = item.itemType as ItemType;
        let data: ItemData;

        switch (itemType) {
            case 'epics':
                data = { ...item.values, stories: [] };
                break;
            case 'stories':
            case 'tasks':
                data = { ...item.values, 'sub tasks': [], status: 'ToDo', ...item.values };
                break;
            case 'subtasks':
                data = { status: 'ToDo', ...item.values };
                break;
            default:
                return content;
        }

        this.addItem(doc, { itemType, data, parentId: item.parentTitle });

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
        const parentEpic = doc.epics.find((e) => e.title === parentId);
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
                if (item.title === parentId) {
                    return item;
                }
                if ('stories' in item && item.stories) {
                    const found = findParent(item.stories);
                    if (found) {return found;}
                }
                if ('sub tasks' in item && item['sub tasks']) {
                    const found = findParent(item['sub tasks']);
                    if (found) {return found;}
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

    public static updateStoryContentForItemUpdate(content: string, item: { originalTitle: string, updatedData: Item & { type: string } }): string {
        const doc = this.loadYaml(content);

        const { type, ...newData } = item.updatedData;

        this.findAndReplace(doc.epics, item.originalTitle, newData);
        this.findAndReplace(doc.tasks, item.originalTitle, newData);

        return this.saveStoryFile(doc);
    }

    private static findAndReplace(collection: (Epic | Story | Task | SubTask)[], title: string, newData: Partial<ItemData>): boolean {
        if (!collection) {return false;}
        const itemIndex = collection.findIndex(i => i.title === title);
        if (itemIndex > -1) {
            collection[itemIndex] = { ...collection[itemIndex], ...newData };
            return true;
        }
        for (const currentItem of collection) {
            if ('stories' in currentItem && currentItem.stories && this.findAndReplace(currentItem.stories, title, newData)) {
                return true;
            }
            if ('sub tasks' in currentItem && currentItem['sub tasks'] && this.findAndReplace(currentItem['sub tasks'], title, newData)) {
                return true;
            }
        }
        return false;
    }

    public static deleteItemFromStoryFile(content: string, itemToDelete: { title: string }): string {
        const doc = this.loadYaml(content);

        const removeItem = (collection: any[], title: string): boolean => {
            if (!collection) {return false;}
            const itemIndex = collection.findIndex(i => i.title === title);
            if (itemIndex > -1) {
                collection.splice(itemIndex, 1);
                return true;
            }
            for (const currentItem of collection) {
                if (currentItem.stories && removeItem(currentItem.stories, title)) {
                    return true;
                }
                if (currentItem['sub tasks'] && removeItem(currentItem['sub tasks'], title)) {
                    return true;
                }
            }
            return false;
        };

        if (!removeItem(doc.epics, itemToDelete.title)) {
            removeItem(doc.tasks, itemToDelete.title);
        }

        return this.saveStoryFile(doc);
    }
}
