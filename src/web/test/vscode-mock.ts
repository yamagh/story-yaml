import { vi } from 'vitest';

export const Uri = {
    file: (path: string) => ({ path }),
};
export const Range = vi.fn();
export const WorkspaceEdit = vi.fn(() => ({
    replace: vi.fn(),
}));
export const workspace = {
    applyEdit: vi.fn().mockResolvedValue(true),
};
export const window = {
    showErrorMessage: vi.fn(),
};
