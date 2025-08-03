import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { StoryFile } from '../../types';
import * as vscode from '../hooks/useVscode';

// Mock useVscode hook
const mockUpdateStoryFile = vi.fn();
const mockPostMessage = vi.fn();

const initialStoryData: StoryFile = {
    epics: [
        { id: 'epic-1', title: 'Epic 1', type: 'Epic', stories: [] },
    ],
    tasks: [
        { id: 'task-1', title: 'Task 1', type: 'Task', status: 'ToDo' },
    ],
};

// Custom render function to wrap providers
const renderApp = (storyData: StoryFile | null = initialStoryData) => {
    vi.spyOn(vscode, 'useVscode').mockReturnValue({
        storyData,
        error: null,
        updateStoryFile: mockUpdateStoryFile,
        postMessage: mockPostMessage,
    });

    return render(<App />);
};

describe('ItemForm Submission and Selection', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should select the new item in StoryTable and ItemDetails after saving', async () => {
        renderApp();

        // 1. Wait for the app to load
        await waitFor(() => {
            expect(screen.getByText('Task 1')).toBeInTheDocument();
        });

        // 2. Click "Add New Task" button to show the form
        // Assuming there's a button with this text. Let's find it.
        // We need to know where the "Add" buttons are. Let's assume they are in SidebarContent.
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
            const itemDetailsTitle = screen.getByTestId('item-details-title'); // Assuming ItemDetails has a title with this test-id
            expect(itemDetailsTitle).toHaveTextContent(newTaskTitle);

            // New item is selected in the table
            const tableRow = screen.getByRole('row', { name: new RegExp(newTaskTitle, 'i') });
            expect(tableRow).toHaveClass('table-active');
        });

        // 7. Check if updateStoryFile was called
        expect(mockUpdateStoryFile).toHaveBeenCalledTimes(1);
        const updatedStoryFile = mockUpdateStoryFile.mock.calls[0][0] as StoryFile;
        expect(updatedStoryFile.tasks.some(t => t.title === newTaskTitle)).toBe(true);
    });
});
