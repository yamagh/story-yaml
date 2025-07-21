import React from 'react';
import { Item, Story, SubTask, ItemType } from '../../types';
import { isEpic, isStory, isTask } from '../../typeGuards';
import { useStoryData } from '../contexts/StoryDataContext';

type SelectedItem = Item & { type: string };

interface ChildrenListProps {
    selectedItem: SelectedItem;
}

export const ChildrenList: React.FC<ChildrenListProps> = ({ selectedItem }) => {
    const { showAddItemForm, selectItem } = useStoryData();

    if (!isEpic(selectedItem) && !isStory(selectedItem) && !isTask(selectedItem)) {
        return null;
    }

    const children: (Story | SubTask)[] = isEpic(selectedItem)
        ? selectedItem.stories
        : (isStory(selectedItem) || isTask(selectedItem))
            ? selectedItem['sub tasks'] || []
            : [];

    const handleSelectChild = (child: Story | SubTask) => {
        const childType = isStory(child) ? 'Story' : 'SubTask';
        selectItem(child, childType);
    };

    let title = '';
    let emptyMessage = '';
    let addButtonText = '';
    let addItemType: ItemType | '' = '';

    if (isEpic(selectedItem)) {
        title = 'Stories';
        emptyMessage = 'No stories yet.';
        addButtonText = 'Add New Story';
        addItemType = 'stories';
    } else if (isStory(selectedItem) || isTask(selectedItem)) {
        title = 'Sub-Tasks';
        emptyMessage = 'No sub-tasks yet.';
        addButtonText = 'Add New Subtask';
        addItemType = 'subtasks';
    }

    return (
        <div className="card p-3 shadow-sm">
            <div className="d-flex justify-content-between align-items-center">
                <h5>{title}</h5>
                <button className="btn btn-success btn-sm" onClick={() => showAddItemForm(addItemType as ItemType, selectedItem.title)}>{addButtonText}</button>
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
