import React, { memo, useMemo } from 'react';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StoryFile, SubTask, Item, Status } from '../../types';
import { Badge } from './Badge';
import { useStoryData } from '../contexts/StoryDataContext';

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
    const { selectedItem } = useStoryData();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id! });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        '--bs-table-bg-opacity': type === 'Epic' ? 0.1 : (type === 'Story' ? 0.05 : 1),
    };

    const getRowClass = () => {
        const classes = [];
        if (item.id === selectedItem?.id) {
            classes.push('selected-row');
        }
        return classes.join(' ');
    }

    return (
        <tr ref={setNodeRef} style={style} {...attributes} className={getRowClass()} onClick={() => onSelectRow(item, type)}>
            <td className="text-center align-middle" style={{ cursor: 'grab' }}>
                <span {...listeners}><DragHandle /></span>
            </td>
            <td><Badge type="type" value={type} itemType={type} /></td>
            <td style={{ paddingLeft: `${level * 30 + 10}px` }}>{item.title}</td>
            <td>{'status' in item && <Badge type="status" value={item.status} />}</td>
            <td>{'points' in item && <Badge type="points" value={item.points} />}</td>
            <td>{'sprint' in item && <Badge type="sprint" value={item.sprint} />}</td>
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
            <SortableRow key={sub.id} item={sub} type="SubTask" onSelectRow={onSelectRow} onShowForm={onShowForm} level={level} />
        ));
    };

    return (
        <tbody className="table-group-divider">
            <SortableContext items={flattenedItems.map(item => item.id!)} strategy={verticalListSortingStrategy}>
                {epics.map((epic) => (
                    <React.Fragment key={epic.id}>
                        <SortableRow item={epic} type="Epic" onSelectRow={onSelectRow} onShowForm={onShowForm} level={0} />
                        {epic.stories?.map((story) => (
                            <React.Fragment key={story.id}>
                                <SortableRow item={story} type="Story" onSelectRow={onSelectRow} onShowForm={onShowForm} level={1} />
                                {renderSubTasks(story['sub tasks'] || [], 2)}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
                {tasks.map((task) => (
                    <React.Fragment key={task.id}>
                        <SortableRow item={task} type="Task" onSelectRow={onSelectRow} onShowForm={onShowForm} level={0} />
                        {renderSubTasks(task['sub tasks'] || [], 1)}
                    </React.Fragment>
                ))}
            </SortableContext>
        </tbody>
    );
});

