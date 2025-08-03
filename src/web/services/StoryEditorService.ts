import * as vscode from 'vscode';
import { StoryFile, AddItemValues, UpdateItemValues, UiItemType, uiToDataMap } from '../types';
import { StoryModel } from './StoryModel';
import { StoryYamlService } from './StoryYamlService';
import { WorkspaceService } from './WorkspaceService';

export class StoryEditorService {
    private readonly workspaceService: WorkspaceService;
    private readonly storyYamlService: StoryYamlService;

    constructor(workspaceService: WorkspaceService, storyYamlService: StoryYamlService) {
        this.workspaceService = workspaceService;
        this.storyYamlService = storyYamlService;
    }

    private async applyStoryChange(
        document: vscode.TextDocument,
        change: (storyModel: StoryModel) => void
    ): Promise<StoryFile> {
        const content = this.workspaceService.readDocument(document);
        const storyModel = this.storyYamlService.load(content);
        
        change(storyModel);
        
        const newContent = this.storyYamlService.save(storyModel);
        await this.workspaceService.applyEdit(document, newContent);
        
        return storyModel.getStoryFile();
    }

    public async addItem(
        document: vscode.TextDocument,
        item: { itemType: UiItemType, values: AddItemValues, parentId?: string }
    ): Promise<{ storyFile: StoryFile, newId: string }> {
        let newId = '';
        const storyFile = await this.applyStoryChange(document, (storyModel) => {
            const mappedItemType = uiToDataMap[item.itemType];
            newId = storyModel.addItem(mappedItemType, item.values, item.parentId);
        });
        return { storyFile, newId };
    }

    public async updateItem(
        document: vscode.TextDocument,
        item: { id: string, updatedData: UpdateItemValues }
    ): Promise<StoryFile> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type: _type, ...newData } = item.updatedData;
        return this.applyStoryChange(document, (storyModel) => {
            storyModel.updateItem(item.id, newData);
        });
    }



    public async deleteItem(
        document: vscode.TextDocument,
        item: { id: string }
    ): Promise<StoryFile> {
        return this.applyStoryChange(document, (storyModel) => {
            storyModel.deleteItem(item.id);
        });
    }

    public async updateStory(
        document: vscode.TextDocument,
        storyFile: StoryFile
    ): Promise<StoryFile> {
        const storyModel = new StoryModel(storyFile);
        const newContent = this.storyYamlService.save(storyModel);
        await this.workspaceService.applyEdit(document, newContent);
        return storyModel.getStoryFile();
    }
}
