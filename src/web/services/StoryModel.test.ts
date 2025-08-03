import { describe, it, expect, beforeEach } from 'vitest';
import { StoryModel } from './StoryModel';
import { StoryFile, AddItemValues } from '../types';

const getInitialStoryFile = (): StoryFile => ({
    epics: [
        {
            title: 'Epic 1',
            description: 'Epic 1 Description',
            stories: [
                {
                    title: 'Story 1.1',
                    as: 'User',
                    'i want': 'to do something',
                    'so that': 'I can achieve a goal',
                    status: 'ToDo',
                    subtasks: [
                        {
                            title: 'Subtask 1.1.1',
                            status: 'ToDo',
                        },
                    ],
                },
            ],
        },
    ],
    tasks: [
        {
            title: 'Task 1',
            description: 'A standalone task',
            status: 'Done',
            subtasks: [],
        },
    ],
});


describe('StoryModel', () => {
    let storyModel: StoryModel;
    let initialStoryFile: StoryFile;

    beforeEach(() => {
        initialStoryFile = getInitialStoryFile();
        storyModel = new StoryModel(initialStoryFile);
    });

    it('should assign unique IDs and types to all items on construction', () => {
        const storyFile = storyModel.getStoryFile();
        const epic = storyFile.epics[0];
        const story = epic.stories![0];
        const subtask = story.subtasks![0];
        const task = storyFile.tasks[0];

        expect(epic.id).toBeDefined();
        expect(epic.type).toBe('Epic');
        expect(story.id).toBeDefined();
        expect(story.type).toBe('Story');
        expect(subtask.id).toBeDefined();
        expect(subtask.type).toBe('SubTask');
        expect(task.id).toBeDefined();
        expect(task.type).toBe('Task');
    });

    describe('addItem', () => {
        it('should add a new epic with the correct type', () => {
            const newEpic: AddItemValues = {
                title: 'New Epic',
                description: 'A brand new epic',
            };
            storyModel.addItem('epics', newEpic);
            const epics = storyModel.getStoryFile().epics;
            expect(epics).toHaveLength(2);
            expect(epics[1].title).toBe('New Epic');
            expect(epics[1].type).toBe('Epic');
        });

        it('should add a new story to an epic with the correct type', () => {
            const newStory: AddItemValues = {
                title: 'New Story',
                as: 'Dev',
                'i want': 'to add a story',
                'so that': 'it is tested',
                status: 'Done',
            };
            const parentEpicId = storyModel.getStoryFile().epics[0].id!;
            storyModel.addItem('stories', newStory, parentEpicId);
            const epic = storyModel.getStoryFile().epics[0];
            expect(epic.stories).toHaveLength(2);
            expect(epic.stories![1].title).toBe('New Story');
            expect(epic.stories![1].type).toBe('Story');
        });
    });

    describe('updateItem', () => {
        it('should update an existing story', () => {
            const storyToUpdateId = storyModel.getStoryFile().epics[0].stories![0].id!;
            const updatedStoryData = {
                title: 'Updated Story Title',
                status: 'Done',
            };
            storyModel.updateItem(storyToUpdateId, updatedStoryData);
            const updatedStory = storyModel.getStoryFile().epics[0].stories![0];
            expect(updatedStory.title).toBe('Updated Story Title');
            expect(updatedStory.status).toBe('Done');
        });

        it('should update a nested subtask', () => {
            const subtaskToUpdateId = storyModel.getStoryFile().epics[0].stories![0].subtasks![0].id!;
            const updatedSubTaskData = {
                status: 'WIP',
            };
            storyModel.updateItem(subtaskToUpdateId, updatedSubTaskData);
            const updatedSubtask = storyModel.getStoryFile().epics[0].stories![0].subtasks![0];
            expect(updatedSubtask.status).toBe('WIP');
        });
    });

    describe('deleteItem', () => {
        it('should delete a story', () => {
            const storyToDeleteId = storyModel.getStoryFile().epics[0].stories![0].id!;
            storyModel.deleteItem(storyToDeleteId);
            const epic = storyModel.getStoryFile().epics[0];
            expect(epic.stories).toHaveLength(0);
        });

        it('should delete a task', () => {
            const taskToDeleteId = storyModel.getStoryFile().tasks[0].id!;
            storyModel.deleteItem(taskToDeleteId);
            const tasks = storyModel.getStoryFile().tasks;
            expect(tasks).toHaveLength(0);
        });
    });

    describe('findParent', () => {
        it('should find the parent of a story', () => {
            const storyId = storyModel.getStoryFile().epics[0].stories![0].id!;
            const parent = storyModel.findParent(storyId);
            expect(parent).toBeDefined();
            expect(parent!.id).toBe(storyModel.getStoryFile().epics[0].id);
            expect(parent!.title).toBe('Epic 1');
        });

        it('should return null for a top-level item', () => {
            const epicId = storyModel.getStoryFile().epics[0].id!;
            const parent = storyModel.findParent(epicId);
            expect(parent).toBeNull();
        });
    });
});
