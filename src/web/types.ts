export type Status = 'ToDo' | 'WIP' | 'Done';

export interface SubTask {
  title: string;
  description?: string;
  status: Status;
}

export interface DefinitionOfDone {
  [key: string]: any; // Allow flexible structure for now
}

export interface Story {
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
  title: string;
  description?: string;
  status: Status;
  points?: number;
  sprint?: string;
  'definition of done'?: string[];
  'sub tasks'?: SubTask[];
}

export interface Epic {
  title: string;
  description?: string;
  stories: Story[];
}

export interface StoryFile {
  epics: Epic[];
  tasks: Task[];
}
