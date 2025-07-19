import * as assert from 'assert';
import * as yaml from 'js-yaml';
import { updateStoryContent, updateStoryContentForItemUpdate } from '../../extension';

suite('Extension Logic Test Suite', () => {

    test('updateStoryContent should add a new epic', () => {
        const initialContent = '';
        const newItem = {
            itemType: 'epics',
            data: { title: 'New Epic' }
        };
        const updatedDoc = yaml.load(updateStoryContent(initialContent, newItem)) as any;
        assert.strictEqual(updatedDoc.epics.length, 1);
        assert.strictEqual(updatedDoc.epics[0].title, 'New Epic');
    });

    test('updateStoryContent should add a new story to an epic', () => {
        const initialContent = yaml.dump({ epics: [{ title: 'Parent Epic', stories: [] }] });
        const newItem = {
            itemType: 'stories',
            parentId: 'Parent Epic',
            data: { title: 'New Story' }
        };
        const updatedDoc = yaml.load(updateStoryContent(initialContent, newItem)) as any;
        assert.strictEqual(updatedDoc.epics[0].stories.length, 1);
        assert.strictEqual(updatedDoc.epics[0].stories[0].title, 'New Story');
    });

    test('updateStoryContent should add a new root task', () => {
        const initialContent = yaml.dump({ tasks: [] });
        const newItem = {
            itemType: 'tasks',
            data: { title: 'New Root Task' }
        };
        const updatedDoc = yaml.load(updateStoryContent(initialContent, newItem)) as any;
        assert.strictEqual(updatedDoc.tasks.length, 1);
        assert.strictEqual(updatedDoc.tasks[0].title, 'New Root Task');
    });

    test('updateStoryContent should add a new sub-task to a story', () => {
        const initialContent = yaml.dump({ epics: [{ title: 'Epic', stories: [{ title: 'Parent Story', 'sub tasks': [] }] }] });
        const newItem = {
            itemType: 'subtasks',
            parentId: 'Parent Story',
            data: { title: 'New Sub-task', status: 'ToDo' }
        };
        const updatedDoc = yaml.load(updateStoryContent(initialContent, newItem)) as any;
        const subTasks = updatedDoc.epics[0].stories[0]['sub tasks'];
        assert.strictEqual(subTasks.length, 1);
        assert.strictEqual(subTasks[0].title, 'New Sub-task');
        assert.deepStrictEqual(subTasks[0], { title: 'New Sub-task', status: 'ToDo' });
    });
});

suite('Item Update Logic Test Suite', () => {
    let initialDoc: any;

    setup(() => {
        initialDoc = {
            epics: [{
                title: 'Epic To Edit',
                description: 'Initial epic description',
                stories: [{
                    title: 'Story to Edit',
                    description: 'Initial story description',
                    status: 'ToDo',
                    'sub tasks': [{ title: 'Sub-task to Edit', status: 'ToDo' }]
                }]
            }],
            tasks: [{
                title: 'Task to Edit',
                description: 'Initial task description',
                status: 'ToDo'
            }]
        };
    });

    test('should update an existing epic', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            itemType: 'epics',
            originalTitle: 'Epic To Edit',
            data: { description: 'Updated epic description' }
        };
        const updatedDoc = yaml.load(updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as any;
        assert.strictEqual(updatedDoc.epics[0].description, 'Updated epic description');
    });

    test('should update an existing story', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            itemType: 'stories',
            originalTitle: 'Story to Edit',
            data: { status: 'WIP' }
        };
        const updatedDoc = yaml.load(updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as any;
        assert.strictEqual(updatedDoc.epics[0].stories[0].status, 'WIP');
    });

    test('should update an existing root task', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            itemType: 'tasks',
            originalTitle: 'Task to Edit',
            data: { status: 'Done' }
        };
        const updatedDoc = yaml.load(updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as any;
        assert.strictEqual(updatedDoc.tasks[0].status, 'Done');
    });

    test('should update a nested sub-task', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            itemType: 'subtasks',
            originalTitle: 'Sub-task to Edit',
            data: { status: 'In Progress' }
        };
        const updatedDoc = yaml.load(updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as any;
        assert.strictEqual(updatedDoc.epics[0].stories[0]['sub tasks'][0].status, 'In Progress');
    });
});
