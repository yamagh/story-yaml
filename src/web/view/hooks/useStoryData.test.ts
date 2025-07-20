/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStoryData } from './useStoryData';
import { useVscode } from './useVscode';
import { StoryFile, Item, Epic, Story, Task } from '../../types';

// Mock useVscode hook
vi.mock('./useVscode', () => ({
  useVscode: vi.fn(),
}));

const mockStoryFile: StoryFile = {
  epics: [
    {
      title: 'Epic 1',
      description: 'First epic',
      stories: [
        {
          title: 'Story 1.1',
          status: 'ToDo',
          'sub tasks': [
            { title: 'Subtask 1.1.1', status: 'ToDo' },
          ],
        },
      ],
    },
  ],
  tasks: [
    { title: 'Task 1', status: 'WIP' },
  ],
};

describe('useStoryData', () => {
  beforeEach(() => {
    (useVscode as vi.Mock).mockReturnValue({
      storyData: mockStoryFile,
      addItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      updateStoryFile: vi.fn(),
    });
  });

  it('should initialize with story data', () => {
    const { result } = renderHook(() => useStoryData());
    expect(result.current.storyData).toEqual(mockStoryFile);
    expect(result.current.selectedItem).toBeNull();
  });

  it('should select an item and its parent correctly', () => {
    const { result } = renderHook(() => useStoryData());
    const storyToSelect = mockStoryFile.epics[0].stories[0];

    act(() => {
      result.current.selectItem(storyToSelect, 'Story');
    });

    expect(result.current.selectedItem?.title).toBe('Story 1.1');
    expect(result.current.selectedItemParent?.title).toBe('Epic 1');
  });

  it('should select a top-level item without a parent', () => {
    const { result } = renderHook(() => useStoryData());
    const epicToSelect = mockStoryFile.epics[0];

    act(() => {
      result.current.selectItem(epicToSelect, 'Epic');
    });

    expect(result.current.selectedItem?.title).toBe('Epic 1');
    expect(result.current.selectedItemParent).toBeNull();
  });
  
  it('should select a sub-task and its story parent', () => {
    const { result } = renderHook(() => useStoryData());
    const subtaskToSelect = mockStoryFile.epics[0].stories[0]['sub tasks']![0];

    act(() => {
        result.current.selectItem(subtaskToSelect, 'SubTask');
    });

    expect(result.current.selectedItem?.title).toBe('Subtask 1.1.1');
    expect(result.current.selectedItemParent?.title).toBe('Story 1.1');
  });

  it('should show and hide the add item form', () => {
    const { result } = renderHook(() => useStoryData());

    act(() => {
      result.current.showAddItemForm('stories', 'Epic 1');
    });

    expect(result.current.formVisible).toBe(true);
    expect(result.current.formType).toBe('stories');
    expect(result.current.formParentId).toBe('Epic 1');
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.selectedItemParent).toBeNull();

    act(() => {
      result.current.hideForm();
    });
    
    // When cancelling add, it should show parent's details
    expect(result.current.formVisible).toBe(false);
    expect(result.current.selectedItem?.title).toBe('Epic 1');
  });

  it('should show and hide the edit item form', () => {
    const { result } = renderHook(() => useStoryData());
    const storyToSelect = mockStoryFile.epics[0].stories[0];

    act(() => {
      result.current.selectItem(storyToSelect, 'Story');
    });

    act(() => {
      result.current.showEditItemForm();
    });

    expect(result.current.formVisible).toBe(true);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.formItemData?.title).toBe('Story 1.1');
    expect(result.current.selectedItem).toBeNull();

    act(() => {
      result.current.hideForm();
    });

    // When cancelling edit, it should show the original item's details
    expect(result.current.formVisible).toBe(false);
    expect(result.current.selectedItem?.title).toBe('Story 1.1');
  });
});
