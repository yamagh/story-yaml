
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStoryFilter } from './useStoryFilter';
import { StoryFile, Epic, Story, Task } from '../../types';

const mockStoryData: StoryFile = {
  epics: [
    {
      title: 'Epic 1',
      description: 'Epic description 1',
      stories: [
        {
          title: 'Story 1-1',
          as: 'User',
          'i want': 'to do something',
          'so that': 'I can achieve a goal',
          description: 'Story description 1-1',
          status: 'ToDo',
          points: 5,
          sprint: 'Sprint 1',
          'definition of done': [],
          'sub tasks': [],
        },
        {
          title: 'Story 1-2',
          as: 'User',
          'i want': 'to do another thing',
          'so that': 'I can achieve another goal',
          description: 'Story description 1-2',
          status: 'WIP',
          points: 3,
          sprint: 'Sprint 2',
          'definition of done': [],
          'sub tasks': [],
        },
      ],
    },
  ],
  tasks: [
    {
      title: 'Task 1',
      description: 'Task description 1',
      status: 'Done',
      points: 8,
      sprint: 'Sprint 1',
      'definition of done': [],
      'sub tasks': [],
    },
    {
        title: 'Task 2',
        description: 'A general task',
        status: 'ToDo',
        points: 2,
        sprint: 'Sprint 3',
        'definition of done': [],
        'sub tasks': [],
      },
  ],
};

describe('useStoryFilter', () => {
  it('should return all items when no filters are applied', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));
    expect(result.current.filteredData.epics).toHaveLength(1);
    expect(result.current.filteredData.epics[0].stories).toHaveLength(2);
    expect(result.current.filteredData.tasks).toHaveLength(2);
  });

  it('should filter by status', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));
    
    act(() => {
      result.current.setFilterStatus(['ToDo']);
    });

    expect(result.current.filteredData.epics[0].stories).toHaveLength(1);
    expect(result.current.filteredData.epics[0].stories[0].title).toBe('Story 1-1');
    expect(result.current.filteredData.tasks).toHaveLength(1);
    expect(result.current.filteredData.tasks[0].title).toBe('Task 2');
  });

  it('should filter by sprint', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));

    act(() => {
      result.current.setFilterSprint('Sprint 1');
    });
    
    expect(result.current.filteredData.epics[0].stories).toHaveLength(1);
    expect(result.current.filteredData.epics[0].stories[0].title).toBe('Story 1-1');
    expect(result.current.filteredData.tasks).toHaveLength(1);
    expect(result.current.filteredData.tasks[0].title).toBe('Task 1');
  });

  it('should filter by keyword in title', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));

    act(() => {
      result.current.setFilterKeyword('Story');
    });

    expect(result.current.filteredData.epics).toHaveLength(1);
    expect(result.current.filteredData.epics[0].stories).toHaveLength(2);
    expect(result.current.filteredData.tasks).toHaveLength(0);
  });

  it('should filter by keyword in description', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));

    act(() => {
      result.current.setFilterKeyword('general');
    });

    expect(result.current.filteredData.epics).toHaveLength(0);
    expect(result.current.filteredData.tasks).toHaveLength(1);
    expect(result.current.filteredData.tasks[0].title).toBe('Task 2');
  });

  it('should combine filters (status + sprint)', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));

    act(() => {
      result.current.setFilterStatus(['Done']);
      result.current.setFilterSprint('Sprint 1');
    });

    expect(result.current.filteredData.epics[0].stories).toHaveLength(0);
    expect(result.current.filteredData.tasks).toHaveLength(1);
    expect(result.current.filteredData.tasks[0].title).toBe('Task 1');
  });

  it('should be case-insensitive for keyword search', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));

    act(() => {
      result.current.setFilterKeyword('epic');
    });

    expect(result.current.filteredData.epics).toHaveLength(1);
    expect(result.current.filteredData.epics[0].title).toBe('Epic 1');
  });

  it('should return all items when filters are cleared', () => {
    const { result } = renderHook(() => useStoryFilter(mockStoryData));

    act(() => {
        result.current.setFilterStatus(['WIP']);
        result.current.setFilterSprint('Sprint 2');
        result.current.setFilterKeyword('Story');
    });

    act(() => {
        result.current.setFilterStatus([]);
        result.current.setFilterSprint('');
        result.current.setFilterKeyword('');
    });

    expect(result.current.filteredData.epics).toHaveLength(1);
    expect(result.current.filteredData.epics[0].stories).toHaveLength(2);
    expect(result.current.filteredData.tasks).toHaveLength(2);
  });
});
