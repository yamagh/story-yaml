import * as yaml from 'js-yaml';
import { StoryFile, Item, Story, SubTask, YamlParseError } from '../types';
import { initializeAndAssignIds } from './idGenerator';
import { StoryModel } from './StoryModel';

export class StoryYamlService {

    public load(content: string): StoryModel {
        try {
            const doc = yaml.load(content) as StoryFile | null;
            const validatedDoc = doc || { epics: [], tasks: [] };
            if (!validatedDoc.epics) {
                validatedDoc.epics = [];
            }
            if (!validatedDoc.tasks) {
                validatedDoc.tasks = [];
            }
            
            const allItems = [...validatedDoc.epics, ...validatedDoc.tasks];
            initializeAndAssignIds(allItems);
            
            return new StoryModel(validatedDoc);
        } catch (e) {
            if (e instanceof yaml.YAMLException) {
                throw new YamlParseError(`Failed to parse YAML: ${e.message}`);
            }
            throw e;
        }
    }

    private removeIds(items: Item[]): Omit<Item, 'id'>[] {
        return items.map(item => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, ...rest } = item;
            if ('stories' in rest && rest.stories) {
                rest.stories = this.removeIds(rest.stories) as Story[];
            }
            if ('subtasks' in rest && rest.subtasks) {
                rest.subtasks = this.removeIds(rest.subtasks) as SubTask[];
            }
            return rest;
        });
    }

    public save(storyModel: StoryModel): string {
        const storyFile = storyModel.getStoryFile();
        const cleanEpics = this.removeIds(storyFile.epics);
        const cleanTasks = this.removeIds(storyFile.tasks);
        return yaml.dump({ epics: cleanEpics, tasks: cleanTasks });
    }
}
