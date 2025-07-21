# テーブルヘッダーからのフィルタリング機能 実装計画

## 1. 目的 (Goal)

-   現在の `FilterPanel` コンポーネントを廃止し、テーブルのヘッダーから直接フィルタリング（Status, Sprint, Keyword）を行えるようにUIを改善する。
-   UIをより直感的でモダンなものにし、コンポーネント構成をシンプルにする。

## 2. 影響範囲 (Affected Files)

-   `src/web/view/App.tsx`: `FilterPanel` の削除と、キーワード検索UIの追加。
-   `src/web/view/components/StoryTable.tsx`: ヘッダー (`<thead>`) をインタラクティブにする。
-   `src/web/view/components/FilterPanel.tsx`: **削除**
-   `src/web/view/hooks/useStoryFilter.ts`: 変更なし。ロジックはそのまま再利用する。
-   **新規作成**: `src/web/view/components/TableHeaderFilter.tsx` - ヘッダーにドロップダウンフィルターを追加するための再利用可能なコンポーネント。

## 3. 実装タスクリスト (Task List)

### Step 1: `FilterPanel` のクリーンアップ

1.  **`src/web/view/components/FilterPanel.tsx` を削除する。**
2.  **`src/web/view/App.tsx` を修正:**
    -   `FilterPanel` の import 文を削除する。
    -   JSX 内の `<FilterPanel ... />` コンポーネントを削除する。

### Step 2: キーワード検索UIの再配置

1.  **`src/web/view/App.tsx` を修正:**
    -   テーブルの上部（`<DndContext>` の直前など）にキーワード検索用の入力フィールドを配置する。
    -   Bootstrap の `input-group` を利用して、見た目を整える。
    -   この入力フィールドは `useStoryFilter` フックから得られる `filterKeyword` と `setFilterKeyword` に接続する。

    ```tsx
    // App.tsx に追加するキーワード検索UIの例
    <div className="input-group mb-3">
      <span className="input-group-text">Keyword</span>
      <input
        type="text"
        className="form-control"
        value={filterKeyword}
        onChange={e => setFilterKeyword(e.target.value)}
        placeholder="Search by keyword..."
      />
    </div>
    ```

### Step 3: `TableHeaderFilter` コンポーネントの作成

1.  **`src/web/view/components/TableHeaderFilter.tsx` を新規作成する。**
    -   このコンポーネントは、テーブルヘッダー (`<th>`) をラップし、フィルタリング機能を提供する。
    -   Bootstrap の Dropdown コンポーネント (`dropdown`, `dropdown-toggle`, `dropdown-menu`) を使用する。
    -   Props として、フィルターのタイトル、現在の選択値、選択肢のリスト、および変更を通知するコールバック関数を受け取る。

    **`TableHeaderFilter.tsx` のインターフェース案:**
    ```typescript
    interface TableHeaderFilterProps<T> {
      title: string;
      options: T[];
      selectedOptions: T[];
      onChange: (selected: T[]) => void;
      singleSelection?: boolean; // Sprintのように単一選択の場合
    }
    ```

### Step 4: `StoryTable` へのフィルター統合

1.  **`src/web/view/components/StoryTable.tsx` を修正:**
    -   `<thead>` 内の `<th>` 要素を、新しく作成した `TableHeaderFilter` コンポーネントで置き換える。
    -   `Status` と `Sprint` の列に適用する。
    -   `App.tsx` から渡されたフィルターの状態 (`filterStatus`, `filterSprint`) とセッター関数 (`setFilterStatus`, `setFilterSprint`) を `TableHeaderFilter` に渡す。

    **`StoryTable.tsx` の `<thead>` 修正案:**
    ```tsx
    // StoryTable.tsx
    <thead>
      <tr>
        <th style={{ width: '30px' }}></th>
        <th>Type</th>
        <th>Title</th>
        <TableHeaderFilter
          title="Status"
          options={['ToDo', 'WIP', 'Done']}
          selectedOptions={props.statusFilter}
          onChange={props.onStatusChange}
        />
        <th>Points</th>
        <TableHeaderFilter
          title="Sprint"
          options={props.sprints}
          selectedOptions={props.sprintFilter ? [props.sprintFilter] : []}
          onChange={(selected) => props.onSprintChange(selected[0] || '')} // Sprintは単一選択
          singleSelection={true}
        />
      </tr>
    </thead>
    ```
    *注: 上記はコンセプトです。実際の props の受け渡し方法は `App.tsx` の構成に合わせて調整します。*

### Step 5: `App.tsx` でのデータフローの最終調整

1.  **`src/web/view/App.tsx` を修正:**
    -   `useStoryFilter` から得られるフィルター関連の props (`filterStatus`, `setFilterStatus` など) を `StoryTable` コンポーネントに渡すようにする。
    -   `sprints` のリストも `StoryTable` に渡す。

## 4. テスト計画 (Test Plan)

-   **手動テスト:**
    -   キーワード検索が正しく機能することを確認する。
    -   Status ヘッダーをクリックすると、ドロップダウンが表示され、ステータス（ToDo, WIP, Done）でフィルタリングできることを確認する。
    -   Sprint ヘッダーをクリックすると、ドロップダウンが表示され、スプリントでフィルタリングできることを確認する。
    -   複数のフィルター（キーワード、Status, Sprint）を組み合わせても正しく動作することを確認する。
-   **自動テスト (任意):**
    -   `TableHeaderFilter.test.tsx` を作成し、ドロップダウンの表示と `onChange` コールバックが正しく呼び出されることをテストする。
