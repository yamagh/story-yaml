# Improvement Plan

## Goal

Refactor the webview panel creation to remove the inline HTML string and load it from a separate file. This will improve maintainability and align better with the project's coding standards.

## Tasks

1.  **Create `index.html` file:**
    -   Create a new file at `src/web/view/index.html`.
    -   Move the HTML content from `_getHtmlForWebview` in `WebviewPanelManager.ts` to this new file.
    -   Use placeholders for the script URI and nonce (e.g., `{{scriptUri}}` and `{{nonce}}`).

2.  **Update `WebviewPanelManager.ts`:**
    -   Modify the `_getHtmlForWebview` method to read the content of `src/web/view/index.html`.
    -   Replace the placeholders with the actual `scriptUri` and `nonce` values.

3.  **Update `webpack.config.js`:**
    -   Add a rule to copy `src/web/view/index.html` to the `dist/web` directory during the build process. This is necessary so that the file is available at runtime.
