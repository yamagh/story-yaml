### Goal

Implement a filtering feature in the VS Code WebView to allow users to filter stories by sprint, status, and keywords.

### Implementation Plan

1.  **Create a Filtering UI Component (`src/web/view/components/FilterPanel.tsx`)**
    *   Create a new React component to be placed above the table in `App.tsx`.
    *   It will include the following filter elements:
        *   **Status Filter:** Checkboxes for `ToDo`, `WIP`, `Done`.
        *   **Sprint Filter:** A dropdown list of sprint names dynamically populated from `storyData`.
        *   **Keyword Search:** A free-text input field for searching titles and descriptions.

2.  **Extend State Management (`src/web/view/hooks/useStoryFilter.ts`)**
    *   Create a new custom hook `useStoryFilter.ts` to encapsulate the filtering logic.
    *   This hook will be responsible for:
        *   Managing the state of the filter conditions (selected statuses, sprint, keyword).
        *   Receiving the original `storyData` and filter conditions, and returning a filtered list of stories.
        *   Optimizing performance by using `useMemo` to re-calculate the filtered list only when `storyData` or filter conditions change.

3.  **Modify Existing Components**
    *   **`App.tsx`:**
        *   Introduce the `useStoryFilter` hook.
        *   Render the `FilterPanel` component and pass callback functions to handle changes in filter conditions.
        *   Pass the filtered story data to the `StoryTable`.
    *   **`useStoryData.ts`:**
        *   This hook will remain focused on data fetching and updates, and will not include filtering logic.
    *   **`StoryTable.tsx`:**
        *   Modify it to accept the filtered data as a prop. No major changes to the display logic itself are required.

### Test Plan

1.  **Unit Tests for `useStoryFilter.ts` (`src/web/hooks/useStoryFilter.test.ts`)**
    *   Using `vitest` and `testing-library/react-hooks`, implement the following test cases:
        *   Verify that filtering by status, sprint, and keyword works correctly.
        *   Verify that combining multiple filter conditions correctly narrows down the results (AND condition).
        *   Verify that all items are returned when the filter conditions are empty.
        *   Verify that keyword search is case-insensitive.

2.  **Component Tests for `FilterPanel.tsx`**
    *   Verify that user interactions (clicking checkboxes, selecting from the dropdown, entering text) correctly notify the parent component of the updated filter conditions.
