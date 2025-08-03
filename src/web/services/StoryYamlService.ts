import * as yaml from 'js-yaml';
import { StoryFile, Item, Story, SubTask, YamlParseError, Epic, Task } from '../types';
import { initializeAndAssignIds } from './idGenerator';
import { StoryModel } from './StoryModel';

export class StoryYamlService {

    private assignTypes(epics: Epic[], tasks: Task[]): void {
        epics.forEach(epic => {
            epic.type = 'Epic';
            if (epic.stories) {
                epic.stories.forEach(story => {
                    story.type = 'Story';
                    if (story.subtasks) {
                        story.subtasks.forEach(subtask => {
                            subtask.type = 'SubTask';
                        });
                    }
                });
            }
        });
        tasks.forEach(task => {
            task.type = 'Task';
            if (task.subtasks) {
                task.subtasks.forEach(subtask => {
                    subtask.type = 'SubTask';
                });
            }
        });
    }

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
            
            this.assignTypes(validatedDoc.epics, validatedDoc.tasks);
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

    private cleanItemsForSave(items: Item[]): Omit<Item, 'id' | 'type'>[] {
        return items.map(item => {
            const { id: _id, type: _type, ...rest } = item;
            if ('stories' in rest && rest.stories) {
                rest.stories = this.cleanItemsForSave(rest.stories) as Story[];
            }
            if ('subtasks' in rest && rest.subtasks) {
                rest.subtasks = this.cleanItemsForSave(rest.subtasks) as SubTask[];
            }
            return rest;
        });
    }

    public save(storyModel: StoryModel): string {
        const storyFile = storyModel.getStoryFile();
        const cleanEpics = this.cleanItemsForSave(storyFile.epics);
        const cleanTasks = this.cleanItemsForSave(storyFile.tasks);
        return yaml.dump({ epics: cleanEpics, tasks: cleanTasks });
    }
}
