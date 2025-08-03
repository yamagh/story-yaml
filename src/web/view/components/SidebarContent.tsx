import React from 'react';
import { useStoryData } from '../contexts/StoryDataContext';
import { ItemForm } from './ItemForm';
import { ItemDetails } from './ItemDetails';

export const SidebarContent = () => {
    const {
        formVisible,
        formType,
        formItemData,
        handleFormSubmit,
        hideForm,
    } = useStoryData();

    if (formVisible && formType) {
        return (
            <ItemForm
                formType={formType}
                data={formItemData || {}}
                onSubmit={handleFormSubmit}
                onCancel={hideForm}
            />
        );
    }

    return <ItemDetails />;
};
