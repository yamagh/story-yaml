import * as yaml from 'js-yaml';
import { StoryFile, Epic, Story, Task, SubTask } from '../types';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';
type ItemData = Epic | Story | Task | SubTask;

export class StoryYamlService {
    public static updateStoryContent(content: string, item: { itemType: ItemType; data: ItemData; parentId?: string }): string {
        const doc = yaml.load(content) as StoryFile || { epics: [], tasks: [] };

        if (!doc.epics) doc.epics = [];
        if (!doc.tasks) doc.tasks = [];

        this.addItem(doc, item);

        return yaml.dump(doc);
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
                    if (found) return found;
                }
                if ('sub tasks' in item && item['sub tasks']) {
                    const found = findParent(item['sub tasks']);
                    if (found) return found;
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

    public static updateStoryContentForItemUpdate(content: string, item: { itemType: ItemType; originalTitle: string; data: Partial<ItemData>; }): string {
        const doc = yaml.load(content) as StoryFile;
        if (!doc) return content;

        this.findAndReplace(doc.epics, item.originalTitle, item.data);
        this.findAndReplace(doc.tasks, item.originalTitle, item.data);

        return yaml.dump(doc);
    }

    private static findAndReplace(collection: (Epic | Story | Task | SubTask)[], title: string, newData: Partial<ItemData>): boolean {
        if (!collection) return false;
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
}