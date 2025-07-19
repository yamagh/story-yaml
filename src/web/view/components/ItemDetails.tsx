import React from 'react';
import { Epic, Story, Task, SubTask } from '../../types';

type SelectedItem = (Epic | Story | Task | SubTask) & { type: string };

interface ItemDetailsProps {
    selectedItem: SelectedItem | null;
    onEdit: () => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ selectedItem, onEdit }) => {
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

    return (
        <div className="details-view">
            <button onClick={onEdit}>Edit</button>
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
    );
};
