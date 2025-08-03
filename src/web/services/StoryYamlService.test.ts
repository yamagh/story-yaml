import { describe, it, expect } from 'vitest';
import { StoryYamlService } from './StoryYamlService';
import { StoryModel } from './StoryModel';
import { Item } from '../types';

const initialYamlContent = `
epics:
  - title: Epic 1
    description: Epic 1 Description
    stories:
      - title: Story 1.1
        as: User
        i want: to do something
        so that: I can achieve a goal
        status: ToDo
        subtasks:
          - title: Subtask 1.1.1
            status: ToDo
      - title: Story 1.2
        as: Another User
        i want: to do another thing
        so that: I can achieve another goal
        status: WIP
tasks:
  - title: Task 1
    description: A standalone task
    status: Done
`;

describe('StoryYamlService', () => {
    const storyYamlService = new StoryYamlService();
    describe('load', () => {
        it('should return a StoryModel instance', () => {
            const model = storyYamlService.load(initialYamlContent);
            expect(model).toBeInstanceOf(StoryModel);
        });

        it('should handle empty yaml content', () => {
            const model = storyYamlService.load('');
            expect(model).toBeInstanceOf(StoryModel);
            expect(model.getStoryFile().epics).toEqual([]);
            expect(model.getStoryFile().tasks).toEqual([]);
        });

        it('should handle yaml content without a tasks field', () => {
            const yamlWithoutTasks = `
epics:
  - title: Epic 1
    description: Epic 1 Description
`;
            const model = storyYamlService.load(yamlWithoutTasks);
            const storyFile = model.getStoryFile();
            expect(storyFile.tasks).toBeDefined();
            expect(storyFile.tasks).toHaveLength(0);
        });

        it('should assign unique IDs to all items', () => {
            const model = storyYamlService.load(initialYamlContent);
            const storyFile = model.getStoryFile();
            const ids = new Set<string>();
            const checkIds = (items: Item[]) => {
                items.forEach(item => {
                    expect(item.id).toBeDefined();
                    expect(ids.has(item.id!)).toBe(false);
                    ids.add(item.id!);
                    if ('stories' in item && item.stories) {
                        checkIds(item.stories);
                    }
                    if ('subtasks' in item && item.subtasks) {
                        checkIds(item.subtasks);
                    }
                });
            };
            checkIds([...storyFile.epics, ...storyFile.tasks]);
            expect(ids.size).toBe(5); // 1 epic, 2 stories, 1 subtask, 1 task
        });
    });

    describe('save', () => {
        it('should remove id fields before saving', () => {
            const model = storyYamlService.load(initialYamlContent);
            const yamlString = storyYamlService.save(model);
            expect(yamlString).not.toContain('id:');
        });

        it('should produce a valid YAML string', () => {
            const model = storyYamlService.load(initialYamlContent);
            const yamlString = storyYamlService.save(model);
            // A simple check to see if it's still valid YAML
            const reloadedModel = storyYamlService.load(yamlString);
            expect(reloadedModel.getStoryFile().epics[0].title).toBe('Epic 1');
        });
    });
});