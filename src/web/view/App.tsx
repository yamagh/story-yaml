import React from 'react';
import './App.css';
import { useStoryData } from './hooks/useStoryData';
import { ItemForm } from './components/ItemForm';
import { ItemDetails } from './components/ItemDetails';
import { StoryTable } from './components/StoryTable';

const App = () => {
    const {
        storyData,
        selectedItem,
        formVisible,
        formType,
        formItemData,
        selectItem,
        showAddItemForm,
        showEditItemForm,
        hideForm,
        handleFormSubmit,
        deleteItem,
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
        <div className="app-container">
            <div className="panel table-panel">
                <button onClick={() => showAddItemForm('epics')}>Add New Epic</button>
                <button onClick={() => showAddItemForm('tasks')}>Add New Task</button>
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Points</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <StoryTable
                        storyData={storyData}
                        onSelectRow={selectItem}
                        onShowForm={showAddItemForm}
                    />
                </table>
            </div>
            <div className="panel details-panel">
                {formVisible ? renderForm() : <ItemDetails selectedItem={selectedItem} onEdit={showEditItemForm} onDelete={deleteItem} />}
            </div>
        </div>
    );
};

export default App;
