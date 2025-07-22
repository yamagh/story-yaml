import React, { useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStoryData } from '../contexts/StoryDataContext';
import { useStoryFilter } from '../hooks/useStoryFilter';
import { StoryTable } from './StoryTable';
import { TableHeaderFilter } from './TableHeaderFilter';
import { Status, Epic, Story, Task } from '../../types';

export const MainLayout = () => {
    const { storyData, handleDragEnd, selectItem, showAddItemForm } = useStoryData();
    const { filteredData, setFilterStatus, setFilterSprint, setFilterKeyword, filterStatus, filterSprint, filterKeyword } = useStoryFilter(storyData);

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const sprints = useMemo(() => {
        if (!storyData) return [];
        const sprintSet = new Set<string>();
        (storyData.epics || []).forEach((epic: Epic) => {
            epic.stories?.forEach((story: Story) => {
                if (story.sprint) sprintSet.add(story.sprint);
            });
        });
        (storyData.tasks || []).forEach((task: Task) => {
            if (task.sprint) sprintSet.add(task.sprint);
        });
        return Array.from(sprintSet).sort();
    }, [storyData]);

    return (
        <div className="col-md-8" style={{ height: '100%', overflowY: 'auto' }}>
            <div className="input-group mb-3">
                <span className="input-group-text">Keyword</span>
                <input
                    type="text"
                    className="form-control"
                    value={filterKeyword}
                    onChange={e => setFilterKeyword(e.target.value)}
                    placeholder="Search by keyword..."
                />
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th style={{ width: '30px' }}></th>
                            <th>Type</th>
                            <th style={{ width: '100%' }}>Title</th>
                            <TableHeaderFilter
                                title="Status"
                                options={['ToDo', 'WIP', 'Done'] as Status[]}
                                selectedOptions={filterStatus}
                                onChange={setFilterStatus}
                            />
                            <th>Points</th>
                            <TableHeaderFilter
                                title="Sprint"
                                options={sprints}
                                selectedOptions={filterSprint ? [filterSprint] : []}
                                onChange={(selected) => setFilterSprint(selected[0] || '')}
                                singleSelection={true}
                                allowEmpty={true}
                            />
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
    );
};
