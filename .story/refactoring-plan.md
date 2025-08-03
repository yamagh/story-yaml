# リファクタリング計画

## 1. 目的

コードベースに存在する技術的負債を解消し、保守性、拡張性、およびパフォーマンスを向上させる。

## 2. 課題と解決策

### 課題1: `getNonce()` 関数の重複
- **問題点:** `WebviewPanelManager.ts` と `extension.ts` に同一の `getNonce()` 関数が重複して存在している。
- **解決策:** 共通のユーティリティファイル (`src/web/utils.ts` など) を作成し、`getNonce()` 関数をそこに移動させて一元管理する。

### 課題2: itemType のハードコードされたマッピング
- **問題点:** `StoryEditorService.ts` と `useStoryDataMutations.ts` で、UI層とデータ層の itemType を変換するロジックがそれぞれハードコードされており、一貫性がない。
- **解決策:** 型定義ファイル (`src/web/types.ts`) または専用のマッパーファイルで、双方向の型マッピング（例: `uiToDataMap`, `dataToUiMap`）を定義し、これを利用して変換処理を統一する。

### 課題3: `StoryModel` の冗長な検索処理
- **問題点:** `StoryModel.ts` の `updateItem` および `deleteItem` メソッド内で、`findItemRecursive` が `epics` と `tasks` の両コレクションに対して個別に呼び出されており、非効率。
- **解決策:** `findItemRecursive` を一度だけ呼び出すようにロジックを修正する。例えば、`[...this.storyFile.epics, ...this.storyFile.tasks]` のような単一のコレクションを検索対象とするヘルパーメソッドを作成する。

### 課題4: エラーハンドリングの具体性欠如
- **問題点:** `WebviewPanelManager.ts` のエラーハンドリングが一般的すぎる。
- **解決策:** `try-catch` ブロックで捕捉したエラーオブジェクトをコンソールに出力するなどして、デバッグ情報を充実させる。また、ユーザーに表示するメッセージも、より具体的で分かりやすいものに改善する。

### 課題5: グローバルなCSSによるスタイルの衝突リスク
- **問題点:** `App.css` にグローバルなスタイルが定義されており、意図しないスタイルの上書きが発生する可能性がある。
- **解決策:** CSS Modules や styled-components などの技術を導入し、コンポーネントごとにスタイルをカプセル化する。これにより、スタイルの影響範囲が明確になり、保守性が向上する。

## 3. 実施計画

1. **[Trivial]** `getNonce()` の共通化
2. **[Easy]** `itemType` マッピングの統一
3. **[Easy]** `StoryModel` の検索処理の効率化
4. **[Easy]** エラーハンドリングの改善
5. **[Medium]** CSSのカプセル化 (CSS Modulesの導入)

---
**優先度:**
- Trivial: すぐに着手可能
- Easy: 比較的容易
- Medium: 多少の調査・設計が必要
- Hard: 複雑で時間がかかる可能性
