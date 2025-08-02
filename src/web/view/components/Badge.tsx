import React from 'react';

type BadgeType = 'status' | 'points' | 'sprint' | 'type';

interface BadgeProps {
  type: BadgeType;
  value: string | number | undefined;
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'ToDo':
      return 'badge bg-secondary-subtle text-dark';
    case 'WIP':
      return 'badge bg-primary-subtle text-dark';
    case 'Done':
      return 'badge bg-success-subtle text-dark';
    default:
      return 'badge bg-light text-dark';
  }
};

const getTypeClass = (type: string) => {
    const typeName = type.toLowerCase();
    switch (typeName) {
        case 'epic':
            return 'badge bg-epic text-light';
        case 'story':
            return 'badge bg-story text-light';
        case 'task':
            return 'badge bg-task text-light';
        case 'subtask':
            return 'badge bg-subtask text-light';
        default:
            return 'badge bg-secondary';
    }
}

const Badge: React.FC<BadgeProps> = ({ type, value }) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let className = 'badge';
  let text = value.toString();

  switch (type) {
    case 'status':
      className = getStatusClass(value.toString());
      break;
    case 'type':
      className = getTypeClass(value.toString());
      break;
    case 'points':
      className = 'badge bg-info-subtle text-dark';
      text = `${value} pts`;
      break;
    case 'sprint':
      className = 'badge bg-warning-subtle text-dark';
      break;
    default:
      className = 'badge bg-secondary';
  }

  return <span className={className}>{text}</span>;
};

export default Badge;