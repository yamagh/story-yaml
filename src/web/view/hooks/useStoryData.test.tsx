/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import React, { FC, PropsWithChildren } from 'react';
import { StoryDataProvider, useStoryData } from '../contexts/StoryDataContext';
import { useVscode } from './useVscode';
import { StoryFile } from '../../types';

// Mock useVscode hook
vi.mock('./useVscode', () => ({
  useVscode: vi.fn(),
}));

const mockStoryFile: StoryFile = {
  epics: [
    {
      id: 'epic-1',
      title: 'Epic 1',
      description: 'First epic',
      stories: [
        {
          id: 'story-1-1',
          title: 'Story 1.1',
          status: 'ToDo',
          'sub tasks': [
            { id: 'subtask-1-1-1', title: 'Subtask 1.1.1', status: 'ToDo' },
          ],
        },
      ],
    },
  ],
  tasks: [
    { id: 'task-1', title: 'Task 1', status: 'WIP' },
  ],
};

const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();

const wrapper: FC<PropsWithChildren> = ({ children }) => (
    <StoryDataProvider>{children}</StoryDataProvider>
);

describe('useStoryData', () => {
  beforeEach(() => {
    (useVscode as Mock).mockReturnValue({
      storyData: JSON.parse(JSON.stringify(mockStoryFile)), // Deep copy to isolate tests
      addItem: mockAddItem,
      updateItem: mockUpdateItem,
      deleteItem: mockDeleteItem,
      updateStoryFile: vi.fn(),
    });
    vi.clearAllMocks();
  });

  it('should initialize with story data', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    expect(result.current.storyData).toEqual(mockStoryFile);
    expect(result.current.selectedItem).toBeNull();
  });

  it('should select an item and its parent correctly', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    const storyToSelect = mockStoryFile.epics[0].stories[0];

    act(() => {
      result.current.selectItem(storyToSelect, 'Story');
    });

    expect(result.current.selectedItem?.id).toBe('story-1-1');
    expect(result.current.selectedItemParent?.id).toBe('epic-1');
  });

  it('should select a top-level item without a parent', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    const epicToSelect = mockStoryFile.epics[0];

    act(() => {
      result.current.selectItem(epicToSelect, 'Epic');
    });

    expect(result.current.selectedItem?.id).toBe('epic-1');
    expect(result.current.selectedItemParent).toBeNull();
  });
  
  it('should select a sub-task and its story parent', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    const subtaskToSelect = mockStoryFile.epics[0].stories[0]['sub tasks']![0];

    act(() => {
        result.current.selectItem(subtaskToSelect, 'SubTask');
    });

    expect(result.current.selectedItem?.id).toBe('subtask-1-1-1');
    expect(result.current.selectedItemParent?.id).toBe('story-1-1');
  });

  it('should show and hide the add item form', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });

    act(() => {
      result.current.showAddItemForm('stories', 'epic-1');
    });

    expect(result.current.formVisible).toBe(true);
    expect(result.current.formType).toBe('stories');
    
    act(() => {
      result.current.hideForm();
    });
    
    expect(result.current.formVisible).toBe(false);
    expect(result.current.selectedItem?.id).toBe('epic-1');
  });

  it('should show and hide the edit item form', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    const storyToSelect = mockStoryFile.epics[0].stories[0];

    act(() => {
      result.current.selectItem(storyToSelect, 'Story');
    });

    act(() => {
      result.current.showEditItemForm();
    });

    expect(result.current.formVisible).toBe(true);
    expect(result.current.isEditing).toBe(true);
    expect(result.current.formItemData?.id).toBe('story-1-1');
    expect(result.current.selectedItem).toBeNull();

    act(() => {
      result.current.hideForm();
    });

    expect(result.current.formVisible).toBe(false);
    expect(result.current.selectedItem?.id).toBe('story-1-1');
  });

  it('should call updateItem on form submit for edit', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    const storyToEdit = mockStoryFile.epics[0].stories[0];

    act(() => {
      result.current.selectItem(storyToEdit, 'Story');
    });
    act(() => {
      result.current.showEditItemForm();
    });

    const mockForm = document.createElement('form');
    const titleInput = document.createElement('input');
    titleInput.name = 'title';
    titleInput.value = 'Updated Title';
    mockForm.appendChild(titleInput);
    const event = { preventDefault: vi.fn(), target: mockForm } as unknown as React.FormEvent;

    act(() => {
      result.current.handleFormSubmit(event);
    });

    expect(mockUpdateItem).toHaveBeenCalledWith({
      id: 'story-1-1',
      updatedData: expect.objectContaining({ title: 'Updated Title' }),
    });
  });

  it('should call addItem on form submit for new item', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });

    act(() => {
      result.current.showAddItemForm('tasks');
    });

    const mockForm = document.createElement('form');
    const titleInput = document.createElement('input');
    titleInput.name = 'title';
    titleInput.value = 'New Task Title';
    mockForm.appendChild(titleInput);
    const event = { preventDefault: vi.fn(), target: mockForm } as unknown as React.FormEvent;

    act(() => {
      result.current.handleFormSubmit(event);
    });

    expect(mockAddItem).toHaveBeenCalledWith({
      itemType: 'tasks',
      parentId: undefined,
      values: expect.objectContaining({ title: 'New Task Title' }),
    });
  });

  it('should call deleteItem with the correct id', () => {
    const { result } = renderHook(() => useStoryData(), { wrapper });
    
    act(() => {
        result.current.deleteItem('story-1-1');
    });

    expect(mockDeleteItem).toHaveBeenCalledWith({ id: 'story-1-1' });
  });
});