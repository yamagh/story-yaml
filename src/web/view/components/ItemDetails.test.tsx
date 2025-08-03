/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemDetails } from './ItemDetails';
import { Epic, Story, Task, Item } from '../../types';
import { StoryDataProvider, useStoryData } from '../contexts/StoryDataContext';
import { useVscode } from '../hooks/useVscode';
import { Sidebar } from './Sidebar';
import { SidebarContent } from './SidebarContent';

vi.mock('../hooks/useVscode');

vi.mock('../contexts/StoryDataContext', async () => {
    const actual = await vi.importActual('../contexts/StoryDataContext');
    return {
        ...actual,
        useStoryData: vi.fn(),
    };
});

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
            'subtasks': [],
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
    'subtasks': [
        {
            id: 'subtask-1',
            title: 'Test SubTask',
            description: 'SubTask Description',
            status: 'ToDo',
        }
    ],
};

describe('ItemDetails (Unit)', () => {
    const showEditItemForm = vi.fn();
    const deleteItem = vi.fn();
    const selectItem = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useVscode as vi.Mock).mockReturnValue({
            storyData: { epics: [], tasks: [] },
            error: null,
            newId: null,
            setError: vi.fn(),
            addItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
            updateStoryFile: vi.fn(),
        });
    });

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

describe('ItemDetails (Integration with ItemForm)', () => {
    const mockSetSelectedItem = vi.fn();
    const mockDeleteItem = vi.fn();
    let formVisible = false;

    const mockShowEditItemForm = vi.fn(() => {
        formVisible = true;
    });
    const mockHideForm = vi.fn(() => {
        formVisible = false;
    });


    const renderWithProvider = (
        selectedItem: (Item & { type: string }) | null,
        selectedItemParent: Epic | Story | Task | null = null
    ) => {
        (useStoryData as vi.Mock).mockImplementation(() => ({
            selectedItem,
            selectedItemParent,
            selectItem: mockSetSelectedItem,
            showEditItemForm: mockShowEditItemForm,
            deleteItem: mockDeleteItem,
            storyData: { epics: [mockEpic], tasks: [] },
            formVisible: formVisible,
            formType: formVisible ? 'edit' : null,
            formItemData: formVisible ? selectedItem : null,
            handleFormSubmit: vi.fn(),
            hideForm: mockHideForm,
            showAddItemForm: vi.fn(),
        }));

        return render(
            <StoryDataProvider>
                <Sidebar>
                    <SidebarContent />
                </Sidebar>
            </StoryDataProvider>
        );
    };

    beforeEach(() => {
        formVisible = false;
        vi.clearAllMocks();
    });

    it('updates item details after editing and saving', async () => {
        const { rerender } = renderWithProvider({ ...mockStory, type: 'Story' }, mockEpic);

        expect(screen.getByText('Test Story')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));
        expect(mockShowEditItemForm).toHaveBeenCalled();

        // Re-render with the updated state after showing the form
        rerender(
            <StoryDataProvider>
                <Sidebar>
                    <SidebarContent />
                </Sidebar>
            </StoryDataProvider>
        );

        // Now the form should be visible
        expect(screen.getByLabelText(/title/i)).toHaveValue('Test Story');

        // Simulate user typing
        fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Updated Test Story' } });

        // Mock the form submission which would update the storyData
        const updatedStory = { ...mockStory, title: 'Updated Test Story' };
        (useStoryData as vi.Mock).mockImplementation(() => ({
            selectedItem: { ...updatedStory, type: 'Story' },
            selectedItemParent: mockEpic,
            selectItem: mockSetSelectedItem,
            showEditItemForm: mockShowEditItemForm,
            deleteItem: mockDeleteItem,
            storyData: { epics: [{...mockEpic, stories: [updatedStory]}], tasks: [] },
            formVisible: false, // Form is hidden after submit
            hideForm: mockHideForm,
        }));

        // Re-render after "submission"
        rerender(
            <StoryDataProvider>
                <Sidebar>
                    <SidebarContent />
                </Sidebar>
            </StoryDataProvider>
        );

        // Check if the updated title is displayed in ItemDetails
        expect(screen.getByText('Updated Test Story')).toBeInTheDocument();
    });
});
