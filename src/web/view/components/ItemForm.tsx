import React, { memo } from 'react';
import { Item, Story, Task, SubTask } from '../../types';

type ItemType = 'epics' | 'stories' | 'tasks' | 'subtasks';

interface ItemFormProps {
    formType: ItemType;
    data: Partial<Item>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export const ItemForm: React.FC<ItemFormProps> = memo(({ formType, data, onSubmit, onCancel }) => {
    const isNew = !data.title;
    const title = `${isNew ? 'Add New' : 'Edit'} ${formType.charAt(0).toUpperCase() + formType.slice(1, -1)}`;

    return (
        <form className="form-container" onSubmit={onSubmit}>
            <h3>{title}</h3>
            <label>Title: <input name="title" required defaultValue={data.title || ''} /></label>
            <label>Description: <textarea name="description" defaultValue={data.description || ''}></textarea></label>

            {(formType === 'stories' || formType === 'tasks' || formType === 'subtasks') && (
                <label>Status:
                    <select name="status" defaultValue={(data as Task).status || 'ToDo'}>
                        <option>ToDo</option>
                        <option>WIP</option>
                        <option>Done</option>
                    </select>
                </label>
            )}

            {(formType === 'stories' || formType === 'tasks') && (
                <>
                    <label>Points: <input name="points" type="number" defaultValue={(data as Task).points || '0'} /></label>
                    <label>Sprint: <input name="sprint" defaultValue={(data as Task).sprint || ''} /></label>
                    <label>Definition of Done (one per line): <textarea name="dod" rows={3} defaultValue={(data as Task)['definition of done']?.join('\n') || ''}></textarea></label>
                </>
            )}

            {formType === 'stories' && (
                <div id="story-fields">
                    <label>As a: <input name="as" defaultValue={(data as Story).as || ''} /></label>
                    <label>I want: <input name="i-want" defaultValue={(data as Story)['i want'] || ''} /></label>
                    <label>So that: <input name="so-that" defaultValue={(data as Story)['so that'] || ''} /></label>
                </div>
            )}

            <div className="form-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
});
