import React from 'react';
import { useStoryData } from '../contexts/StoryDataContext';

interface SidebarProps {
    children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
    const { showAddItemForm } = useStoryData();

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '1rem' }}>
            <div className="mb-3 d-flex justify-content-end">
                <button className="btn btn-primary me-2" onClick={() => showAddItemForm('epics')}>Add New Epic</button>
                <button className="btn btn-primary" onClick={() => showAddItemForm('tasks')}>Add New Task</button>
            </div>
            <div className="">
                {children}
            </div>
        </div>
    );
};
