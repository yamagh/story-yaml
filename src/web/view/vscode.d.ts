declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

declare const acquireVsCodeApi: () => {
    getState: () => any;
    setState: (newState: any) => void;
    postMessage: (message: any) => void;
};