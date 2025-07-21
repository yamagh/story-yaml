import { describe, it, expect } from 'vitest';
import * as yaml from 'js-yaml';
import { StoryYamlService } from './StoryYamlService';
import { Item, StoryFile } from '../types';

const initialYamlContent = `
epics:
  - title: Epic 1
    description: Epic 1 Description
    stories:
      - title: Story 1-1
        as: User
        i want: to do something
        so that: I can get a benefit
        description: Story 1-1 Description
        status: ToDo
        points: 8
        sprint: Sprint 1
        definition of done:
          - Done 1
          - Done 2
        sub tasks:
          - title: SubTask 1-1-1
            description: SubTask 1-1-1 Description
            status: ToDo
tasks:
  - title: Task 1
    description: Task 1 Description
    status: ToDo
    points: 5
    sprint: Sprint 1
    sub tasks:
      - title: SubTask T1-1
        description: SubTask T1-1 Description
        status: ToDo
`;

const duplicateTitleYamlContent = `
epics:
  - title: Epic 1
    description: Epic 1 Description
    stories:
      - title: Duplicate Title
        status: ToDo
      - title: Duplicate Title
        status: WIP
tasks:
  - title: Task 1
    description: Task 1 Description
    status: ToDo
`;

describe('StoryYamlService', () => {

    describe('updateStoryContent (addItem)', () => {
        it('should add a new epic', () => {
            const newEpic = {
                title: 'New Epic',
                description: 'A brand new epic',
            };
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'epics',
                values: newEpic as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics).toHaveLength(2);
            expect(parsedResult.epics[1]).toMatchObject(newEpic);
        });

        it('should add a new task', () => {
            const newTask = {
                title: 'New Task',
                description: 'A brand new task',
                status: 'WIP',
            };
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'tasks',
                values: newTask as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.tasks).toHaveLength(2);
            expect(parsedResult.tasks[1]).toMatchObject(newTask);
        });

        it('should add a new story to an epic', () => {
            const newStory = {
                title: 'New Story',
                status: 'Done',
            };
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const parentEpicId = doc.epics[0].id;
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'stories',
                parentId: parentEpicId,
                values: newStory as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories).toHaveLength(2);
            expect(parsedResult.epics[0].stories[1]).toMatchObject(newStory);
        });

        it('should add a new subtask to a story', () => {
            const newSubTask = {
                title: 'New SubTask for Story',
                status: 'ToDo',
            };
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const parentStoryId = doc.epics[0].stories[0].id;
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'subtasks',
                parentId: parentStoryId,
                values: newSubTask as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories[0]['sub tasks']).toHaveLength(2);
            expect(parsedResult.epics[0].stories[0]['sub tasks']![1]).toMatchObject(newSubTask);
        });

        it('should add a new subtask to a task', () => {
            const newSubTask = {
                title: 'New SubTask for Task',
                status: 'WIP',
            };
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const parentTaskId = doc.tasks[0].id;
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'subtasks',
                parentId: parentTaskId,
                values: newSubTask as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.tasks[0]['sub tasks']).toHaveLength(2);
            expect(parsedResult.tasks[0]['sub tasks']![1]).toMatchObject(newSubTask);
        });
    });

    describe('updateStoryContentForItemUpdate', () => {
        it('should update an existing story, including its title', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const storyToUpdateId = doc.epics[0].stories[0].id;
            const updatedStoryData = {
                type: 'stories',
                title: 'Updated Story Title',
                description: 'Updated Description',
                status: 'Done',
                points: 13,
            };
            const result = StoryYamlService.updateStoryContentForItemUpdate(initialYamlContent, {
                id: storyToUpdateId!,
                updatedData: updatedStoryData as Item & { type: string },
            });
            const parsedResult = yaml.load(result) as StoryFile;
            const story = parsedResult.epics[0].stories[0];
            expect(story.title).toBe('Updated Story Title');
            expect(story.description).toBe('Updated Description');
            expect(story.status).toBe('Done');
            expect(story.points).toBe(13);
        });

        it('should update a nested subtask', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const subtaskToUpdateId = doc.epics[0].stories[0]['sub tasks']![0].id;
            const updatedSubTaskData = {
                type: 'subtasks',
                title: 'SubTask 1-1-1',
                status: 'WIP',
            };
            const result = StoryYamlService.updateStoryContentForItemUpdate(initialYamlContent, {
                id: subtaskToUpdateId!,
                updatedData: updatedSubTaskData as Item & { type: string },
            });
            const parsedResult = yaml.load(result) as StoryFile;
            const subtask = parsedResult.epics[0].stories[0]['sub tasks']![0];
            expect(subtask.status).toBe('WIP');
        });

        it('should update the correct item when titles are duplicated', () => {
            const doc = StoryYamlService.loadYaml(duplicateTitleYamlContent);
            const secondStoryId = doc.epics[0].stories[1].id;
            const updatedStoryData = {
                type: 'stories',
                title: 'Unique New Title',
                status: 'Done',
            };
            const result = StoryYamlService.updateStoryContentForItemUpdate(duplicateTitleYamlContent, {
                id: secondStoryId!,
                updatedData: updatedStoryData as Item & { type: string },
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories[0].title).toBe('Duplicate Title');
            expect(parsedResult.epics[0].stories[1].title).toBe('Unique New Title');
            expect(parsedResult.epics[0].stories[1].status).toBe('Done');
        });
    });

    describe('deleteItemFromStoryFile', () => {
        it('should delete a story', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const storyToDeleteId = doc.epics[0].stories[0].id;
            const result = StoryYamlService.deleteItemFromStoryFile(initialYamlContent, { id: storyToDeleteId! });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories.find(s => s.title === 'Story 1-1')).toBeUndefined();
        });

        it('should delete a task', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const taskToDeleteId = doc.tasks[0].id;
            const result = StoryYamlService.deleteItemFromStoryFile(initialYamlContent, { id: taskToDeleteId! });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.tasks.find(t => t.title === 'Task 1')).toBeUndefined();
        });

        it('should delete a subtask', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const subtaskToDeleteId = doc.epics[0].stories[0]['sub tasks']![0].id;
            const result = StoryYamlService.deleteItemFromStoryFile(initialYamlContent, { id: subtaskToDeleteId! });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories[0]['sub tasks']!.find(st => st.title === 'SubTask 1-1-1')).toBeUndefined();
        });

        it('should delete the correct item when titles are duplicated', () => {
            const doc = StoryYamlService.loadYaml(duplicateTitleYamlContent);
            const firstStoryId = doc.epics[0].stories[0].id;
            const result = StoryYamlService.deleteItemFromStoryFile(duplicateTitleYamlContent, { id: firstStoryId! });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories).toHaveLength(1);
            expect(parsedResult.epics[0].stories[0].status).toBe('WIP');
        });
    });

    describe('loadYaml', () => {
        it('should handle yaml content without a tasks field', () => {
            const yamlWithoutTasks = `
epics:
  - title: Epic 1
    description: Epic 1 Description
`;
            const result = StoryYamlService.updateStoryContent(yamlWithoutTasks, {
                itemType: 'tasks',
                values: { title: 'New Task' } as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.tasks).toBeDefined();
            expect(parsedResult.tasks).toHaveLength(1);
            expect(parsedResult.tasks[0].title).toBe('New Task');
        });

        it('should assign unique IDs to all items', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const ids = new Set<string>();
            const checkIds = (items: Item[]) => {
                items.forEach(item => {
                    expect(item.id).toBeDefined();
                    expect(ids.has(item.id!)).toBe(false);
                    ids.add(item.id!);
                    if ('stories' in item && item.stories) {
                        checkIds(item.stories);
                    }
                    if ('sub tasks' in item && item['sub tasks']) {
                        checkIds(item['sub tasks']);
                    }
                });
            };
            checkIds(doc.epics);
            checkIds(doc.tasks);
        });
    });

    describe('saveStoryFile', () => {
        it('should remove id fields before saving', () => {
            const doc = StoryYamlService.loadYaml(initialYamlContent);
            const yamlString = StoryYamlService.saveStoryFile(doc);
            expect(yamlString).not.toContain('id:');
        });
    });
});
