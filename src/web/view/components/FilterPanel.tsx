
import React from 'react';
import { Status } from '../../types';

interface FilterPanelProps {
    sprints: string[];
    statusFilter: Status[];
    sprintFilter: string;
    keywordFilter: string;
    onStatusChange: (statuses: Status[]) => void;
    onSprintChange: (sprint: string) => void;
    onKeywordChange: (keyword: string) => void;
}

const allStatuses: Status[] = ['ToDo', 'WIP', 'Done'];

export const FilterPanel: React.FC<FilterPanelProps> = ({
    sprints,
    statusFilter,
    sprintFilter,
    keywordFilter,
    onStatusChange,
    onSprintChange,
    onKeywordChange,
}) => {
    const handleStatusChange = (status: Status) => {
        const newStatusFilter = statusFilter.includes(status)
            ? statusFilter.filter(s => s !== status)
            : [...statusFilter, status];
        onStatusChange(newStatusFilter);
    };

    return (
        <div className="filter-panel">
            <div className="filter-group">
                <strong>Status:</strong>
                {allStatuses.map(status => (
                    <label key={status}>
                        <input
                            type="checkbox"
                            checked={statusFilter.includes(status)}
                            onChange={() => handleStatusChange(status)}
                        />
                        {status}
                    </label>
                ))}
            </div>
            <div className="filter-group">
                <strong>Sprint:</strong>
                <select value={sprintFilter} onChange={e => onSprintChange(e.target.value)}>
                    <option value="">All</option>
                    {sprints.map(sprint => (
                        <option key={sprint} value={sprint}>{sprint}</option>
                    ))}
                </select>
            </div>
            <div className="filter-group">
                <strong>Keyword:</strong>
                <input
                    type="text"
                    value={keywordFilter}
                    onChange={e => onKeywordChange(e.target.value)}
                    placeholder="Search by keyword..."
                />
            </div>
        </div>
    );
};
