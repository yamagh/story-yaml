import React, { memo, useMemo } from 'react';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StoryFile, Item, Epic, Story, Task, SubTask } from '../../types';
import Badge from './Badge';
import { useUIState } from '../contexts/UIStateContext';

const DragHandle: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grip-vertical" viewBox="0 0 16 16">
        <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
    </svg>
);

interface SortableItemProps {
    item: Item & { type: string; level: number };
    onSelectRow: (item: Item) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ item, onSelectRow }) => {
    const { selectedItem } = useUIState();
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
    };

    const getRowClass = () => {
        const classes = ['sortable-row'];
        if (item.id === selectedItem?.id) {
            classes.push('selected-row');
        }
        return classes.join(' ');
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes} className={getRowClass()} onClick={() => onSelectRow(item)}>
            <td className="text-center align-middle" style={{ cursor: 'grab' }}>
                <span {...listeners}><DragHandle /></span>
            </td>
            <td><Badge type="type" value={item.type} /></td>
            <td style={{ paddingLeft: `${item.level * 30 + 10}px` }}>{item.title}</td>
            <td>{'status' in item && <Badge type="status" value={item.status} />}</td>
            <td>{'points' in item && <Badge type="points" value={item.points} />}</td>
            <td>{'sprint' in item && <Badge type="sprint" value={item.sprint} />}</td>
        </tr>
    );
};

interface StoryTableProps {
    storyData: StoryFile | null;
    onSelectRow: (item: Item) => void;
}

const StoryTableFC: React.FC<StoryTableProps> = ({ storyData, onSelectRow }) => {
    const flattenedItems = useMemo(() => {
        if (!storyData) return [];
        const items: (Item & { type: string; level: number })[] = [];
        
        const addItems = (collection: (Epic | Story | Task | SubTask)[], level: number, type: 'Epic' | 'Story' | 'Task' | 'SubTask') => {
            collection.forEach(item => {
                items.push({ ...item, type, level } as Item & { type: string; level: number });
                if ('stories' in item && item.stories) {
                    addItems(item.stories, level + 1, 'Story');
                }
                if ('subtasks' in item && item.subtasks) {
                    addItems(item.subtasks, level + 1, 'SubTask');
                }
            });
        };

        addItems(storyData.epics, 0, 'Epic');
        addItems(storyData.tasks, 0, 'Task');
        
        return items;
    }, [storyData]);

    if (!storyData) return <tbody><tr><td colSpan={6}>Loading story data...</td></tr></tbody>;

    return (
        <tbody className="table-group-divider">
            <SortableContext items={flattenedItems.map(item => item.id!)} strategy={verticalListSortingStrategy}>
                {flattenedItems.map(item => (
                    <SortableItem key={item.id} item={item} onSelectRow={onSelectRow} />
                ))}
            </SortableContext>
        </tbody>
    );
};

StoryTableFC.displayName = 'StoryTable';

export const StoryTable = memo(StoryTableFC);

