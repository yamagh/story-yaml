
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
        <div className="card mb-3">
            <div className="card-body">
                <div className="row g-3 align-items-center">
                    <div className="col-auto">
                        <strong>Status:</strong>
                    </div>
                    <div className="col-auto">
                        {allStatuses.map(status => (
                            <div className="form-check form-check-inline" key={status}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`status-${status}`}
                                    checked={statusFilter.includes(status)}
                                    onChange={() => handleStatusChange(status)}
                                />
                                <label className="form-check-label" htmlFor={`status-${status}`}>
                                    {status}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="col-auto">
                        <label htmlFor="sprint-filter" className="col-form-label"><strong>Sprint:</strong></label>
                    </div>
                    <div className="col-auto">
                        <select id="sprint-filter" className="form-select" value={sprintFilter} onChange={e => onSprintChange(e.target.value)}>
                            <option value="">All</option>
                            {sprints.map(sprint => (
                                <option key={sprint} value={sprint}>{sprint}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-auto">
                        <label htmlFor="keyword-filter" className="col-form-label"><strong>Keyword:</strong></label>
                    </div>
                    <div className="col-auto">
                        <input
                            id="keyword-filter"
                            type="text"
                            className="form-control"
                            value={keywordFilter}
                            onChange={e => onKeywordChange(e.target.value)}
                            placeholder="Search by keyword..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
