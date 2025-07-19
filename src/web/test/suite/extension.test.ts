import * as assert from 'assert';
import * as yaml from 'js-yaml';
import { updateStoryContent } from '../../extension';

suite('Extension Logic Test Suite', () => {

    test('updateStoryContent should add a new epic to an empty document', () => {
        const initialContent = '';
        const newItem = {
            itemType: 'epics',
            data: {
                title: 'New Test Epic',
                description: 'A description for the new epic.',
            }
        };

        const updatedYaml = updateStoryContent(initialContent, newItem);
        const updatedDoc = yaml.load(updatedYaml) as any;

        assert.ok(updatedDoc.epics, "epics array should exist");
        assert.strictEqual(updatedDoc.epics.length, 1, "A new epic should be added");
        assert.strictEqual(updatedDoc.epics[0].title, 'New Test Epic', "Epic title is incorrect");
    });

    test('updateStoryContent should add a new epic to an existing document', () => {
        const initialDoc = {
            epics: [{ title: 'Existing Epic' }],
            tasks: []
        };
        const initialContent = yaml.dump(initialDoc);
        const newItem = {
            itemType: 'epics',
            data: {
                title: 'Another Epic',
                description: 'Another description.',
            }
        };

        const updatedYaml = updateStoryContent(initialContent, newItem);
        const updatedDoc = yaml.load(updatedYaml) as any;

        assert.strictEqual(updatedDoc.epics.length, 2, "Should have two epics now");
        assert.strictEqual(updatedDoc.epics[1].title, 'Another Epic', "The new epic was not added correctly");
    });

    test('updateStoryContent should add a new story to an existing epic', () => {
        const initialDoc = {
            epics: [{ title: 'Parent Epic', stories: [] }],
            tasks: []
        };
        const initialContent = yaml.dump(initialDoc);
        const newStory = {
            itemType: 'stories',
            parentId: 'Parent Epic',
            data: {
                title: 'New Story',
                status: 'ToDo'
            }
        };

        const updatedYaml = updateStoryContent(initialContent, newStory);
        const updatedDoc = yaml.load(updatedYaml) as any;

        assert.strictEqual(updatedDoc.epics[0].stories.length, 1, "Story should be added to the epic");
        assert.strictEqual(updatedDoc.epics[0].stories[0].title, 'New Story', "Story title is incorrect");
    });

    test('updateStoryContent should add a new sub-task to an existing story', () => {
        const initialDoc = {
            epics: [{
                title: 'Parent Epic',
                stories: [{
                    title: 'Parent Story',
                    'sub tasks': []
                }]
            }],
            tasks: []
        };
        const initialContent = yaml.dump(initialDoc);
        const newTask = {
            itemType: 'tasks',
            parentId: 'Parent Story',
            data: {
                title: 'New Sub-Task'
            }
        };

        const updatedYaml = updateStoryContent(initialContent, newTask);
        const updatedDoc = yaml.load(updatedYaml) as any;
        
        assert.strictEqual(updatedDoc.epics[0].stories[0]['sub tasks'].length, 1, "Sub-task should be added");
        assert.strictEqual(updatedDoc.epics[0].stories[0]['sub tasks'][0], 'New Sub-Task', "Sub-task content is incorrect");
    });

     test('updateStoryContent should add a new task to the root if parent story is not found', () => {
        const initialDoc = {
            epics: [],
            tasks: []
        };
        const initialContent = yaml.dump(initialDoc);
        const newTask = {
            itemType: 'tasks',
            parentId: 'Non-existent Story',
            data: {
                title: 'Orphan Task',
                status: 'ToDo'
            }
        };

        const updatedYaml = updateStoryContent(initialContent, newTask);
        const updatedDoc = yaml.load(updatedYaml) as any;

        assert.strictEqual(updatedDoc.tasks.length, 1, "Task should be added to the root tasks array");
        assert.strictEqual(updatedDoc.tasks[0].title, 'Orphan Task', "Root task title is incorrect");
    });
});
