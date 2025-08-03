# リファクタリング計画

このドキュメントは、コードベースの技術的負債を解消し、保守性と拡張性を向上させるためのリファクタリング計画を記述する。

## 課題

現在のコードベースには、以下の技術的負債が存在する。

1.  **責務過多なクラス (`WebviewPanelManager`)**:
    -   VS CodeのWebviewパネルのライフサイクル管理、UIとのメッセージング、ファイルI/O（ドキュメントの読み書き）、YAMLのパース/シリアライズの呼び出し、データモデルの操作といった多様な責務を単一のクラスが担っている。
    -   これにより、クラスの見通しが悪くなり、変更が困難になっている。

2.  **コードの重複**:
    -   `WebviewPanelManager`内には、ドキュメントを読み込み、変更を適用し、保存するという一連の処理が `addItemToStoryFile`, `updateItemInStoryFile`, `deleteItemFromStoryFile`, `updateStoryFile` の各メソッドで繰り返し記述されている。

3.  **汎用的なエラーハンドリング**:
    -   ファイル操作やYAMLのパースで発生したエラーが、汎用的な `Error` として捕捉され、ユーザーに具体的な原因が伝わりにくい。

4.  **関心の分離の欠如**:
    -   VS CodeのAPI (`vscode.TextDocument`, `vscode.WorkspaceEdit`) の操作が、UIロジックと密結合している。

## リファクタリング方針

上記の課題を解決するため、以下のリファクタリングを実施する。

### 1. 責務の再分割と新サービスの導入

`WebviewPanelManager` が持つ責務を分割し、関心事ごとに独立したクラスに担当させる。

#### a. `WorkspaceService` の新設

-   **責務**: VS Codeのワークスペース関連の操作（ファイルの読み書き）を専門に担当する。
-   **具体的な実装**:
    -   `WebviewPanelManager` からファイルI/Oロジックを移譲する。
    -   `readDocument(document: vscode.TextDocument): string` のようなメソッドを実装する。
    -   `applyEdit(document: vscode.TextDocument, newContent: string): Promise<void>` のようなメソッドを実装し、`vscode.WorkspaceEdit` の詳細をカプセル化する。

#### b. `StoryEditorService` の新設

-   **責務**: データ（`StoryModel`）の変更と、それに伴うファイル更新のオーケストレーションを担当する。
-   **具体的な実装**:
    -   `WebviewPanelManager` から `addItem`, `updateItem`, `deleteItem` などのビジネスロジックを移譲する。
    -   `StoryYamlService` を使ってYAMLとの変換を行い、`WorkspaceService` を使ってファイルに書き込む。
    -   例: `addItem(document: vscode.TextDocument, item: AddItemValues): Promise<StoryFile>`
        -   内部で `WorkspaceService.readDocument` を呼び出す。
        -   `StoryYamlService.load` で `StoryModel` を生成する。
        -   `StoryModel.addItem` を実行する。
        -   `StoryYamlService.save` でYAML文字列を生成する。
        -   `WorkspaceService.applyEdit` でドキュメントを更新する。

### 2. `WebviewPanelManager` の責務を限定

-   リファクタリング後の `WebviewPanelManager` は、以下の責務のみを担当する。
    -   Webviewパネルの生成、表示、破棄。
    -   Webviewとのメッセージング（`postMessage`, `onDidReceiveMessage`）。
    -   `StoryEditorService` や `WorkspaceService` を呼び出し、UIからの要求を委譲する。

### 3. エラーハンドリングの強化

-   `YamlParseError`, `FileUpdateError` のようなカスタムエラー型を定義する。
-   各サービスは、自身の責務範囲で発生したエラーを具体的なカスタムエラーとしてスローする。
-   `WebviewPanelManager` は、受け取ったカスタムエラーの種類に応じて、ユーザーに分かりやすいエラーメッセージを表示する。

### 4. 処理フローの改善

-   重複している「読み込み → 変更 → 保存」のサイクルを `StoryEditorService` 内にカプセル化し、コードの重複を排除する。
-   `WebviewPanelManager` からの呼び出しをシンプルにする。

## 期待される効果

-   **保守性の向上**: 各クラスの責務が明確になり、コードの理解と変更が容易になる。
-   **テスト容易性の向上**: `WorkspaceService` や `StoryEditorService` を個別にテストできるようになり、UIコンポーネントからビジネスロジックを分離できる。
-   **拡張性の向上**: 新しい機能を追加する際に、変更すべきクラスが明確になる。
-   **堅牢性の向上**: 具体的なエラーハンドリングにより、予期せぬ問題が発生しにくくなる。
