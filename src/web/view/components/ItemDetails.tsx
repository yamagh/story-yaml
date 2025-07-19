import React, { memo, useCallback, useState } from 'react';
import { Epic, Story, Task, SubTask } from '../../types';
import { ConfirmDialog } from './ConfirmDialog';

type SelectedItem = (Epic | Story | Task | SubTask) & { type: string };

interface ItemDetailsProps {
    selectedItem: SelectedItem | null;
    onEdit: () => void;
    onDelete: (item: { title: string }) => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = memo(({ selectedItem, onEdit, onDelete }) => {
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
        return <p>Click on an item to see details or add a new item.</p>;
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
            <div className="details-view">
                <button onClick={onEdit}>Edit</button>
                <button onClick={handleDelete}>Delete</button>
                <h3>{type}: {title}</h3>
                {description && <p><strong>Description:</strong> {description}</p>}
                {status && <p><strong>Status:</strong> {status}</p>}
                {points !== undefined && <p><strong>Points:</strong> {points}</p>}
                {sprint && <p><strong>Sprint:</strong> {sprint}</p>}
                {type === 'Story' && (
                    <>
                        <p><strong>As a:</strong> {as}</p>
                        <p><strong>I want:</strong> {iWant}</p>
                        <p><strong>So that:</strong> {soThat}</p>
                    </>
                )}
                {dod && dod.length > 0 && (
                    <div>
                        <strong>Definition of Done:</strong>
                        <ul>{dod.map((item: string, index: number) => <li key={index}>{item}</li>)}</ul>
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