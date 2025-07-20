import * as assert from 'assert';
import * as yaml from 'js-yaml';
import { StoryYamlService } from '../../services/StoryYamlService';
import { Item, Epic, Story, Task, SubTask } from '../../types';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

suite('Extension Logic Test Suite', () => {

    test('updateStoryContent should add a new epic', () => {
        const initialContent = '';
        const newItem = {
            itemType: 'epics',
            values: { title: 'New Epic' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem as any)) as any;
        assert.strictEqual(updatedDoc.epics[0].title, 'New Epic');
    });

    test('updateStoryContent should add a new story to an epic', () => {
        const initialContent = yaml.dump({ epics: [{ title: 'Parent Epic', stories: [] }] });
        const newItem = {
            itemType: 'stories',
            parentTitle: 'Parent Epic',
            values: { title: 'New Story' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem as any)) as any;
        assert.strictEqual(updatedDoc.epics[0].stories.length, 1);
        assert.strictEqual(updatedDoc.epics[0].stories[0].title, 'New Story');
    });

    test('updateStoryContent should add a new root task', () => {
        const initialContent = yaml.dump({ tasks: [] });
        const newItem = {
            itemType: 'tasks',
            values: { title: 'New Root Task' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem as any)) as any;
        assert.strictEqual(updatedDoc.tasks[0].title, 'New Root Task');
    });

    test('updateStoryContent should add a new sub-task to a story', () => {
        const initialContent = yaml.dump({ epics: [{ title: 'Epic', stories: [{ title: 'Parent Story', 'sub tasks': [] }] }] });
        const newItem = {
            itemType: 'subtasks',
            parentTitle: 'Parent Story',
            values: { title: 'New Sub-task', status: 'ToDo' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContent(initialContent, newItem as any)) as any;
        const subTasks = updatedDoc.epics[0].stories[0]['sub tasks'];
        assert.strictEqual(subTasks.length, 1);
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
            originalTitle: 'Epic To Edit',
            updatedData: { type: 'epics', description: 'Updated epic description' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate as any)) as any;
        assert.strictEqual(updatedDoc.epics[0].description, 'Updated epic description');
    });

    test('should update an existing story', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            originalTitle: 'Story to Edit',
            updatedData: { type: 'stories', status: 'WIP' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate as any)) as any;
        assert.strictEqual(updatedDoc.epics[0].stories[0].status, 'WIP');
    });

    test('should update an existing root task', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            originalTitle: 'Task to Edit',
            updatedData: { type: 'tasks', status: 'Done' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate as any)) as any;
        assert.strictEqual(updatedDoc.tasks[0].status, 'Done');
    });

    test('should update a nested sub-task', () => {
        const initialContent = yaml.dump(initialDoc);
        const itemToUpdate = {
            originalTitle: 'Sub-task to Edit',
            updatedData: { type: 'subtasks', status: 'WIP' }
        };
        const updatedDoc = yaml.load(StoryYamlService.updateStoryContentForItemUpdate(initialContent, itemToUpdate as any)) as any;
        assert.strictEqual(updatedDoc.epics[0].stories[0]['sub tasks'][0].status, 'WIP');
    });
});
