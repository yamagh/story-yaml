# コードベース改善計画

## 1. 目的 (Goal)

-   コンポーネントとフックの責務を明確に分割し、コードの可読性、保守性、テスト容易性を向上させる。
-   特に `App.tsx` と `useStoryData.ts` の複雑さを解消し、関心事を分離する。

## 2. 改善方針 (Strategy)

-   **状態管理の分離**: React Context API を導入し、アプリケーション全体で共有される状態（`storyData`, `selectedItem` など）と、それを更新するロジック（`selectItem`, `handleFormSubmit` など）をカプセル化する。
-   **コンポーネントの責務分割**: `App.tsx` をより小さなコンポーネントに分割し、各コンポーネントが単一の責務を持つようにする。

## 3. 実装タスクリスト (Task List)

### Step 1: 状態管理コンテキストの作成

1.  **`src/web/view/contexts/StoryDataContext.tsx` を新規作成:**
    -   `React.createContext` を使用して `StoryDataContext` を定義する。
    -   `useStoryData` フックのロジックの大部分をこのファイルに移動させ、`StoryDataProvider` というコンポーネントを作成する。
    -   `StoryDataProvider` は、`children` を props として受け取り、状態と更新関数を Context の `value` として提供する。
    -   `useStoryData` というカスタムフックもこのファイルでエクスポートし、コンテキストの利用を簡素化する (`useContext(StoryDataContext)` をラップする)。

### Step 2: `App.tsx` のリファクタリング

1.  **`App.tsx` を修正:**
    -   `useStoryData` フックの直接呼び出しを削除する。
    -   コンポーネント全体を `StoryDataProvider` でラップする。
    -   `App.tsx` を、主にレイアウトとコンポーネントの配置に責任を持つコンポーネントに単純化する。
    -   例えば、`MainLayout.tsx`, `Sidebar.tsx` のような子コンポーネントに分割する。

### Step 3: `useStoryData` フックのクリーンアップ

1.  **`src/web/view/hooks/useStoryData.ts` を修正 (または削除):**
    -   状態管理ロジックが `StoryDataContext.tsx` に移動したため、このフックは大幅に簡素化されるか、不要になる。
    -   もし残す場合は、VS Code APIとの通信など、UIから分離された純粋なデータ取得ロジックのみを担当するようにする。

### Step 4: 各コンポーネントの修正

1.  **`ItemDetails.tsx`, `StoryTable.tsx`, `ItemForm.tsx` などを修正:**
    -   Props を通じて状態や関数を受け取る代わりに、新しく作成した `useStoryData` フック (`useContext` のラッパー) を使って、必要なデータや関数を直接コンテキストから取得するように変更する。
    -   これにより、Props のバケツリレーが解消され、コンポーネントの見通しが良くなる。

## 4. 期待される効果 (Expected Outcome)

-   **関心の分離**: UIコンポーネント、ビジネスロジック、状態管理が明確に分離される。
-   **可読性の向上**: 各ファイルが単一の責務を持つようになり、コードが理解しやすくなる。
-   **保守性の向上**: 機能の追加や修正が、関連するファイルに限定されるため、影響範囲の特定が容易になる。
-   **再利用性の向上**: 状態から切り離された純粋なUIコンポーネントは、他の場所で再利用しやすくなる。