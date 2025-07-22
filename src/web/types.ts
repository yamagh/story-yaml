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
  'sub tasks'?: SubTask[];
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  status: Status;
  points?: number;
  sprint?: string;
  'definition of done'?: string[];
  'sub tasks'?: SubTask[];
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
    (Omit<Story, 'id' | 'sub tasks' | 'status'> & { status?: Status }) |
    (Omit<Task, 'id' | 'sub tasks' | 'status'> & { status?: Status }) |
    Omit<SubTask, 'id'>;

// WebView to Extension
export type WebviewMessage =
    | { command: 'ready' }
    | { command: 'addItem'; item: { itemType: string; parentId?: string; values: AddItemValues } }
    | { command: 'updateItem'; item: { id: string, updatedData: Partial<Item> & { type: string } } }
    | { command: 'deleteItem'; item: { id: string } }
    | { command: 'updateStoryFile'; storyFile: StoryFile };

export type ExtensionMessage =
    | { command: 'update'; storyFile: StoryFile }
    | { command: 'yamlError'; error: string };
