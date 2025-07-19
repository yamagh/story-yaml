import * as yaml from 'js-yaml';
import { StoryFile, Epic, Story, Task, SubTask } from '../types';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';
type ItemData = Epic | Story | Task | SubTask;

export class StoryYamlService {
    public static updateStoryContent(content: string, item: { itemType: ItemType; data: ItemData; parentId?: string }): string {
        const doc = yaml.load(content) as StoryFile || { epics: [], tasks: [] };

        if (!doc.epics) doc.epics = [];
        if (!doc.tasks) doc.tasks = [];

        switch (item.itemType) {
            case 'epics':
                doc.epics.push(item.data as Epic);
                break;
            case 'stories':
                const parentEpic = doc.epics.find((e) => e.title === item.parentId);
                if (parentEpic) {
                    if (!parentEpic.stories) {
                        parentEpic.stories = [];
                    }
                    parentEpic.stories.push(item.data as Story);
                }
                break;
            case 'tasks':
                doc.tasks.push(item.data as Task);
                break;
            case 'subtasks':
                const findAndAddSubTask = (parents: (Epic | Story | Task)[]) => {
                    for (const parent of parents) {
                        if (parent.title === item.parentId) {
                            if (!parent['sub tasks']) {
                                parent['sub tasks'] = [];
                            }
                            parent['sub tasks'].push(item.data as SubTask);
                            return true;
                        }
                        if ('stories' in parent && parent.stories) {
                            if (findAndAddSubTask(parent.stories)) return true;
                        }
                    }
                    return false;
                };

                if (!findAndAddSubTask(doc.epics)) {
                    findAndAddSubTask(doc.tasks);
                }
                break;
        }

        return yaml.dump(doc);
    }

    public static updateStoryContentForItemUpdate(content: string, item: { itemType: ItemType; originalTitle: string; data: Partial<ItemData>; }): string {
        const doc = yaml.load(content) as StoryFile;
        if (!doc) return content;

        const findAndReplace = (collection: (Epic | Story | Task | SubTask)[], title: string, newData: Partial<ItemData>): boolean => {
            if (!collection) return false;
            const itemIndex = collection.findIndex(i => i.title === title);
            if (itemIndex > -1) {
                collection[itemIndex] = { ...collection[itemIndex], ...newData };
                return true;
            }
            for (const currentItem of collection) {
                if ('stories' in currentItem && currentItem.stories && findAndReplace(currentItem.stories, title, newData)) {
                    return true;
                }
                if ('sub tasks' in currentItem && currentItem['sub tasks'] && findAndReplace(currentItem['sub tasks'], title, newData)) {
                    return true;
                }
            }
            return false;
        };

        if (!findAndReplace(doc.epics, item.originalTitle, item.data)) {
            findAndReplace(doc.tasks, item.originalTitle, item.data);
        }

        return yaml.dump(doc);
    }
}
