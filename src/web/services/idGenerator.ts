import { Item } from '../types';

let nextId = 0;

const assignIdRecursively = (item: Item): void => {
    if (!item.id) {
        item.id = (nextId++).toString();
    }
    if ('stories' in item && item.stories) {
        item.stories.forEach(assignIdRecursively);
    }
    if ('subtasks' in item && item.subtasks) {
        item.subtasks.forEach(assignIdRecursively);
    }
};

export const initializeAndAssignIds = (items: Item[]): void => {
    nextId = 0;
    items.forEach(assignIdRecursively);
};

export const getNextId = (): string => {
    return (nextId++).toString();
};
