/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ItemDetails } from './ItemDetails';
import { Epic, Story, Task, Item, StoryFile } from '../../types';
import { StoryDataProvider, useStoryData } from '../contexts/StoryDataContext';
import { useVscode } from '../hooks/useVscode';
import { Sidebar } from './Sidebar';

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
    let originalUseStoryData: unknown;

    beforeEach(async () => {
        originalUseStoryData = (await vi.importActual<Record<string, unknown>>('../contexts/StoryDataContext')).useStoryData;
        (useStoryData as vi.Mock).mockImplementation(originalUseStoryData as () => unknown);
    });

    afterEach(() => {
        (useStoryData as vi.Mock).mockReset();
    });

    const initialTask: Task = {
        id: 'task-1',
        title: 'Initial Task Title',
        description: 'Initial description.',
        status: 'ToDo',
        points: 5,
        sprint: 'Sprint 1',
        'definition of done': [],
        subtasks: [],
    };

    const initialStoryFile: StoryFile = {
        epics: [],
        tasks: [initialTask],
    };

    it('updates item details after editing and saving', async () => {
        const mockUpdateItem = vi.fn();
        const useVscodeMock = useVscode as vi.Mock;

        let storyData = JSON.parse(JSON.stringify(initialStoryFile));

        useVscodeMock.mockImplementation(() => ({
            storyData: storyData,
            error: null,
            newId: null,
            setError: vi.fn(),
            addItem: vi.fn(),
            updateItem: (update: { id: string, updatedData: Partial<Item> }) => {
                const newStoryData = JSON.parse(JSON.stringify(storyData));
                const task = newStoryData.tasks.find((t: Task) => t.id === update.id);
                if (task) {
                    Object.assign(task, update.updatedData);
                }
                storyData = newStoryData;
                mockUpdateItem(update);
            },
            deleteItem: vi.fn(),
            updateStoryFile: vi.fn(),
        }));

        const TestApp = () => {
            const data = useStoryData();
            const initialSelectionDone = React.useRef(false);
            React.useEffect(() => {
                if (!initialSelectionDone.current && data.storyData?.tasks?.[0]) {
                    initialSelectionDone.current = true;
                    act(() => {
                        data.selectItem(data.storyData.tasks[0], 'Task');
                    });
                }
            }, [data]);

            return <Sidebar />;
        };

        const { unmount, container, rerender } = render(
            <StoryDataProvider>
                <TestApp />
            </StoryDataProvider>
        );

        await screen.findByText('Initial Task Title');

        fireEvent.click(screen.getByRole('button', { name: /edit/i }));

        const titleInput = await screen.findByLabelText('Title');
        fireEvent.change(titleInput, { target: { value: 'Updated Task Title' } });
        const descriptionInput = screen.getByLabelText('Description');
        fireEvent.change(descriptionInput, { target: { value: 'Updated description.' } });

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        await act(async () => {
            fireEvent.submit(form!);
        });

        unmount();
        render(
            <StoryDataProvider>
                <TestApp />
            </StoryDataProvider>
        );

        expect(await screen.findByText('Updated Task Title')).toBeInTheDocument();
        expect(screen.getByText('Updated description.')).toBeInTheDocument();
        expect(mockUpdateItem).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'task-1',
                updatedData: expect.objectContaining({
                    title: 'Updated Task Title',
                    description: 'Updated description.',
                }),
            })
        );
    });
});