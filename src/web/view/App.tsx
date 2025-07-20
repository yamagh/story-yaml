import React, { useMemo } from 'react';
import './App.css';
import { useStoryData } from './hooks/useStoryData';
import { useStoryFilter } from './hooks/useStoryFilter';
import { ItemForm } from './components/ItemForm';
import { ItemDetails } from './components/ItemDetails';
import { StoryTable } from './components/StoryTable';
import { FilterPanel } from './components/FilterPanel';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';

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
        handleDragEnd,
    } = useStoryData();

    const {
        filteredData,
        setFilterStatus,
        setFilterSprint,
        setFilterKeyword,
        filterStatus,
        filterSprint,
        filterKeyword,
    } = useStoryFilter(storyData);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    const sprints = useMemo(() => {
        if (!storyData) return [];
        const sprintSet = new Set<string>();
        storyData.epics.forEach(epic => {
            epic.stories?.forEach(story => {
                if (story.sprint) sprintSet.add(story.sprint);
            });
        });
        storyData.tasks.forEach(task => {
            if (task.sprint) sprintSet.add(task.sprint);
        });
        return Array.from(sprintSet).sort();
    }, [storyData]);

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

    if (!storyData) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-3">
            <div className="row">
                <div className="col-md-8">
                    <div className="mb-3">
                        <button className="btn btn-primary me-2" onClick={() => showAddItemForm('epics')}>Add New Epic</button>
                        <button className="btn btn-primary" onClick={() => showAddItemForm('tasks')}>Add New Task</button>
                    </div>
                    <FilterPanel
                        sprints={sprints}
                        statusFilter={filterStatus}
                        sprintFilter={filterSprint}
                        keywordFilter={filterKeyword}
                        onStatusChange={setFilterStatus}
                        onSprintChange={setFilterSprint}
                        onKeywordChange={setFilterKeyword}
                    />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th style={{ width: '30px' }}></th>
                                    <th>Type</th>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Points</th>
                                    <th>Sprint</th>
                                </tr>
                            </thead>
                            <StoryTable
                                storyData={filteredData}
                                onSelectRow={selectItem}
                                onShowForm={showAddItemForm}
                            />
                        </table>
                    </DndContext>
                </div>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            {formVisible ? renderForm() : <ItemDetails selectedItem={selectedItem} onEdit={showEditItemForm} onDelete={deleteItem} onAddItem={(itemType) => showAddItemForm(itemType, selectedItem?.title || null)} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
