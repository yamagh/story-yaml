import React from 'react';
import { useUIState } from '../contexts/UIStateContext';
import { ItemForm } from './ItemForm';
import { ItemDetails } from './ItemDetails';

export const SidebarContent = () => {
    const {
        formVisible,
        formType,
        formItemData,
        handleFormSubmit,
        hideForm,
    } = useUIState();

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
