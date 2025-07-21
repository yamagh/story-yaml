import React from 'react';

type BadgeType = 'status' | 'points' | 'sprint' | 'type';

interface BadgeProps {
  type: BadgeType;
  value: string | number | undefined;
  itemType?: string; // Only for type='type'
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'ToDo':
      return 'badge bg-secondary-subtle text-dark';
    case 'WIP':
      return 'badge bg-primary-subtle text-dark';
    case 'Done':
      return 'badge bg-success';
    default:
      return 'badge bg-secondary';
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
            return 'badge bg-secondary-subtle text-dark';
    }
}

export const Badge: React.FC<BadgeProps> = ({ type, value, itemType }) => {
  const getClass = () => {
    switch (type) {
      case 'status':
        return getStatusClass(value as string);
      case 'points':
        return 'badge bg-secondary-subtle text-dark';
      case 'sprint':
        return 'badge bg-info-subtle text-dark';
      case 'type':
        return getTypeClass(itemType || '');
      default:
        return 'badge bg-light';
    }
  };

  if (!value) return null;

  return <span className={getClass()}>{type === 'type' ? itemType : value}</span>;
};
