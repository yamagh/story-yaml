import { Epic, Story, Task, SubTask, Item } from './types';

export function isEpic(item: Item): item is Epic {
    return item.type === 'Epic';
}

export function isStory(item: Item): item is Story {
    return item.type === 'Story';
}

export function isTask(item: Item): item is Task {
    return item.type === 'Task';
}

export function isSubTask(item: Item): item is SubTask {
    return item.type === 'SubTask';
}
