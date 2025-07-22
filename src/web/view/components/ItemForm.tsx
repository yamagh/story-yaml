import React, { useEffect, useRef } from 'react';
import { Item, ItemType, Story, Task } from '../../types';

interface ItemFormProps {
    formType: ItemType;
    data: Partial<Item>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = ({ formType, data, onSubmit, onCancel }) => {
    const isNew = !data.title;
    const title = `${isNew ? 'Add New' : 'Edit'} ${formType.charAt(0).toUpperCase() + formType.slice(1, -1)}`;
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.focus();
        }
    }, []);

    return (
        <form onSubmit={onSubmit} className='card p-3 shadow-sm'>
            <h4>{title}</h4>
            <div className="mb-3">
                <label htmlFor="title" className="form-label">Title</label>
                <input id="title" name="title" required defaultValue={data.title || ''} className="form-control" ref={titleRef} />
            </div>
            <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea id="description" name="description" defaultValue={data.description || ''} className="form-control"></textarea>
            </div>

            {(formType === 'stories' || formType === 'tasks' || formType === 'subtasks') && (
                <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select id="status" name="status" defaultValue={(data as Task).status || 'ToDo'} className="form-select">
                        <option>ToDo</option>
                        <option>WIP</option>
                        <option>Done</option>
                    </select>
                </div>
            )}

            {(formType === 'stories' || formType === 'tasks') && (
                <>
                    <div className="mb-3">
                        <label htmlFor="points" className="form-label">Points</label>
                        <input id="points" name="points" type="number" defaultValue={(data as Task).points || '0'} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="sprint" className="form-label">Sprint</label>
                        <input id="sprint" name="sprint" defaultValue={(data as Task).sprint || ''} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="dod" className="form-label">Definition of Done (one per line)</label>
                        <textarea id="dod" name="dod" rows={3} defaultValue={(data as Task)['definition of done']?.join('\n') || ''} className="form-control"></textarea>
                    </div>
                </>
            )}

            {formType === 'stories' && (
                <div id="story-fields">
                    <div className="mb-3">
                        <label htmlFor="as" className="form-label">As a</label>
                        <input id="as" name="as" defaultValue={(data as Story).as || ''} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="i-want" className="form-label">I want</label>
                        <input id="i-want" name="i-want" defaultValue={(data as Story)['i want'] || ''} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="so-that" className="form-label">So that</label>
                        <input id="so-that" name="so-that" defaultValue={(data as Story)['so that'] || ''} className="form-control" />
                    </div>
                </div>
            )}

            <div className="d-flex justify-content-end">
                <button type="button" className="btn btn-secondary me-2" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
            </div>
        </form>
    );
};
