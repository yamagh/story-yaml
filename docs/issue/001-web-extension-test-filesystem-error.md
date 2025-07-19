# Issue: VS Code Web拡張機能のテストでファイルシステムエラーが発生する問題

## 1. 問題の概要

VS Code Web拡張機能のテスト実行時、`vscode.workspace.fs` を使用してファイル操作（書き込み・読み取り）を行おうとすると、以下のような `FileSystemError` が発生し、テストが失敗する。

```
Error (FileSystemError): Unable to write file '/story.yaml' (Unavailable (FileSystemError): Error: No file system handle registered (/story.yaml))
```

この問題は、`vscode-test-web` を使用してブラウザベースのテスト環境をセットアップした際に顕著に現れる。

## 2. 問題の背景と原因

`vscode-test-web` で構築されるテスト環境は、サンドボックス化されたブラウザ内で実行される。この環境の仮想ファイルシステムは、デフォルトではメモリ上（in-memory）で動作するか、アクセスが制限されている。

そのため、テストコードから `vscode.workspace.fs.writeFile` のようなAPIを呼び出しても、永続的なファイルシステムハンドルが登録されておらず、書き込みが許可されないためにエラーが発生する。

### 試行錯誤の過程

- **Node.js `fs`モジュールの直接利用:** Webpackのビルドエラーで失敗。ブラウザ環境ではNode.jsコアモジュールは利用できない。
- **`--folder-uri=.` オプションの追加:** ワークスペースは開かれるが、ファイルシステムが揮発性である問題は解決しない。
- **待機時間（`setTimeout`）の挿入:** ファイルシステムの初期化遅延が原因である可能性を考慮したが、効果はなかった。根本的な権限の問題であるため、時間をおいても解決しない。

## 3. 解決策: ロジックの分離とユニットテストへの切り替え

ファイルI/Oを伴うテスト（インテグレーションテスト）をWeb拡張機能のテスト環境で安定して実行するのは非常に困難であると判断し、以下のようにアプローチを変更した。

**1. ロジックの純粋化:**
ファイル操作や `vscode` APIに依存するロジックを、純粋な関数として切り出す。この関数は、入力として文字列やオブジェクトを受け取り、処理結果の文字列やオブジェクトを返すように設計する。

**変更前 (`extension.ts`):**
```typescript
// ファイルI/Oとロジックが密結合している
async function addItemToStoryFile(item: any) {
    // ... vscode.workspace.fs.readFile ...
    const doc = yaml.load(content);
    doc.epics.push(item.data);
    const newContent = yaml.dump(doc);
    // ... vscode.workspace.fs.writeFile ...
}
```

**変更後 (`extension.ts`):**
```typescript
// テスト可能なようにロジックを分離・エクスポート
export function updateStoryContent(content: string, item: any): string {
    const doc = yaml.load(content) || { epics: [], tasks: [] };
    doc.epics.push(item.data);
    return yaml.dump(doc);
}

// VS Code APIに依存する部分
async function addItemToStoryFile(item: any) {
    // ...
    const currentContent = decoder.decode(rawContent);
    const newContent = updateStoryContent(currentContent, item); // 純粋関数を呼び出す
    // ...
}
```

**2. ユニットテストへの切り替え:**
テストの対象を、ファイルI/Oを行うコマンド全体ではなく、分離した純粋な関数（`updateStoryContent`）に絞る。これにより、テストは `vscode` APIやファイルシステム環境から完全に独立し、安定して実行できる。

**テストコード (`extension.test.ts`):**
```typescript
import * as assert from 'assert';
import { updateStoryContent } from '../../extension';

suite('Extension Logic Test Suite', () => {
    test('updateStoryContent should add a new epic', () => {
        const initialContent = 'epics: []';
        const newItem = { itemType: 'epics', data: { title: 'New Epic' } };

        const updatedYaml = updateStoryContent(initialContent, newItem);
        // ... assert on updatedYaml ...
    });
});
```

## 4.結論

VS Code Web拡張機能のテストでは、環境依存性の高いファイルI/Oなどを伴うインテグレーションテストの自動化は避け、TDDのサイクルを回すことを優先する。

- **コアロジック:** `vscode` APIから分離した純粋な関数として実装し、ユニットテストで品質を担保する。
- **API連携部分:** ユニットテストが通った後、実際に拡張機能をデバッグ実行して手動で動作確認を行う。

このアプローチにより、開発効率を損なうことなく、堅牢なロジックを構築することが可能になる。
