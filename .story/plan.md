### **改善計画 (`plan.md`)**

#### 1. 技術的負債の解消 (Resolving Technical Debt)

*   **`StoryYamlService` のID生成ロジックの改善:**
    *   **課題:** 現在のID生成は静的変数 `nextId` に依存しており、`loadYaml` が呼ばれるたびにリセットされるため、不安定です。
    *   **提案:** より堅牢なID生成戦略を導入します。例えば、アイテムのパスや内容に基づいたハッシュを生成する方法や、IDカウンターの管理を改善する方法が考えられます。

#### 2. リファクタリング (Refactoring)

*   **`WebviewPanelManager` の責務分割:**
    *   **課題:** `WebviewPanelManager` がパネル作成、メッセージハンドリング、ファイル編集ロジックなど、多くの責務を担っています。
    *   **提案:** ファイル編集ロジックを別のクラス（例: `StoryFileManager`）に抽出し、`WebviewPanelManager` はUIと拡張機能間の通信に専念するようにします。
*   **`WebviewPanelManager` 内の重複コードの削減:**
    *   **課題:** `addItemToStoryFile`, `updateItemInStoryFile`, `deleteItemFromStoryFile` メソッドは、ファイルの読み書きとエラーハンドリングにおいてコードが重複しています。
    *   **提案:** これらのメソッドを、コールバック関数を受け取る単一の汎用メソッド（例: `_withErrorHandling` or `_applyWorkspaceEdit`）に統合します。
*   **`StoryYamlService` の可読性向上:**
    *   **課題:** YAMLコンテンツを操作するメソッド（`updateStoryContent`, `addSubTask`など）が複雑で、可読性が低いです。
    *   **提案:** ヘルパー関数を導入してロジックを分割し、可読性を向上させます。また、データ操作にイミュータブルなアプローチを検討し、予期せぬ副作用を防ぎます。

#### 3. ベストプラクティスの適用 (Applying Best Practices)

*   **[完了] ESLintルールの強化:**
    *   **課題:** 現在のESLintルールは基本的なものに留まっています。`GEMINI.md` に記載のある "Airbnb" スタイルガイドが適用されていません。
    *   **提案:** `eslint-config-airbnb-typescript` を導入し、React (`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) やTypeScript (`@typescript-eslint/recommended`) のための推奨ルールセットを適用します。これにより、コード品質と一貫性が向上します。

#### 4. テストの拡充 (Expanding Tests)

*   **`StoryYamlService` の単体テスト強化:**
    *   **課題:** `StoryYamlService.ts` にはテストファイル `StoryYamlService.test.ts` が存在しますが、複雑なロジック（特にアイテムの追加、更新、削除）に対するカバレッジが不足している可能性があります。
    *   **提案:** アイテムの追加、更新、削除、ネストしたアイテムの操作、不正なYAML入力など、エッジケースを含む単体テストを追加します。