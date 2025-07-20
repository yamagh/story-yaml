# ドラッグ＆ドロップによる並べ替え機能 実装計画

## 1. ドラッグ＆ドロップ（D&D）ライブラリの選定

`package.json` を確認したところ、D&D関連のライブラリはまだ導入されていません。
React向けのモダンなD&Dライブラリとして、アクセシビリティやパフォーマンスに優れ、カスタマイズ性も高い **`dnd-kit`** を導入します。

## 2. 実装計画

### Step 1: `dnd-kit` のインストール

まず、開発環境に `dnd-kit` を追加します。

```bash
devbox add @dnd-kit/core @dnd-kit/sortable
```

### Step 2: `StoryTable.tsx` の改修

`StoryTable.tsx` を `dnd-kit` を使ってD&Dに対応させます。

1.  **コンポーネントの責務分割:**
    *   現在の `StoryTable.tsx` は描画ロジックが密結合しているため、`EpicRow`, `StoryRow`, `TaskRow`, `SubTaskRow` のように、各アイテム種別ごとのコンポー-ネントに分割し、見通しを良くします。
    *   各行コンポーネントにドラッグハンドル（`⋮`のようなアイコン）を追加します。

2.  **`dnd-kit` のコンテキスト設定:**
    *   `DndContext` でテーブル全体をラップし、D&Dの振る舞い（衝突検出アルゴリズムなど）を設定します。
    *   `SortableContext` を使い、並べ替え可能なアイテムのリストを `dnd-kit` に伝えます。

3.  **並べ替えロジックの実装:**
    *   `useSortable` フックを各行コンポーネントに適用し、ドラッグ＆ドロップ可能にします。
    *   `onDragEnd` イベントハンドラで並べ替え完了を検知します。このハンドラ内で、アイテムの移動ロジックを実装し、状態を更新します。
    *   移動元（`active`）と移動先（`over`）のIDを取得し、新しい配列順序を計算します。

4.  **視覚的フィードバックの実装:**
    *   ドラッグ中は `useSortable` が提供する `isDragging` 状態を利用して、アイテムの見た目を変更します（例：半透明にする）。
    *   `dnd-kit` はデフォルトでアイテムの移動をスムーズなアニメーションで表現します。
    *   要件にある「挿入先のガイドライン」は、`onDragOver` イベントとCSSを組み合わせて実装します。

### Step 3: 状態管理とデータ更新 (`useStoryData.ts` の拡張)

1.  **並べ替え用ハンドラの追加:**
    *   `useStoryData.ts` に `handleDragEnd` のような関数を追加します。この関数は `dnd-kit` の `onDragEnd` イベントから呼び出されます。
    *   `handleDragEnd` 内で、並べ替え後の新しい `StoryFile` オブジェクトを構築します。
        *   同一階層内の移動（例: Epic間の並べ替え）
        *   異なる階層への移動（例: Storyを別のEpicへ移動）
    *   不正な移動（例: TaskをEpicの直下に移動）を検知し、操作をキャンセルするロジックを実装します。

2.  **バックエンドへの通知:**
    *   並べ替えが完了し、状態が更新されたら、WebViewからVS Code拡張機能へ新しい `StoryFile` オブジェクトを送信する新しいメッセージ（例: `updateStoryFile`）を定義します。
    *   `useVscode.ts` に `updateStoryFile(storyFile: StoryFile)` のような関数を追加し、`vscode.postMessage` を呼び出します。

### Step 4: バックエンドでのYAMLファイル更新

1.  **メッセージハンドラの追加 (`WebviewPanelManager.ts`):**
    *   `WebviewPanelManager` の `onDidReceiveMessage` に `updateStoryFile` コマンドを処理する case を追加します。
    *   受け取った `StoryFile` オブジェクトを `js-yaml` を使ってYAML文字列に変換します。

2.  **ファイル書き込み処理の汎用化 (`StoryYamlService.ts`):**
    *   `StoryYamlService` に、`StoryFile` オブジェクト全体を受け取ってYAMLを生成し、ファイルの内容を完全に上書きする新しいメソッド `saveStoryFile(storyFile: StoryFile): string` を作成します。
    *   `WebviewPanelManager` はこの新しいサービスメソッドを呼び出し、`vscode.workspace.applyEdit` で `story.yaml` を更新します。

## 3. テスト戦略

*   **UIコンポーネント (`vitest` + `testing-library/react`):**
    *   `dnd-kit` のテストは複雑なため、インタラクションのテストは手動に頼ります。
    *   並べ替えロジックを担う `handleDragEnd` 関数（`useStoryData.ts`内）の単体テストを作成し、様々な移動パターン（同一階層、階層変更、不正操作）で状態が正しく更新されることを検証します。
*   **バックエンド (`mocha`):**
    *   `StoryYamlService.ts` の `saveStoryFile` メソッドの単体テストを作成します。並べ替え後の `StoryFile` オブジェクトが、期待通りの構造と順序でYAML文字列に変換されることを確認します。
