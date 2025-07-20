import React from 'react';
import { Epic, Story, Task } from '../../types';
import { isEpic, isStory } from '../../typeGuards';

interface ParentInfoCardProps {
    parent: Epic | Story | Task;
    onSelect: () => void;
}

export const ParentInfoCard: React.FC<ParentInfoCardProps> = ({ parent, onSelect }) => {
    let parentType: 'Epic' | 'Story' | 'Task' = 'Task';
    if (isEpic(parent)) {
        parentType = 'Epic';
    } else if (isStory(parent)) {
        parentType = 'Story';
    }

    return (
        <div className="card mb-3 bg-light shadow-sm" onClick={onSelect} style={{ cursor: 'pointer' }}>
            <div className="card-body py-2">
                <small className="text-muted">Parent</small>
                <span className={`ms-1 badge bg-${parentType.toLowerCase()}`}>{parentType}</span>
                <p className="card-text mb-0 fw-bold">{parent.title}</p>
            </div>
        </div>
    );
};
