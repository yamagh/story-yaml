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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grip-vertical" viewBox="0 0 16 16">
        <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
    </svg>
);


type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

interface RowProps {
    item: Item;
    type: string;
    onSelectRow: (item: Item, type: string) => void;
    onShowForm: (type: ItemType, parentId: string | null) => void;
    children?: React.ReactNode;
    level?: number;
}

const SortableRow: React.FC<RowProps> = ({ item, type, onSelectRow, onShowForm, level = 0 }) => {
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
        '--bs-table-bg-opacity': type === 'Epic' ? 0.1 : (type === 'Story' ? 0.05 : 1),
    };

    const getButton = () => {
        const buttonClass = "btn btn-sm btn-outline-secondary";
        if (type === 'Epic') return <button className={buttonClass} onClick={(e) => { e.stopPropagation(); onShowForm('stories', item.title); }}>+</button>;
        if (type === 'Story' || type === 'Task') return <button className={buttonClass} onClick={(e) => { e.stopPropagation(); onShowForm('subtasks', item.title); }}>+</button>;
        return null;
    };

    const getRowClass = () => {
        switch(type) {
            case 'Epic': return 'table-primary';
            case 'Story': return 'table-light';
            case 'SubTask': return 'table-light';
            default: return '';
        }
    }

    const getStatusClass = (status: string) => {
        switch(status) {
            case 'ToDo': return 'badge bg-secondary-subtle text-dark';
            case 'WIP': return 'badge bg-primary-subtle text-dark';
            case 'Done': return 'badge bg-success';
            default: return 'badge bg-secondary';
        }
    }

    return (
        <tr ref={setNodeRef} style={style} {...attributes} className={getRowClass()} onClick={() => onSelectRow(item, type)}>
            <td className="text-center align-middle" style={{ cursor: 'grab' }}>
                <span {...listeners}><DragHandle /></span>
            </td>
            <td><span className={`badge bg-${type.toLowerCase()}`}>{type}</span></td>
            <td style={{ paddingLeft: `${level * 30 + 10}px` }}>{item.title}</td>
            <td>{'status' in item ? <span className={getStatusClass(item.status)}>{item.status}</span> : ''}</td>
            <td>{'points' in item ? <span className="badge bg-secondary-subtle text-dark">{item.points}</span> : ''}</td>
            <td className="text-center">{getButton()}</td>
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

    const renderSubTasks = (subTasks: SubTask[], level: number) => {
        if (!subTasks) return null;
        return subTasks.map((sub) => (
            <SortableRow key={sub.title} item={sub} type="SubTask" onSelectRow={onSelectRow} onShowForm={onShowForm} level={level} />
        ));
    };

    return (
        <tbody className="table-group-divider">
            <SortableContext items={flattenedItems.map(item => item.title)} strategy={verticalListSortingStrategy}>
                {epics.map((epic) => (
                    <React.Fragment key={epic.title}>
                        <SortableRow item={epic} type="Epic" onSelectRow={onSelectRow} onShowForm={onShowForm} level={0} />
                        {epic.stories?.map((story) => (
                            <React.Fragment key={story.title}>
                                <SortableRow item={story} type="Story" onSelectRow={onSelectRow} onShowForm={onShowForm} level={1} />
                                {renderSubTasks(story['sub tasks'] || [], 2)}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
                {tasks.map((task) => (
                    <React.Fragment key={task.title}>
                        <SortableRow item={task} type="Task" onSelectRow={onSelectRow} onShowForm={onShowForm} level={0} />
                        {renderSubTasks(task['sub tasks'] || [], 1)}
                    </React.Fragment>
                ))}
            </SortableContext>
        </tbody>
    );
});

