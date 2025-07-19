import React, { memo } from 'react';
import { StoryFile, SubTask, Epic, Story, Task } from '../../types';

type Item = Epic | Story | Task | SubTask;
type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

interface StoryTableProps {
    storyData: StoryFile | null;
    onSelectRow: (item: Item, type: string) => void;
    onShowForm: (type: ItemType, parentId: string | null) => void;
}

export const StoryTable: React.FC<StoryTableProps> = memo(({ storyData, onSelectRow, onShowForm }) => {
    if (!storyData) return <tbody><tr><td colSpan={5}>Loading story data...</td></tr></tbody>;
    const { epics = [], tasks = [] } = storyData;

    const renderSubTasks = (subTasks: SubTask[]) => {
        if (!subTasks) return null;
        return subTasks.map((sub) => (
            <tr key={sub.title} className="subtask" onClick={(e) => { e.stopPropagation(); onSelectRow(sub, 'SubTask'); }}>
                <td>SubTask</td>
                <td>{sub.title}</td>
                <td>{sub.status}</td>
                <td></td>
                <td></td>
            </tr>
        ));
    };

    return (
        <tbody>
            {epics.map((epic) => (
                <React.Fragment key={epic.title}>
                    <tr className="epic" onClick={() => onSelectRow(epic, 'Epic')}><td>Epic</td><td>{epic.title}</td><td></td><td></td><td><button className="add-button" onClick={(e) => { e.stopPropagation(); onShowForm('stories', epic.title); }}>+</button></td></tr>
                    {epic.stories?.map((story) => (
                        <React.Fragment key={story.title}>
                            <tr className="story" onClick={() => onSelectRow(story, 'Story')}><td>Story</td><td>{story.title}</td><td>{story.status}</td><td>{story.points}</td><td><button className="add-button" onClick={(e) => { e.stopPropagation(); onShowForm('subtasks', story.title); }}>+</button></td></tr>
                            {renderSubTasks(story['sub tasks'] || [])}
                        </React.Fragment>
                    ))}
                </React.Fragment>
            ))}
            {tasks.map((task) => (
                 <React.Fragment key={task.title}>
                    <tr className="task" onClick={() => onSelectRow(task, 'Task')}><td>Task</td><td>{task.title}</td><td>{task.status}</td><td>{task.points}</td><td><button className="add-button" onClick={(e) => { e.stopPropagation(); onShowForm('subtasks', task.title); }}>+</button></td></tr>
                    {renderSubTasks(task['sub tasks'] || [])}
                </React.Fragment>
            ))}
        </tbody>
    );
});
