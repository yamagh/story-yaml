/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemDetails } from './ItemDetails';
import { Epic, Story, Task, Item } from '../../types';
import { StoryDataContext } from '../contexts/StoryDataContext';
import { UIStateContext } from '../contexts/UIStateContext';
import { Sidebar } from './Sidebar';
import { SidebarContent } from './SidebarContent';

vi.mock('../hooks/useVscode');

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
    const mockShowEditItemForm = vi.fn();
    const mockDeleteItem = vi.fn();
    const mockSelectItem = vi.fn();

    const renderComponent = (selectedItem: Item | null, selectedItemParent: Epic | Story | Task | null = null) => {
        const storyDataContextValue = {
            storyData: { epics: [mockEpic], tasks: [] },
            error: null,
            setError: vi.fn(),
            addItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: mockDeleteItem,
            handleDragEnd: vi.fn(),
            findItemAndParent: vi.fn().mockReturnValue({ item: selectedItem, parent: selectedItemParent }),
        };

        const uiStateContextValue = {
            selectedItem,
            selectedItemParent,
            formVisible: false,
            isEditing: false,
            formType: null,
            formParentId: null,
            selectItem: mockSelectItem,
            showAddItemForm: vi.fn(),
            showEditItemForm: mockShowEditItemForm,
            hideForm: vi.fn(),
            handleFormSubmit: vi.fn(),
        };

        return render(
            <StoryDataContext.Provider value={storyDataContextValue}>
                <UIStateContext.Provider value={uiStateContextValue}>
                    <ItemDetails />
                </UIStateContext.Provider>
            </StoryDataContext.Provider>
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
        renderComponent(mockStory, mockEpic);
        expect(screen.getByText(/Parent/i)).toBeInTheDocument();
        expect(screen.getByText(mockEpic.title)).toBeInTheDocument();
    });

    it('does not display parent info card when there is no parent', () => {
        renderComponent(mockEpic);
        expect(screen.queryByText(/Parent:/)).not.toBeInTheDocument();
    });

    it('calls showEditItemForm when the Edit button is clicked', () => {
        renderComponent(mockStory);
        fireEvent.click(screen.getByText('Edit'));
        expect(mockShowEditItemForm).toHaveBeenCalledTimes(1);
    });

    it('opens confirm dialog when Delete button is clicked', () => {
        renderComponent(mockStory);
        fireEvent.click(screen.getByText('Delete'));
        expect(screen.getByText('Delete Story')).toBeInTheDocument();
    });

    it('calls deleteItem with id when deletion is confirmed', () => {
        renderComponent(mockStory);
        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getByText('Confirm'));
        expect(mockDeleteItem).toHaveBeenCalledWith(mockStory.id);
    });
});

describe('ItemDetails (Integration with ItemForm)', () => {
    const mockSelectItem = vi.fn();
    const mockDeleteItem = vi.fn();
    const mockUpdateItem = vi.fn();
    const mockAddItem = vi.fn();

    let uiState: any;

    const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [innerState, setInnerState] = React.useState(uiState);

        const storyDataContextValue = {
            storyData: { epics: [mockEpic], tasks: [] },
            error: null,
            setError: vi.fn(),
            addItem: mockAddItem,
            updateItem: mockUpdateItem,
            deleteItem: mockDeleteItem,
            handleDragEnd: vi.fn(),
            findItemAndParent: vi.fn().mockImplementation((items, id) => {
                if (id === mockStory.id) return { item: mockStory, parent: mockEpic };
                if (id === mockEpic.id) return { item: mockEpic, parent: null };
                return null;
            }),
        };

        const uiStateContextValue = {
            ...innerState,
            selectItem: (item: Item) => setInnerState((s: any) => ({ ...s, selectedItem: item, formVisible: false })),
            showEditItemForm: () => setInnerState((s: any) => ({ ...s, formVisible: true, isEditing: true, formType: 'stories', formItemData: s.selectedItem })),
            hideForm: () => setInnerState((s: any) => ({ ...s, formVisible: false, isEditing: false })),
            handleFormSubmit: (e: React.FormEvent) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const title = formData.get('title') as string;
                const updatedItem = { ...innerState.selectedItem, title };
                mockUpdateItem(innerState.selectedItem.id, { title });
                setInnerState((s: any) => ({ ...s, selectedItem: updatedItem, formVisible: false, isEditing: false }));
            },
        };

        return (
            <StoryDataContext.Provider value={storyDataContextValue}>
                <UIStateContext.Provider value={uiStateContextValue}>
                    {children}
                </UIStateContext.Provider>
            </StoryDataContext.Provider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        uiState = {
            selectedItem: mockStory,
            selectedItemParent: mockEpic,
            formVisible: false,
            isEditing: false,
            formType: null,
            formParentId: null,
            formItemData: undefined,
        };
    });

    it('updates item details after editing and saving', async () => {
        const { getByText, getByRole, getByLabelText } = render(
            <TestWrapper>
                <Sidebar>
                    <SidebarContent />
                </Sidebar>
            </TestWrapper>
        );

        expect(getByText('Test Story')).toBeInTheDocument();

        fireEvent.click(getByRole('button', { name: /edit/i }));

        expect(getByLabelText(/title/i)).toHaveValue('Test Story');

        fireEvent.change(getByLabelText(/title/i), { target: { value: 'Updated Test Story' } });

        fireEvent.submit(getByRole('button', { name: /save/i }));

        expect(mockUpdateItem).toHaveBeenCalledWith(mockStory.id, { title: 'Updated Test Story' });
        
        expect(getByText('Updated Test Story')).toBeInTheDocument();
    });
});