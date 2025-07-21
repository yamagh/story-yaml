import React from 'react';
import { useStoryData } from '../contexts/StoryDataContext';
import { ItemForm } from './ItemForm';
import { ItemDetails } from './ItemDetails';

export const Sidebar = () => {
    const {
        formVisible,
        formType,
        formItemData,
        handleFormSubmit,
        hideForm,
        showAddItemForm,
    } = useStoryData();

    const renderForm = () => {
        if (!formVisible || !formType) return null;
        return (
            <ItemForm
                formType={formType}
                data={formItemData || {}}
                onSubmit={handleFormSubmit}
                onCancel={hideForm}
            />
        );
    };

    return (
        <div className="col-md-4" style={{ height: '100%', overflowY: 'auto' }}>
            <div className="mb-3 d-flex justify-content-end">
                <button className="btn btn-primary me-2" onClick={() => showAddItemForm('epics')}>Add New Epic</button>
                <button className="btn btn-primary" onClick={() => showAddItemForm('tasks')}>Add New Task</button>
            </div>
            <div className="">
                {formVisible ? renderForm() : <ItemDetails />}
            </div>
        </div>
    );
};
