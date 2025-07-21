import React, { memo, useCallback, useState } from 'react';
import { Epic, Story, Task, SubTask, Item } from '../../types';
import { ConfirmDialog } from './ConfirmDialog';
import { ParentInfoCard } from './ParentInfoCard';
import { ChildrenList } from './ChildrenList';
import { ItemProperties } from './ItemProperties';
import { isEpic, isStory } from '../../typeGuards';

type SelectedItem = (Epic | Story | Task | SubTask) & { type: string };

interface ItemDetailsProps {
    selectedItem: SelectedItem | null;
    selectedItemParent: (Epic | Story | Task) | null;
    onEdit: () => void;
    onDelete: (title: string) => void;
    onAddItem: (itemType: 'stories' | 'subtasks') => void;
    onSelectParent: (item: Item, type: string) => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = memo(({ selectedItem, selectedItemParent, onEdit, onDelete, onAddItem, onSelectParent }) => {
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = useCallback(() => {
        if (!selectedItem) return;
        setConfirmOpen(true);
    }, [selectedItem]);

    const handleConfirmDelete = useCallback(() => {
        if (!selectedItem) return;
        onDelete(selectedItem.title);
        setConfirmOpen(false);
    }, [selectedItem, onDelete]);

    const handleSelectParent = useCallback(() => {
        if (!selectedItemParent) return;
        let parentType = 'Task';
        if (isEpic(selectedItemParent)) {
            parentType = 'Epic';
        } else if (isStory(selectedItemParent)) {
            parentType = 'Story';
        }
        onSelectParent(selectedItemParent, parentType);
    }, [selectedItemParent, onSelectParent]);

    if (!selectedItem) {
        return <div className="alert alert-info">Click on an item to see details or add a new item.</div>;
    }

    const { type, title } = selectedItem;

    const confirmMessage = isEpic(selectedItem) || isStory(selectedItem)
        ? 'All nested items will also be deleted.'
        : 'Are you sure you want to delete this item?';

    return (
        <>
            {selectedItemParent && <ParentInfoCard parent={selectedItemParent} onSelect={handleSelectParent} />}
            <div className='card p-3 shadow-sm'>
                <div className="d-flex justify-content-between mb-3">
                    <div>
                        <span className={`badge bg-${type.toLowerCase()}`}>{type}</span>
                    </div>
                    <div>
                        <button className="btn btn-sm btn-primary me-2" onClick={onEdit}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
                <h4 className="mb-3">{title}</h4>
                <ItemProperties selectedItem={selectedItem} />
            </div>
            <div className='mt-3'>
              <ChildrenList selectedItem={selectedItem} onSelectItem={onSelectParent} onAddItem={onAddItem} />
            </div>
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${type}`}>
                <p>{confirmMessage}</p>
            </ConfirmDialog>
        </>
    );
});