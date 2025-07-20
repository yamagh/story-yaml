import React, { memo, useCallback, useState } from 'react';
import { Epic, Story, Task, SubTask, Item } from '../../types';
import { ConfirmDialog } from './ConfirmDialog';

type SelectedItem = (Epic | Story | Task | SubTask) & { type: string };

interface ItemDetailsProps {
    selectedItem: SelectedItem | null;
    selectedItemParent: (Epic | Story | Task) | null;
    onEdit: () => void;
    onDelete: (item: { title: string }) => void;
    onAddItem: (itemType: 'stories' | 'subtasks') => void;
    onSelectParent: (item: Item, type: string) => void;
}

const ParentInfoCard: React.FC<{ parent: Epic | Story | Task, onSelect: () => void }> = ({ parent, onSelect }) => {
    const parentType = 'stories' in parent ? 'Epic' : ('i want' in parent ? 'Story' : 'Task');
    return (
        <div className="card mb-3 bg-light" onClick={onSelect} style={{ cursor: 'pointer' }}>
            <div className="card-body py-2">
                <small className="text-muted">Parent</small>
                <p className="card-text mb-0 fw-bold">{parent.title}</p>
                <span className={`badge bg-${parentType.toLowerCase()}`}>{parentType}</span>
            </div>
        </div>
    );
};

export const ItemDetails: React.FC<ItemDetailsProps> = memo(({ selectedItem, selectedItemParent, onEdit, onDelete, onAddItem, onSelectParent }) => {
    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = useCallback(() => {
        if (!selectedItem) return;
        setConfirmOpen(true);
    }, [selectedItem]);

    const handleConfirmDelete = useCallback(() => {
        if (!selectedItem) return;
        onDelete({ title: selectedItem.title });
        setConfirmOpen(false);
    }, [selectedItem, onDelete]);

    const handleSelectParent = useCallback(() => {
        if (!selectedItemParent) return;
        const parentType = 'stories' in selectedItemParent ? 'Epic' : ('i want' in selectedItemParent ? 'Story' : 'Task');
        onSelectParent(selectedItemParent, parentType);
    }, [selectedItemParent, onSelectParent]);

    if (!selectedItem) {
        return <div className="alert alert-info">Click on an item to see details or add a new item.</div>;
    }

    const { type, title, description } = selectedItem;
    const status = 'status' in selectedItem ? selectedItem.status : undefined;
    const points = 'points' in selectedItem ? selectedItem.points : undefined;
    const sprint = 'sprint' in selectedItem ? selectedItem.sprint : undefined;
    const as = 'as' in selectedItem ? selectedItem.as : undefined;
    const iWant = 'i want' in selectedItem ? selectedItem['i want'] : undefined;
    const soThat = 'so that' in selectedItem ? selectedItem['so that'] : undefined;
    const dod = 'definition of done' in selectedItem ? selectedItem['definition of done'] : undefined;

    const confirmMessage = type === 'Epic' || type === 'Story' 
        ? 'All nested items will also be deleted.' 
        : 'Are you sure you want to delete this item?';

    return (
        <>
            {selectedItemParent && <ParentInfoCard parent={selectedItemParent} onSelect={handleSelectParent} />}
            <div>
                <div className="d-flex justify-content-between mb-3">
                    <div>
                      <span className={`badge bg-${type.toLowerCase()}`}>{type}</span>
                    </div>
                    <div>
                      <button className="btn btn-primary me-2" onClick={onEdit}>Edit</button>
                      <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
                <h4 className="mb-3">{title}</h4>
                {description && <p>{description}</p>}
                {status && <p><strong>Status:</strong> <span className="badge bg-secondary">{status}</span></p>}
                {points !== undefined && <p><strong>Points:</strong> <span className="badge bg-success">{points}</span></p>}
                {sprint && <p><strong>Sprint:</strong> {sprint}</p>}
                {type === 'Story' && (
                    <div className="card my-3">
                        <div className="card-body">
                            <p className="card-text"><strong>As a:</strong> {as}</p>
                            <p className="card-text"><strong>I want:</strong> {iWant}</p>
                            <p className="card-text"><strong>So that:</strong> {soThat}</p>
                        </div>
                    </div>
                )}
                {dod && dod.length > 0 && (
                    <div>
                        <strong>Definition of Done:</strong>
                        <ul className="list-group mt-2">
                            {dod.map((item: string, index: number) => <li key={index} className="list-group-item">{item}</li>)}
                        </ul>
                    </div>
                )}
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

const ChildrenList: React.FC<{
    selectedItem: SelectedItem,
    onSelectItem: (item: Item, type: string) => void,
    onAddItem: (itemType: 'stories' | 'subtasks') => void
}> = ({ selectedItem, onSelectItem, onAddItem }) => {
    const { type } = selectedItem;
    const children = 'stories' in selectedItem ? selectedItem.stories : ('sub tasks' in selectedItem ? selectedItem['sub tasks'] : undefined);

    if (type !== 'Epic' && type !== 'Story') {
        return null;
    }

    const handleSelectChild = (child: Story | SubTask) => {
        const childType = 'i want' in child ? 'Story' : 'SubTask';
        onSelectItem(child, childType);
    };

    const title = type === 'Epic' ? 'Stories' : 'Sub-Tasks';
    const emptyMessage = type === 'Epic' ? 'No stories yet.' : 'No sub-tasks yet.';
    const addButtonText = type === 'Epic' ? 'Add New Story' : 'Add New Subtask';
    const addItemType = type === 'Epic' ? 'stories' : 'subtasks';

    return (
        <div className="mt-4">
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