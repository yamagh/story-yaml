import React from 'react';
import Badge from './Badge';
import { Item } from '../../types';

interface ItemHeaderProps {
    item: Item;
    onEdit: () => void;
    onDelete: () => void;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({ item, onEdit, onDelete }) => {
    const { type, title } = item;

    return (
        <div className="card p-3 shadow-sm mb-3">
            <div className="d-flex justify-content-between mb-3">
                <div>
                    <Badge type="type" value={type} />
                </div>
                <div>
                    <button className="btn btn-sm btn-primary me-2" onClick={onEdit}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={onDelete}>Delete</button>
                </div>
            </div>
            <h4 className="mb-0">{title}</h4>
        </div>
    );
};
