import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { StoryFile } from '../../types';
import * as vscode from '../hooks/useVscode';

// Mock useVscode hook
const mockPostMessage = vi.fn();

const initialStoryData: StoryFile = {
    epics: [
        { id: 'epic-1', title: 'Epic 1', type: 'Epic', stories: [] },
    ],
    tasks: [
        { id: 'task-1', title: 'Task 1', type: 'Task', status: 'ToDo' },
    ],
};

const TestApp = () => {
    const [storyData, setStoryData] = useState<StoryFile | null>(initialStoryData);

    vi.spyOn(vscode, 'useVscode').mockReturnValue({
        storyData,
        error: null,
        updateStoryFile: (newStoryData) => {
            setStoryData(newStoryData);
        },
        postMessage: mockPostMessage,
    });

    return <App />;
}

describe('ItemForm Submission and Selection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset story data for each test
        initialStoryData.tasks = [{ id: 'task-1', title: 'Task 1', type: 'Task', status: 'ToDo' }];
    });

    it('should select the new item in StoryTable and ItemDetails after saving', async () => {
        render(<TestApp />);

        // 1. Wait for the app to load
        await waitFor(() => {
            expect(screen.getByText('Task 1')).toBeInTheDocument();
        });

        // 2. Click "Add New Task" button to show the form
        const addTaskButton = screen.getByRole('button', { name: /add new task/i });
        fireEvent.click(addTaskButton);

        // 3. The form should be visible
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /add new task/i })).toBeInTheDocument();
        });

        // 4. Fill out the form
        const titleInput = screen.getByLabelText(/title/i);
        const saveButton = screen.getByRole('button', { name: /save/i });

        const newTaskTitle = 'A Brand New Task';
        fireEvent.change(titleInput, { target: { value: newTaskTitle } });

        // 5. Click save
        fireEvent.click(saveButton);

        // 6. The form should disappear, and the new item should be selected
        await waitFor(() => {
            // Form is gone
            expect(screen.queryByRole('heading', { name: /add new task/i })).not.toBeInTheDocument();
            
            // New item is in the ItemDetails view
            const itemDetailsTitle = screen.getByTestId('item-details-title');
            expect(itemDetailsTitle).toHaveTextContent(newTaskTitle);

            // New item is selected in the table
            const table = screen.getByRole('table');
            const tableRow = within(table).getByText(newTaskTitle).closest('tr');
            expect(tableRow).toHaveClass('selected-row');
        });
    });
});
