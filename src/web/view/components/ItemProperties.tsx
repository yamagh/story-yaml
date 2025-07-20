import React from 'react';
import { Item } from '../../types';
import { isStory } from '../../typeGuards';

interface ItemPropertiesProps {
    selectedItem: Item & { type: string };
}

export const ItemProperties: React.FC<ItemPropertiesProps> = ({ selectedItem }) => {
    const { description } = selectedItem;
    const status = 'status' in selectedItem ? selectedItem.status : undefined;
    const points = 'points' in selectedItem ? selectedItem.points : undefined;
    const sprint = 'sprint' in selectedItem ? selectedItem.sprint : undefined;
    const dod = 'definition of done' in selectedItem ? selectedItem['definition of done'] : undefined;

    return (
        <>
            {description && <p>{description}</p>}
            {status && <p><strong>Status:</strong> <span className="badge bg-secondary">{status}</span></p>}
            {points !== undefined && <p><strong>Points:</strong> <span className="badge bg-success">{points}</span></p>}
            {sprint && <p><strong>Sprint:</strong> {sprint}</p>}
            {isStory(selectedItem) && (
                <div className="card my-3">
                    <div className="card-body">
                        <p className="card-text"><strong>As a:</strong> {selectedItem.as}</p>
                        <p className="card-text"><strong>I want:</strong> {selectedItem['i want']}</p>
                        <p className="card-text"><strong>So that:</strong> {selectedItem['so that']}</p>
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
        </>
    );
};
