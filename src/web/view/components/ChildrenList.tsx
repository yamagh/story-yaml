import React from 'react';
import { Item, Story, SubTask, Epic } from '../../types';
import { isEpic, isStory } from '../../typeGuards';

type SelectedItem = Item & { type: string };

interface ChildrenListProps {
    selectedItem: SelectedItem;
    onSelectItem: (item: Item, type: string) => void;
    onAddItem: (itemType: 'stories' | 'subtasks') => void;
}

export const ChildrenList: React.FC<ChildrenListProps> = ({ selectedItem, onSelectItem, onAddItem }) => {
    if (!isEpic(selectedItem) && !isStory(selectedItem)) {
        return null;
    }

    const children = (isEpic(selectedItem) ? selectedItem.stories : selectedItem['sub tasks']) || [];

    const handleSelectChild = (child: Story | SubTask) => {
        const childType = isStory(child) ? 'Story' : 'SubTask';
        onSelectItem(child, childType);
    };

    const title = isEpic(selectedItem) ? 'Stories' : 'Sub-Tasks';
    const emptyMessage = isEpic(selectedItem) ? 'No stories yet.' : 'No sub-tasks yet.';
    const addButtonText = isEpic(selectedItem) ? 'Add New Story' : 'Add New Subtask';
    const addItemType = isEpic(selectedItem) ? 'stories' : 'subtasks';

    return (
        <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
                <h5>{title}</h5>
                <button className="btn btn-success btn-sm" onClick={() => onAddItem(addItemType)}>{addButtonText}</button>
            </div>
            <ul className="list-group mt-2">
                {children && children.length > 0 ? (
                    children.map((child) => (
                        <li key={child.title} className="list-group-item list-group-item-action" onClick={() => handleSelectChild(child)} style={{ cursor: 'pointer' }}>
                            {child.title}
                        </li>
                    ))
                ) : (
                    <li className="list-group-item text-muted">{emptyMessage}</li>
                )}
            </ul>
        </div>
    );
};
