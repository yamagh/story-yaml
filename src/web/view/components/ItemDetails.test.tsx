/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemDetails } from './ItemDetails';
import { Epic, Story, Task, Item } from '../../types';
import { useStoryData } from '../contexts/StoryDataContext';
import { useUIState } from '../contexts/UIStateContext';
import { Sidebar } from './Sidebar';
import { SidebarContent } from './SidebarContent';

vi.mock('../hooks/useVscode');
vi.mock('../contexts/StoryDataContext');
vi.mock('../contexts/UIStateContext');

const mockEpic: Epic = {
    id: 'epic-1',
    title: 'Test Epic',
    type: 'Epic',
    description: 'Epic Description',
    stories: [
        {
            id: 'story-1',
            type: 'Story',
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
    type: 'Story',
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
            type: 'SubTask',
            title: 'Test SubTask',
            description: 'SubTask Description',
            status: 'ToDo',
        }
    ],
};

describe('ItemDetails (Unit)', () => {
    const mockDispatch = vi.fn();
    const mockShowEditItemForm = vi.fn();
    const mockSelectItem = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useStoryData as vi.Mock).mockReturnValue({
            state: {
                storyData: { epics: [mockEpic], tasks: [] },
                error: null,
            },
            dispatch: mockDispatch,
            findItemAndParent: vi.fn((_items, id) => {
                if (id === mockStory.id) return { item: mockStory, parent: mockEpic };
                if (id === mockEpic.id) return { item: mockEpic, parent: null };
                return null;
            }),
        });
    });

    const setup = (selectedItem: Item | null, selectedItemParent: Epic | Story | Task | null = null) => {
        (useUIState as vi.Mock).mockReturnValue({
            selectedItem,
            selectedItemParent,
            showEditItemForm: mockShowEditItemForm,
            selectItem: mockSelectItem,
        });
        return render(<ItemDetails />);
    };

    it('displays an info message when no item is selected', () => {
        setup(null);
        expect(screen.getByText('Click on an item to see details or add a new item.')).toBeInTheDocument();
    });

    it('displays parent info card when a parent exists', () => {
        setup(mockStory, mockEpic);
        expect(screen.getByText(/Parent/i)).toBeInTheDocument();
        expect(screen.getByText(mockEpic.title)).toBeInTheDocument();
    });

    it('does not display parent info card when there is no parent', () => {
        setup(mockEpic);
        expect(screen.queryByText(/Parent:/)).not.toBeInTheDocument();
    });

    it('calls showEditItemForm when the Edit button is clicked', () => {
        setup(mockStory);
        fireEvent.click(screen.getByText('Edit'));
        expect(mockShowEditItemForm).toHaveBeenCalledTimes(1);
    });

    it('opens confirm dialog when Delete button is clicked', () => {
        setup(mockStory);
        fireEvent.click(screen.getByText('Delete'));
        expect(screen.getByText('Delete Story')).toBeInTheDocument();
    });

    it('calls dispatch with delete action when deletion is confirmed', () => {
        setup(mockStory);
        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getByText('Confirm'));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'DELETE_ITEM', payload: { id: mockStory.id } });
    });
});

describe('ItemDetails (Integration with ItemForm)', () => {
    const mockDispatch = vi.fn();
    const mockUpdateItem = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockDispatch.mockImplementation((action) => {
            if (action.type === 'UPDATE_ITEM') {
                mockUpdateItem(action.payload.id, action.payload.updatedData);
            }
        });

        (useStoryData as vi.Mock).mockReturnValue({
            state: {
                storyData: { epics: [mockEpic], tasks: [] },
                error: null,
            },
            dispatch: mockDispatch,
            findItemAndParent: vi.fn(),
        });
    });

    const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [uiState, setUiState] = React.useState({
            selectedItem: mockStory as Item | null,
            selectedItemParent: mockEpic as Epic | Story | Task | null,
            formVisible: false,
            isEditing: false,
            formType: null,
            formParentId: null,
            formItemData: undefined,
        });

        const showEditItemForm = () => setUiState(s => ({ ...s, formVisible: true, isEditing: true, formType: 'stories' as const, formItemData: s.selectedItem! }));
        
        (useUIState as vi.Mock).mockReturnValue({
            ...uiState,
            selectItem: (item: Item | null) => setUiState(s => ({ ...s, selectedItem: item, formVisible: false })),
            showEditItemForm,
            hideForm: () => setUiState(s => ({ ...s, formVisible: false, isEditing: false })),
            handleFormSubmit: (e: React.FormEvent) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const title = formData.get('title') as string;
                mockDispatch({ type: 'UPDATE_ITEM', payload: { id: uiState.selectedItem!.id, updatedData: { title } } });
                setUiState(s => ({ ...s, selectedItem: { ...s.selectedItem!, title }, formVisible: false, isEditing: false }));
            },
        });

        return (
            <Sidebar>
                <SidebarContent />
            </Sidebar>
        );
    };

    it('updates item details after editing and saving', async () => {
        render(<TestWrapper />);

        expect(screen.getByText('Test Story')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const titleInput = screen.getByLabelText(/title/i);
        expect(titleInput).toHaveValue('Test Story');

        fireEvent.change(titleInput, { target: { value: 'Updated Test Story' } });

        // Find the form and submit it
        const form = titleInput.closest('form');
        expect(form).not.toBeNull();
        fireEvent.submit(form!);

        expect(mockUpdateItem).toHaveBeenCalledWith(mockStory.id, { title: 'Updated Test Story' });
        
        expect(screen.getByText('Updated Test Story')).toBeInTheDocument();
    });
});
