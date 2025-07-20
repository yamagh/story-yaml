import { Epic, Story, Task, SubTask, Item } from './types';

export function isEpic(item: Item): item is Epic {
    return 'stories' in item;
}

export function isStory(item: Item): item is Story {
    return 'i want' in item;
}

export function isTask(item: Item): item is Task {
    // Task is a bit tricky as it can be top-level or a sub-task.
    // We'll rely on the absence of 'stories' and 'i want', and the presence of 'status'.
    // This might need refinement depending on the data structure.
    return !isEpic(item) && !isStory(item) && 'status' in item;
}

export function isSubTask(item: Item): item is SubTask {
    // SubTask is structurally similar to a simple Task but lacks points/sprint.
    // For now, we can differentiate by checking what it's NOT.
    // A more robust way might require a 'type' property on the object itself.
    return !isEpic(item) && !isStory(item) && !('points' in item) && 'status' in item;
}
