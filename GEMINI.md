environment:
  devbox: true
  instructions: >
    開発に必要なパッケージ（例: npm モジュールなど）は Devbox を用いてインストールすること。
  examples:
      - devbox init
      - devbox add nodejs
      - devbox run npm install
      - devbox run npm run build
purpose:
  - ストーリー駆動開発（Story-Driven Development）の実践
  - AIによる仕様構想から実装支援

context:
  coding_standards:
    - language: TypeScript
    - style: Airbnb
    - policy: "WebViewのUIは、保守性向上のため、`extension.ts`内にHTML文字列として記述するのではなく、独立したReactコンポーネント（.tsx）として実装すること。"
    - security: "ユーザー入力や外部から取得したデータをHTMLに埋め込む際は、必ずエスケープ処理（サニタイズ）を行い、XSS（クロスサイトスクリプティング）脆弱性を防止すること。"
  tech_stack:
    - frontend: React
    - backend: Node.js (Express)
    - database: sqlite
    - css: bootstrap

directory_structure:
  - (This File)
  - .story/:
      - story.yaml: ユーザーストーリーと構想
      - plan.yaml: 実装計画と設計
  - src/: 自動生成コード
  - src/test/: 自動生成テスト

commands:
  - command: '%help [command]'
    description: |
      指定されたコマンドの解説を行うメタコマンド。
      例: `%help idea` と実行することで `%idea` コマンドの説明が得られる。

  - command: '%story-idea'
    name: ブレインストーミング
    description: 新しいユーザーストーリーについてブレインストーミングを行い、構想を出力する。
    responsibility: |
      - 具体的なストーリー例を提示する
      - ベストプラクティスや過去事例など幅広い知識から根拠を示してストーリーを提示する
      - 新しいコンセプトを追加したストーリーを提示する
      - すでにあるコンセプトを拡張したストーリーを提示する
    inputs: []
    outputs:
      - .story/story-idea.yaml
  
  - command: '%story-approve'
    name: 新しいユーザーストーリー追加
    description: ブレインストーミングの結果を、story.yamlへ構造的に反映する。
    responsibility: |
      - 構想からストーリー形式への変換
      - YAML構造とキーワード整合性の検証
    inputs:
      - .story/story-idea.yaml
    outputs:
      - .story/story.yaml

  - command: '%story-invest'
    name: ストーリーの品質評価 (INVEST原則)
    description: |
      より質の高い、実装しやすいストーリーを作成できるように各ストーリーがINVEST原則（独立しているか、交渉可能か、価値があるか、見積もり可能か、小さいか、テスト可能か）を満たしているか評価する
    responsibility:
      - story.yaml の各ストーリーをINVEST原則に基づいて評価する
      - 評価結果は、具体的で分かりやすいフィードバックとしてユーザーに提示する
    inputs:
      - .story/story.yaml
    outputs:
      - .story/story-invest.md

  - command: '%story-dod'
    name: 完了条件(DoD)の具体化支援
    description: |
      `definition of done` が曖昧な箇所を指摘し、より具体的でテスト可能な記述の提案をする
    responsibility:
      - story.yaml の `definition of done` を分析し、曖昧な表現や不十分な点を特定する
      - より具体的で検証可能な完了条件の代替案を提案する
      - 元のストーリーの意図を汲んだ提案をする
    inputs:
      - .story/story.yaml
    outputs:
      - .story/story-dod.md

  - command: '%story-dependency'
    name: ストーリー間の依存関係の可視化
    description: |
      ストーリー間の隠れた依存関係や実行順序の矛盾を指摘する
    responsibility:
      - story.yaml 内の各アイテム（Epic, Story, Task）間の依存関係を解析する
      - 解析結果に基づき、依存関係のリストや、矛盾点（例：循環参照）をレポートとして出力する
      - ユーザーは実装順序の決定や計画の見直しを行えるレポートを出力する
    inputs:
      - .story/story.yaml
    outputs:
      - .story/story-dependency.md

  - command: '%dev-plan'
    name: 実装計画
    description: ストーリーとコードベースを元に実行可能なタスクリストを作成する
    responsibility: |
      - ゴール/要件から逆算して必要なタスクの洗い出しと優先度付け
      - 現状の課題やリソースを把握し、実装したい範囲（スコープ）を明確に設定
      - いきなり全体計画を漠然と立てるのではなく、まずスモールスタート（小さなゴールの設定）を行い、進捗状況や効果を見ながら段階的にスコープや難易度を拡張する計画立案
      - 実装計画の精度を上げるために、過去の事例や既存のリソース・データベースを検索・分析し、「どういう実装が最適か」を確認
      - ステップバイステップで実行可能な実装のためのタスクリストを含める
    inputs:
      - .story/story.yaml
    outputs:
      - .story/dev-plan.md

  - command: '%test-plan'
    name: テスト戦略の定義
    description: 実装計画を元にテストのためタスクリストを作成する
    responsibility: |
      - ユニットテスト、インテグレーションテスト、手動テストで何を確認するか境界線を明確にする。
      - ファイルシステム、ネットワーク、VS Code APIなど、外部環境への依存度が高い機能については、モック化のコストと効果を考慮し、テストアプローチを決定する。
      - ステップバイステップで実行可能なテストのためのタスクリストを含める
    inputs:
      - .story/dev-plan.md'
    outputs:
      - .story/test-plan.md

  - command: '%dev'
    name: 実装
    description: |
      TDDで開発する
    responsibility: |
      - 実装に先立ってテストコードを生成する。TDDの原則に基づき、失敗するテストを先に設計することで、仕様を明確化する。
      - 生成されたテストコードに基づいて最小限の実装を行い、テストを実行する。失敗した場合は原因を特定し修正を繰り返す。
    inputs:
      - .story/dev-plan.md
      - .story/test-plan.md
    outputs:
      - src/*

  - command: '%improve-plan'
    name: 改善計画
    description: |
      コードベース改善のための次の観点で多角的なレビューと計画を行う
      - 技術的負債の解消
      - リファクタリング
      - 責務分割
      - パフォーマンスの強化
      - テストの拡充
      - ドキュメントの整備
      - ベストプラクティスの適用
    inputs: []
    outputs:
      - .story/improve-plan.md

  - command: '%improve-run'
    name: 改善計画実行
    description: 改善計画の記載内容に従って実行する
    inputs:
      - .story/improve-plan.md
    outputs: []

  - command: '%fix-plan'
    name: 不具合修正方法検討
    description: |
      不具合が発見されたとき、コードベースやログを調査して原因を推定し、修正案を出力する。
    responsibility: |
      ステップバイステップで実行可能な実装のためのタスクリストを含める
    inputs: []
    outputs:
      - .story/fix-plan.md

  - command: '%fix-run'
    name: 不具合修正
    description: |
      不具合修正案の記載内容に従って実行する
    inputs:
      - .story/fix-plan.md
    outputs:
      - src/*

  - command: '%issue'
    name: 課題追加
    description: |
      直前のタスクで直面したトラブルやその解決方法、試行錯誤の過程を記録し、GitHub Issuesの一般的な使い方に準じた形式で .story/issue/ に保存する。
    responsibility:
      - 問題の背景、発生条件、現象を明確に記録する
      - 原因の特定および修正内容を記載する
      - 次回以降の参考になるよう時系列や試行錯誤も含める
      - GitHub Issues の記法（タイトル、説明、再現手順、期待結果など）に準じて記述する
    inputs: []
    outputs:
      - .story/issue/

glossary:
  - term: ストーリー駆動開発（Story-Driven Development）
    definition: >
      ストーリー駆動開発は、ユーザーストーリーをYAML形式で構造化したDSL（ドメイン固有言語）に基づく開発手法である。
      ユーザーはツールやテキストエディタを用いて story.yaml を作成する。
      ユーザーとAIエージェントは、story.yaml を通じて共通理解できる構造化フォーマットに基づき、
      ストーリーブレインストーミング、詳細化、完了基準の策定を行う。
      エージェントは story.yaml を元に plan.yaml を出力し、さらに plan.yaml を元に実装とテストを行う。
      この一連のプロセス全体をストーリー駆動開発と呼ぶ。
    structure: |
      ```story.yaml
      epics:
        - title: タイトル
          description: 説明
          stories:
            - title: タイトル
              as: 役割
              i want: やりたいこと
              so that: 理由
              description: 説明
              status: ToDo # ToDo, WIP, Done のいずれか
              points: 1 # 任意の整数
              sprint: Sprint 1 # スプリント名
              definition of done:
                - 完了基準
              sub tasks:
                - title: タイトル
                  description: 説明
                  status: ToDo
      tasks:
        - title: タイトル
          description: 説明
          status: ToDo # ToDo, WIP, Done のいずれか
          Sprint 1 # スプリント名
          points: 1 # 任意の整数
          definition of done:
            - 完了基準
          sub tasks:
            - title: タイトル
              description: 説明
              status: ToDo
      ```
