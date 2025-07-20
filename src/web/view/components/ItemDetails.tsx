import React, { memo, useCallback, useState } from 'react';
import { Epic, Story, Task, SubTask } from '../../types';
import { ConfirmDialog } from './ConfirmDialog';

type SelectedItem = (Epic | Story | Task | SubTask) & { type: string };

interface ItemDetailsProps {
    selectedItem: SelectedItem | null;
    onEdit: () => void;
    onDelete: (item: { title: string }) => void;
    onAddItem: (itemType: 'stories' | 'subtasks') => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = memo(({ selectedItem, onEdit, onDelete, onAddItem }) => {
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
            <div>
                <div className="d-flex justify-content-between mb-3">
                    <div>
                      <span className={`badge bg-${type.toLowerCase()}`}>{type}</span>
                    </div>
                    <div>
                      {type === 'Epic' && <button className="btn btn-success me-2" onClick={() => onAddItem('stories')}>Add New Story</button>}
                      {type === 'Story' && <button className="btn btn-success me-2" onClick={() => onAddItem('subtasks')}>Add New Subtask</button>}
                      <button className="btn btn-primary me-2" onClick={onEdit}>Edit</button>
                      <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                    </div>
                </div>
                <h4 className="mb-3">{title}</h4>
                {description && <p><strong>Description:</strong> {description}</p>}
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