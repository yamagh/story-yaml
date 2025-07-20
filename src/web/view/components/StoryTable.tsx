import React, { memo, useMemo } from 'react';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StoryFile, SubTask, Epic, Story, Task, Item } from '../../types';

// A simple grip icon for the drag handle
const DragHandle: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 drag-handle">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v12.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3zM3.75 6a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75zM3 12.75a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);


type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

interface RowProps {
    item: Item;
    type: string;
    onSelectRow: (item: Item, type: string) => void;
    onShowForm: (type: ItemType, parentId: string | null) => void;
    children?: React.ReactNode;
}

const SortableRow: React.FC<RowProps> = ({ item, type, onSelectRow, onShowForm, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.title });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getButton = () => {
        if (type === 'Epic') return <button className="add-button" onClick={(e) => { e.stopPropagation(); onShowForm('stories', item.title); }}>+</button>;
        if (type === 'Story' || type === 'Task') return <button className="add-button" onClick={(e) => { e.stopPropagation(); onShowForm('subtasks', item.title); }}>+</button>;
        return null;
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes} className={`${type.toLowerCase()}`} onClick={() => onSelectRow(item, type)}>
            <td className="drag-handle-cell">
                <span {...listeners}><DragHandle /></span>
            </td>
            <td>{type}</td>
            <td>{item.title}</td>
            <td>{'status' in item ? item.status : ''}</td>
            <td>{'points' in item ? item.points : ''}</td>
            <td>{getButton()}</td>
        </tr>
    );
};


interface StoryTableProps {
    storyData: StoryFile | null;
    onSelectRow: (item: Item, type: string) => void;
    onShowForm: (type: ItemType, parentId: string | null) => void;
}

export const StoryTable: React.FC<StoryTableProps> = memo(({ storyData, onSelectRow, onShowForm }) => {
    const flattenedItems = useMemo(() => {
        if (!storyData) return [];
        const items: Item[] = [];
        storyData.epics.forEach(epic => {
            items.push(epic);
            epic.stories?.forEach(story => {
                items.push(story);
                story['sub tasks']?.forEach(sub => items.push(sub));
            });
        });
        storyData.tasks.forEach(task => {
            items.push(task);
            task['sub tasks']?.forEach(sub => items.push(sub));
        });
        return items;
    }, [storyData]);

    if (!storyData) return <tbody><tr><td colSpan={6}>Loading story data...</td></tr></tbody>;

    const { epics = [], tasks = [] } = storyData;

    const renderSubTasks = (subTasks: SubTask[]) => {
        if (!subTasks) return null;
        return subTasks.map((sub) => (
            <SortableRow key={sub.title} item={sub} type="SubTask" onSelectRow={onSelectRow} onShowForm={onShowForm} />
        ));
    };

    return (
        <tbody>
            <SortableContext items={flattenedItems.map(item => item.title)} strategy={verticalListSortingStrategy}>
                {epics.map((epic) => (
                    <React.Fragment key={epic.title}>
                        <SortableRow item={epic} type="Epic" onSelectRow={onSelectRow} onShowForm={onShowForm} />
                        {epic.stories?.map((story) => (
                            <React.Fragment key={story.title}>
                                <SortableRow item={story} type="Story" onSelectRow={onSelectRow} onShowForm={onShowForm} />
                                {renderSubTasks(story['sub tasks'] || [])}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
                {tasks.map((task) => (
                    <React.Fragment key={task.title}>
                        <SortableRow item={task} type="Task" onSelectRow={onSelectRow} onShowForm={onShowForm} />
                        {renderSubTasks(task['sub tasks'] || [])}
                    </React.Fragment>
                ))}
            </SortableContext>
        </tbody>
    );
});
