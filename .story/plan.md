# 改善計画

## 目的

コードベースの保守性、信頼性、可読性を向上させるため、以下の改善を実施する。

---

### 1. テストカバレッジの向上

**概要:** 主要なロジックとUIコンポーネントにテストを導入し、品質を保証する。

**タスクリスト:**
-   [ ] `vitest` と `testing-library/react` を用いたテスト環境のセットアップを確認・整備する。
-   [ ] `src/web/view/hooks/useStoryData.test.ts` を新規作成し、`useStoryData` フックのユニットテストを実装する。
    -   [ ] `selectItem` を呼び出した際に `selectedItem` と `selectedItemParent` が正しく設定されること。
    -   [ ] フォーム表示 (`showAddItemForm`, `showEditItemForm`) や非表示 (`hideForm`) の際に state が意図通りに更新されること。
    -   [ ] アイテムの追加、更新、削除後に state が正しく反映されること。
-   [ ] `src/web/view/components/ItemDetails.test.tsx` を新規作成し、`ItemDetails` コンポーネントのテストを実装する。
    -   [ ] `selectedItem` が `null` の場合に情報メッセージが表示されること。
    -   [ ] `selectedItemParent` の有無に応じて、親情報カードが表示/非表示されること。
    -   [ ] `selectedItem` が持つ子の有無に応じて、子アイテムリストが表示/非表示されること。
    -   [ ] 各種ボタン（Edit, Delete, Add New...）がクリックされた際に、対応するコールバック関数が呼ばれること。

---

### 2. `ItemDetails.tsx` のリファクタリング

**概要:** 肥大化した `ItemDetails` コンポーネントを、関心事に基づいて小さなコンポーネントに分割する。

**タスクリスト:**
-   [ ] `src/web/view/components/ParentInfoCard.tsx` を作成し、`ItemDetails.tsx` から親情報表示ロジックを移管する。
-   [ ] `src/web/view/components/ChildrenList.tsx` を作成し、`ItemDetails.tsx` から子アイテムリスト表示ロジックを移管する。
-   [ ] `src/web/view/components/ItemProperties.tsx` を作成し、アイテムの基本情報（説明、ステータス、ポイントなど）の表示ロジックを移管する。
-   [ ] `ItemDetails.tsx` は、これらの新しいサブコンポーネントをレイアウトする役割に専念させる。

---

### 3. 型安全性の強化

**概要:** プロパティの存在チェックに依存した型判定を、より安全で宣言的な Type Guard 関数に置き換える。

**タスクリスト:**
-   [ ] `src/web/typeGuards.ts` を新規作成し、`isEpic`, `isStory`, `isTask`, `isSubTask` といった Type Guard 関数を定義する。
-   [ ] `ItemDetails.tsx`, `ChildrenList.tsx`, `useStoryData.ts` など、型判定を行っている箇所を新しい Type Guard 関数を利用するようにリファクタリングする。
