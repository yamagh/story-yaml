import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock the global acquireVsCodeApi function
(globalThis as typeof globalThis & { acquireVsCodeApi: unknown }).acquireVsCodeApi = vi.fn(() => ({
    postMessage: vi.fn(),
    getState: vi.fn(),
    setState: vi.fn(),
}));

// Clean up the DOM after each test
afterEach(() => {
  cleanup();
});
