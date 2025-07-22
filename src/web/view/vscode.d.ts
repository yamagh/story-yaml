import { WebviewMessage } from "./types.js";

// src/web/view/vscode.d.ts

interface VsCodeApi {
    postMessage(message: WebviewMessage): void;
    getState(): unknown;
    setState(newState: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;
