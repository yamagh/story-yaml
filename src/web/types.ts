export type Status = 'ToDo' | 'WIP' | 'Done';

export interface SubTask {
  id?: string;
  title: string;
  description?: string;
  status: Status;
}



export interface Story {
  id?: string;
  title: string;
  as?: string;
  'i want'?: string;
  'so that'?: string;
  description?: string;
  status: Status;
  points?: number;
  sprint?: string;
  'definition of done'?: string[];
  'subtasks'?: SubTask[];
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: Status;
  points?: number;
  sprint?: string;
  'definition of done'?: string[];
  'subtasks'?: SubTask[];
}

export interface Epic {
  id?: string;
  title: string;
  description?: string;
  stories: Story[];
}

export interface StoryFile {
  epics: Epic[];
  tasks: Task[];
}

export type Item = (Epic | Story | Task | SubTask) & { id?: string };
export type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

export type AddItemValues = 
    Omit<Epic, 'id' | 'stories'> |
    (Omit<Story, 'id' | 'subtasks' | 'status'> & { status?: Status }) |
    (Omit<Task, 'id' | 'subtasks' | 'status'> & { status?: Status }) |
    Omit<SubTask, 'id'>;

export type UpdateItemValues = Partial<Item> & { type: string };

// WebView to Extension
export type WebviewMessage =
    | { command: 'ready' }
    | { command: 'addItem'; item: { itemType: 'epic' | 'userStory' | 'task' | 'bug' | 'subtask'; parentId?: string; values: AddItemValues } }
    | { command: 'updateItem'; item: { id: string, updatedData: UpdateItemValues } }
    | { command: 'deleteItem'; item: { id: string } }
    | { command: 'updateStoryFile'; storyFile: StoryFile };

export type ExtensionMessage =
    | { command: 'update'; storyFile: StoryFile, newId?: string }
    | { command: 'yamlError'; error: string };

export type UiItemType = 'epic' | 'userStory' | 'task' | 'bug' | 'subtask';
export type DataItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

export const uiToDataMap: Record<UiItemType, DataItemType> = {
    epic: 'epics',
    userStory: 'stories',
    task: 'tasks',
    bug: 'tasks', // Bugs are treated as tasks in the data layer
    subtask: 'subtasks',
};

// Custom Errors
export class YamlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YamlParseError';
  }
}

export class FileUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileUpdateError';
  }
}
