/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemDetails } from './ItemDetails';
import { Epic, Story, Task, Item } from '../../types';
import { StoryDataProvider, useStoryData } from '../contexts/StoryDataContext';

vi.mock('../contexts/StoryDataContext');

const mockEpic: Epic = {
    id: 'epic-1',
    title: 'Test Epic',
    description: 'Epic Description',
    stories: [
        {
            id: 'story-1',
            title: 'Test Story',
            as: 'User',
            'i want': 'to test',
            'so that': 'it works',
            description: 'Story Description',
            status: 'ToDo',
            points: 5,
            sprint: 'Sprint 1',
            'definition of done': [],
            'sub tasks': [],
        }
    ],
};

const mockStory: Story = {
    id: 'story-1',
    title: 'Test Story',
    as: 'User',
    'i want': 'to test',
    'so that': 'it works',
    description: 'Story Description',
    status: 'ToDo',
    points: 5,
    sprint: 'Sprint 1',
    'definition of done': [],
    'sub tasks': [
        {
            id: 'subtask-1',
            title: 'Test SubTask',
            description: 'SubTask Description',
            status: 'ToDo',
        }
    ],
};

describe('ItemDetails', () => {
    const showEditItemForm = vi.fn();
    const deleteItem = vi.fn();
    const selectItem = vi.fn();

    const renderComponent = (selectedItem: (Item & { type: string }) | null, selectedItemParent: Epic | Story | Task | null = null) => {
        (useStoryData as vi.Mock).mockReturnValue({
            selectedItem,
            selectedItemParent,
            showEditItemForm,
            deleteItem,
            selectItem,
        });

        return render(
            <StoryDataProvider>
                <ItemDetails />
            </StoryDataProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays an info message when no item is selected', () => {
        renderComponent(null);
        expect(screen.getByText('Click on an item to see details or add a new item.')).toBeInTheDocument();
    });

    it('displays parent info card when a parent exists', () => {
        renderComponent({ ...mockStory, type: 'Story' }, mockEpic);
        expect(screen.getByText(/Parent/i)).toBeInTheDocument();
        expect(screen.getByText(mockEpic.title)).toBeInTheDocument();
    });

    it('does not display parent info card when there is no parent', () => {
        renderComponent({ ...mockEpic, type: 'Epic' });
        expect(screen.queryByText(/Parent:/)).not.toBeInTheDocument();
    });

    it('calls showEditItemForm when the Edit button is clicked', () => {
        renderComponent({ ...mockStory, type: 'Story' });
        fireEvent.click(screen.getByText('Edit'));
        expect(showEditItemForm).toHaveBeenCalledTimes(1);
    });

    it('opens confirm dialog when Delete button is clicked', () => {
        renderComponent({ ...mockStory, type: 'Story' });
        fireEvent.click(screen.getByText('Delete'));
        expect(screen.getByText('Delete Story')).toBeInTheDocument();
    });

    it('calls deleteItem with id when deletion is confirmed', () => {
        renderComponent({ ...mockStory, type: 'Story' });
        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getByText('Confirm'));
        expect(deleteItem).toHaveBeenCalledWith(mockStory.id);
    });
});
