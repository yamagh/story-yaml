/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemDetails } from './ItemDetails';
import { Epic, Story, Task } from '../../types';

const mockEpic: Epic = {
    title: 'Test Epic',
    description: 'Epic Description',
    stories: [
        {
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
            title: 'Test SubTask',
            description: 'SubTask Description',
            status: 'ToDo',
        }
    ],
};

const mockTask: Task = {
    title: 'Test Task',
    description: 'Task Description',
    status: 'ToDo',
    points: 3,
    'definition of done': [],
    'sub tasks': [],
};


describe('ItemDetails', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onAddItem = vi.fn();
    const onSelectParent = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays an info message when no item is selected', () => {
        render(
            <ItemDetails
                selectedItem={null}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        expect(screen.getByText('Click on an item to see details or add a new item.')).toBeInTheDocument();
    });

    it('displays parent info card when a parent exists', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockStory, type: 'Story' }}
                selectedItemParent={mockEpic}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        expect(screen.getByText(/Parent/i)).toBeInTheDocument();
        expect(screen.getByText(mockEpic.title)).toBeInTheDocument();
    });

    it('does not display parent info card when there is no parent', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockEpic, type: 'Epic' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        expect(screen.queryByText(/Parent:/)).not.toBeInTheDocument();
    });

    it('displays children list when the item has children', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockEpic, type: 'Epic' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        expect(screen.getByText('Stories')).toBeInTheDocument();
        expect(screen.getByText(mockEpic.stories[0].title)).toBeInTheDocument();
    });

    it('does not display children list when the item has no children', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockTask, type: 'Task' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        expect(screen.queryByText('Sub-Tasks')).not.toBeInTheDocument();
    });

    it('calls onEdit when the Edit button is clicked', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockStory, type: 'Story' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('opens confirm dialog when Delete button is clicked', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockStory, type: 'Story' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        fireEvent.click(screen.getByText('Delete'));
        expect(screen.getByText('Delete Story')).toBeInTheDocument();
    });

    it('calls onDelete when deletion is confirmed', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockStory, type: 'Story' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getByText('Confirm'));
        expect(onDelete).toHaveBeenCalledWith(mockStory.title);
    });

    it('calls onAddItem when Add New... button is clicked for an Epic', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockEpic, type: 'Epic' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        fireEvent.click(screen.getByText('Add New Story'));
        expect(onAddItem).toHaveBeenCalledWith('stories');
    });

    it('calls onAddItem when Add New... button is clicked for a Story', () => {
        render(
            <ItemDetails
                selectedItem={{ ...mockStory, type: 'Story' }}
                selectedItemParent={null}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddItem={onAddItem}
                onSelectParent={onSelectParent}
            />
        );
        fireEvent.click(screen.getByText('Add New Subtask'));
        expect(onAddItem).toHaveBeenCalledWith('subtasks');
    });
});
