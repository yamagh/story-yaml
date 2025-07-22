import React, { memo, useCallback, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { ParentInfoCard } from './ParentInfoCard';
import { ChildrenList } from './ChildrenList';
import { ItemProperties } from './ItemProperties';
import { isEpic, isStory } from '../../typeGuards';
import { Badge } from './Badge';
import { useStoryData } from '../contexts/StoryDataContext';

const ItemDetailsFC: React.FC = () => {
    const { selectedItem, selectedItemParent, showEditItemForm, deleteItem, selectItem } = useStoryData();
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = useCallback(() => {
        if (!selectedItem) return;
        setConfirmOpen(true);
    }, [selectedItem]);

    const handleConfirmDelete = useCallback(() => {
        if (!selectedItem) return;
        deleteItem(selectedItem.id!);
        setConfirmOpen(false);
    }, [selectedItem, deleteItem]);

    const handleSelectParent = useCallback(() => {
        if (!selectedItemParent) return;
        let parentType = 'Task';
        if (isEpic(selectedItemParent)) {
            parentType = 'Epic';
        } else if (isStory(selectedItemParent)) {
            parentType = 'Story';
        }
        selectItem(selectedItemParent, parentType);
    }, [selectedItemParent, selectItem]);

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
                        <Badge type="type" value={type} itemType={type} />
                    </div>
                    <div>
                        <button className="btn btn-sm btn-primary me-2" onClick={showEditItemForm}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
                <h4 className="mb-3">{title}</h4>
                <ItemProperties selectedItem={selectedItem} />
            </div>
            <div className='mt-3'>
              {selectedItem.type.toLowerCase() !== 'subtask' && <ChildrenList selectedItem={selectedItem} />}
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
};

ItemDetailsFC.displayName = 'ItemDetails';

export const ItemDetails = memo(ItemDetailsFC);
