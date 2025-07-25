import * as assert from 'assert';
import * as yaml from 'js-yaml';
import { StoryYamlService } from '../../services/StoryYamlService';
import { StoryFile, WebviewMessage } from '../../types';

suite('Extension Logic Test Suite', () => {

    test('updateStoryContent should add a new epic', () => {
        const initialContent = '';
        const newItem: Extract<WebviewMessage, { command: 'addItem' }>['item'] = {
            itemType: 'epics',
            values: { title: 'New Epic' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem)) as StoryFile;
        assert.strictEqual(updatedDoc.epics[0].title, 'New Epic');
    });

    test('updateStoryContent should add a new story to an epic', () => {
        const initialContent = yaml.dump({ epics: [{ title: 'Parent Epic', stories: [] }] });
        const doc = StoryYamlService.loadYaml(initialContent);
        const parentEpicId = doc.epics[0].id;
        const newItem: Extract<WebviewMessage, { command: 'addItem' }>['item'] = {
            itemType: 'stories',
            parentId: parentEpicId,
            values: { title: 'New Story' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem)) as StoryFile;
        assert.strictEqual(updatedDoc.epics[0].stories.length, 1);
        assert.strictEqual(updatedDoc.epics[0].stories[0].title, 'New Story');
    });

    test('updateStoryContent should add a new root task', () => {
        const initialContent = yaml.dump({ tasks: [] });
        const newItem: Extract<WebviewMessage, { command: 'addItem' }>['item'] = {
            itemType: 'tasks',
            values: { title: 'New Root Task' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem)) as StoryFile;
        assert.strictEqual(updatedDoc.tasks[0].title, 'New Root Task');
    });

    test('updateStoryContent should add a new sub-task to a story', () => {
        const initialContent = yaml.dump({ epics: [{ title: 'Epic', stories: [{ title: 'Parent Story', 'sub tasks': [] }] }] });
        const doc = StoryYamlService.loadYaml(initialContent);
        const parentStoryId = doc.epics[0].stories[0].id;
        const newItem: Extract<WebviewMessage, { command: 'addItem' }>['item'] = {
            itemType: 'subtasks',
            parentId: parentStoryId,
            values: { title: 'New Sub-task', status: 'ToDo' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem)) as StoryFile;
        const subTasks = updatedDoc.epics[0].stories[0]['sub tasks'];
        assert.strictEqual(subTasks?.length, 1);
        assert.deepStrictEqual(subTasks?.[0], { title: 'New Sub-task', status: 'ToDo' });
    });
});

suite('Item Update Logic Test Suite', () => {
    let initialDoc: StoryFile;

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
        const doc = StoryYamlService.loadYaml(initialContent);
        const epicToUpdateId = doc.epics[0].id;
        const itemToUpdate: Extract<WebviewMessage, { command: 'updateItem' }>['item'] = {
            id: epicToUpdateId!,
            updatedData: { type: 'epics', description: 'Updated epic description' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as StoryFile;
        assert.strictEqual(updatedDoc.epics[0].description, 'Updated epic description');
    });

    test('should update an existing story', () => {
        const initialContent = yaml.dump(initialDoc);
        const doc = StoryYamlService.loadYaml(initialContent);
        const storyToUpdateId = doc.epics[0].stories[0].id;
        const itemToUpdate: Extract<WebviewMessage, { command: 'updateItem' }>['item'] = {
            id: storyToUpdateId!,
            updatedData: { type: 'stories', status: 'WIP' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as StoryFile;
        assert.strictEqual(updatedDoc.epics[0].stories[0].status, 'WIP');
    });

    test('should update an existing root task', () => {
        const initialContent = yaml.dump(initialDoc);
        const doc = StoryYamlService.loadYaml(initialContent);
        const taskToUpdateId = doc.tasks[0].id;
        const itemToUpdate: Extract<WebviewMessage, { command: 'updateItem' }>['item'] = {
            id: taskToUpdateId!,
            updatedData: { type: 'tasks', status: 'Done' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as StoryFile;
        assert.strictEqual(updatedDoc.tasks[0].status, 'Done');
    });

    test('should update a nested sub-task', () => {
        const initialContent = yaml.dump(initialDoc);
        const doc = StoryYamlService.loadYaml(initialContent);
        const subtaskToUpdateId = doc.epics[0].stories[0]['sub tasks']![0].id;
        const itemToUpdate: Extract<WebviewMessage, { command: 'updateItem' }>['item'] = {
            id: subtaskToUpdateId!,
            updatedData: { type: 'subtasks', status: 'WIP' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate)) as StoryFile;
        assert.strictEqual(updatedDoc.epics[0].stories[0]['sub tasks']![0].status, 'WIP');
    });
});


suite('Item Deletion Logic Test Suite', () => {
    let initialDoc: StoryFile;

    setup(() => {
        initialDoc = {
            epics: [{
                title: 'Epic With Story',
                stories: [{ title: 'Story To Delete', status: 'ToDo' }]
            }],
            tasks: [{
                title: 'Task To Delete',
                status: 'ToDo',
                'sub tasks': [{ title: 'Sub-task To Keep', status: 'ToDo' }]
            }]
        };
    });

    test('should delete a story from an epic', () => {
        const initialContent = yaml.dump(initialDoc);
        const doc = StoryYamlService.loadYaml(initialContent);
        const storyToDeleteId = doc.epics[0].stories[0].id;
        const itemToDelete = { id: storyToDeleteId! };
        const updatedDoc = yaml.load(StoryYamlService.deleteItemFromStoryFile(initialContent, itemToDelete)) as StoryFile;
        assert.strictEqual(updatedDoc.epics[0].stories.length, 0);
    });

    test('should delete a root task', () => {
        const initialContent = yaml.dump(initialDoc);
        const doc = StoryYamlService.loadYaml(initialContent);
        const taskToDeleteId = doc.tasks[0].id;
        const itemToDelete = { id: taskToDeleteId! };
        const updatedDoc = yaml.load(StoryYamlService.deleteItemFromStoryFile(initialContent, itemToDelete)) as StoryFile;
        assert.strictEqual(updatedDoc.tasks.length, 0);
    });
});

