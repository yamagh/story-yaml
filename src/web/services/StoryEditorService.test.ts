import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoryEditorService } from './StoryEditorService';
import { StoryYamlService } from './StoryYamlService';
import { WorkspaceService } from './WorkspaceService';
import { StoryModel } from './StoryModel';
import { AddItemValues } from '../types';

describe('StoryEditorService', () => {
    let editorService: StoryEditorService;
    let workspaceService: WorkspaceService;
    let storyYamlService: StoryYamlService;
    let mockDocument: any;

    beforeEach(() => {
        workspaceService = new WorkspaceService();
        storyYamlService = new StoryYamlService();
        editorService = new StoryEditorService(workspaceService, storyYamlService);

        mockDocument = {
            uri: { path: '/fake/document.yaml' },
            getText: () => '',
        };
    });

    it('should call storyModel.addItem with "subtasks" when adding a subtask', async () => {
        const storyModel = new StoryModel({ epics: [], tasks: [] });
        const addItemSpy = vi.spyOn(storyModel, 'addItem');
        
        vi.spyOn(storyYamlService, 'load').mockReturnValue(storyModel);
        vi.spyOn(workspaceService, 'readDocument').mockReturnValue('');
        vi.spyOn(storyYamlService, 'save').mockReturnValue('');
        vi.spyOn(workspaceService, 'applyEdit').mockResolvedValue(undefined);

        const newSubtask: AddItemValues = { title: 'New Subtask', status: 'ToDo' };
        await editorService.addItem(mockDocument, {
            itemType: 'subtask',
            parentId: 'story1',
            values: newSubtask,
        });

        expect(addItemSpy).toHaveBeenCalledWith('subtasks', newSubtask, 'story1');
    });
});
