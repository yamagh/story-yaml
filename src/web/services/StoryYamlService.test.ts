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
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'stories',
                parentTitle: 'Epic 1',
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
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'subtasks',
                parentTitle: 'Story 1-1',
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
            const result = StoryYamlService.updateStoryContent(initialYamlContent, {
                itemType: 'subtasks',
                parentTitle: 'Task 1',
                values: newSubTask as Omit<Item, 'stories' | 'sub tasks'>,
            });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.tasks[0]['sub tasks']).toHaveLength(2);
            expect(parsedResult.tasks[0]['sub tasks']![1]).toMatchObject(newSubTask);
        });
    });

    describe('updateStoryContentForItemUpdate', () => {
        it('should update an existing story, including its title', () => {
            const updatedStoryData = {
                type: 'stories',
                title: 'Updated Story Title',
                description: 'Updated Description',
                status: 'Done',
                points: 13,
            };
            const result = StoryYamlService.updateStoryContentForItemUpdate(initialYamlContent, {
                originalTitle: 'Story 1-1',
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
            const updatedSubTaskData = {
                type: 'subtasks',
                title: 'SubTask 1-1-1',
                status: 'WIP',
            };
            const result = StoryYamlService.updateStoryContentForItemUpdate(initialYamlContent, {
                originalTitle: 'SubTask 1-1-1',
                updatedData: updatedSubTaskData as Item & { type: string },
            });
            const parsedResult = yaml.load(result) as StoryFile;
            const subtask = parsedResult.epics[0].stories[0]['sub tasks']![0];
            expect(subtask.status).toBe('WIP');
        });
    });

    describe('deleteItemFromStoryFile', () => {
        it('should delete a story', () => {
            const result = StoryYamlService.deleteItemFromStoryFile(initialYamlContent, { title: 'Story 1-1' });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories.find(s => s.title === 'Story 1-1')).toBeUndefined();
        });

        it('should delete a task', () => {
            const result = StoryYamlService.deleteItemFromStoryFile(initialYamlContent, { title: 'Task 1' });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.tasks.find(t => t.title === 'Task 1')).toBeUndefined();
        });

        it('should delete a subtask', () => {
            const result = StoryYamlService.deleteItemFromStoryFile(initialYamlContent, { title: 'SubTask 1-1-1' });
            const parsedResult = yaml.load(result) as StoryFile;
            expect(parsedResult.epics[0].stories[0]['sub tasks']!.find(st => st.title === 'SubTask 1-1-1')).toBeUndefined();
        });
    });
});
