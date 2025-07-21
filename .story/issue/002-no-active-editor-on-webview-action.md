# Issue: WebView上の操作時に `No active editor found` エラーが発生する

## 1. 問題の概要

VS Code拡張機能のWebView（プレビューパネルなど）上に配置したボタンをクリックしてファイル操作（`story.yaml`の更新など）を実行しようとすると、`No active editor found to save the new item.` というエラーメッセージが表示され、処理が失敗する。

この問題は、WebViewパネルにフォーカスが当たっている状態で、`vscode.window.activeTextEditor` を参照する処理を呼び出した場合に発生する。

## 2. 原因

VS Codeにおいて、WebViewパネルは `TextEditor` として扱われない。そのため、ユーザーがWebView上のUI要素を操作すると、VS CodeのフォーカスはWebViewに移り、`vscode.window.activeTextEditor` は `undefined` となる。

ファイル更新ロジックが、更新対象のファイルを特定するために `activeTextEditor` に依存していると、WebViewがアクティブな状態では対象ファイルを見つけられずにエラーとなる。

**問題のコード (修正前):**
```typescript
async function addItemToStoryFile(item: any) {
    // WebViewがアクティブな場合、`editor` は undefined になる
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found...');
        return;
    }
    const document = editor.document;
    // ...以降のファイル更新処理が実行されない
}
```

## 3. 解決策: プレビュー対象のURIを保持する

`activeTextEditor` への依存をなくし、拡張機能自身がどのファイルをプレビュー・編集中であるかを状態として管理するように修正する。

**具体的な手順:**

1.  **URIの保持:** 拡張機能のグローバルなスコープに、プレビュー対象のファイルURIを保持するための変数（例: `previewingDocumentUri: vscode.Uri | undefined`）を宣言する。

2.  **URIの保存:** プレビューパネルを作成または更新するタイミング（`story-yaml.preview`コマンド実行時など）で、対象ドキュメントのURIをこの変数に保存する。

3.  **URIの利用:** ファイルを更新する関数（`addItemToStoryFile`）は、`activeTextEditor` を参照する代わりに、保存しておいた `previewingDocumentUri` を使って対象ファイルを特定する。

4.  **URIのクリア:** プレビューパネルが破棄される際（`onDidDispose`）に、保持しているURIを `undefined` にクリアし、不要な状態が残らないようにする。

**修正後のコード:**
```typescript
let previewingDocumentUri: vscode.Uri | undefined = undefined;

function setupPreviewPanel(context: vscode.ExtensionContext, document: vscode.TextDocument) {
    // プレビュー開始時にURIを保存
    previewingDocumentUri = document.uri;

    // ...

    previewPanel.onDidDispose(() => {
        // パネル破棄時にURIをクリア
        previewingDocumentUri = undefined;
    }, null, context.subscriptions);

    // ...
}

async function addItemToStoryFile(item: any) {
    // activeTextEditorの代わりに保持しているURIを使用
    if (!previewingDocumentUri) {
        vscode.window.showErrorMessage('No file is being previewed.');
        return;
    }
    const storyUri = previewingDocumentUri;
    // ... storyUri を使ってファイルを読み書きする
}
```

## 4. 結論

WebViewを含む拡張機能を開発する際は、`vscode.window.activeTextEditor` が常に利用可能であるとは限らないことを前提に設計する必要がある。

WebViewからのアクションによってファイル操作を行う場合は、どのファイルに対する操作なのかを拡張機能側で明確に管理する仕組み（状態管理）を導入することが、堅牢な実装につながる。
