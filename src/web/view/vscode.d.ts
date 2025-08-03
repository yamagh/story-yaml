declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare const acquireVsCodeApi: () => {
    getState: () => unknown;
    setState: (newState: unknown) => void;
    postMessage: (message: { command: string; [key: string]: unknown; }) => void;
};

declare global {
    interface Window {
        acquireVsCodeApi: typeof acquireVsCodeApi;
    }
}
