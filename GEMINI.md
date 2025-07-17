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
  tech_stack:
    - frontend: React
    - backend: Node.js (Express)
    - database: sqlite

directory_structure:
  - (This File)
  - .story/:
      - story.yaml: ユーザーストーリーと構想
      - plan.yaml: 実装計画と設計
  - src/: 自動生成コード
  - src/test/: 自動生成テスト

development_flow:
  policy: >
    トラブルが発生した場合は、まず docs/issue/ に記録された過去のナレッジを参照すること。
    類似の解決例が存在しないかを確認してから調査・修正に着手する。
  steps:
    - step: 1
      name: ユーザーストーリー
      substeps:
        - step: 1.1
          name: ブレインストーミング
          purpose: 自然言語または既存のstory.yamlをもとにブレインストーミングを行い、構想をidea.yamlに出力する。
          ai_support:
            - ユーザー視点での追加機能や新しいニーズの提案
            - エンジニア視点での技術的改善点やリファクタリングの候補
          depends_on: []
          outputs:
            - .story/idea.yaml
          command: %idea

        - step: 1.2
          name: ユーザーストーリー
          purpose: ブレインストーミングの結果を、story.yamlへ構造的に反映する。
          ai_support:
            - 構想からストーリー形式への変換
            - YAML構造とキーワード整合性の検証
          depends_on:
            - .story/idea.yaml
          outputs:
            - .story/story.yaml
          command: %synthesize
          structure: |
            ```story.yaml
            epics:
              - title: エピックの簡潔なタイトル
                description: |
                  エピックについての詳細な説明
                stories:
                  - title: ストーリーの簡潔なタイトル
                    as: 役割
                    i want: やりたいこと
                    so that: 理由
                    status: ToDo # ToDo, WIP, Done のいずれか
                    points: 1 # 任意の整数
                    acceptance criteria:
                      - 受け入れ基準１
                      - 受け入れ基準２
                      - 受け入れ基準３
                    sub tasks:
                      - サブタスク１
                      - サブタスク２
                      - サブタスク３
            tasks:
              - title: タスクの簡潔なタイトル
                description: |
                  タスクについての詳細な説明
                status: ToDo # ToDo, WIP, Done のいずれか
                acceptance criteria:
                  - 完了基準１
                  - 完了基準２
                  - 完了基準３
            ```
    - step: 2
      name: 実装計画（技術設計）
      substeps:
        - step: 2.1
          name: 計画
          purpose: ストーリーをもとに実装計画を立てる
          depends_on:
            - .story/story.md
          outputs:
            - .story/plan.md
          command: %plan
          ai_support:
            - コンポーネント設計（UI/API/DB/モデル）
            - 技術スタックの整合性確認

        - step: 2.2
          name: 作業計画
          purpose: 計画をもとにステップバイステップのタスクの洗い出しと優先度付けを行い、tasks.yaml にまとめる。
          depends_on:
            - .story/plan.md
          outputs:
            - .story/tasks.yaml
          command: %task
          ai_support:
            - 計画を元にタスクを実装可能な粒度のタスクに分解
            - タスクの依存関係や順序整理

    - step: 3
      name: 実装とテストの統合管理
      command: %dev
      substeps:
        - step: 3.1
          name: テストコードの作成
          purpose: 実装に先立ってテストコードを生成する。TDDの原則に基づき、失敗するテストを先に設計することで、仕様を明確化する。
          responsibility:
            - 単体/結合テストケースを自動生成する
            - テストを満たす最小限のコードを生成する
            - コードに必要なドキュメントとコメントを出力する
            - 画面やUIに関するテストコードは不要。人間に依頼する。
          depends_on:
            - .story/tasks.yaml
          outputs:
            - src/
            - src/test/
          command: %implement

        - step: 3.2
          name: 実装とテスト
          purpose: 生成されたテストコードに基づいて最小限の実装を行い、テストを実行する。失敗した場合は原因を特定し修正を繰り返す。
          depends_on:
            - src/
            - src/test/
          outputs:
            - test-report.log
          command: %test
          responsibility:
            - テストを自動実行しログを収集する
            - エラーの要因を分析し修正案を提示する

    - step: 4
      name: 改善
      command: %improve
      substeps:
        - step: 4.1
          name: リファクタリング
          purpose: テストが通った実装に対して、保守性・可読性・再利用性を高めるためのコード改善を行う。
          depends_on:
            - src/
            - src/test/
          outputs:
            - src/
          command: %refactor
          responsibility:
            - コードをクリーンアップする
            - 命名や責務を整理する
            - 重複を排除する

        - step: 4.2
          name: 最適化
          purpose: パフォーマンスやリソース効率、応答速度を改善するために、アルゴリズムや実装の見直しを行う。
          depends_on:
            - src/
          outputs:
            - src/
          command: %optimize
          responsibility:
            - パフォーマンスプロファイルを解析する
            - ボトルネックを特定し改善案を提示する

    - step: 5
      name: 不具合対応
      purpose: 指摘された不具合に対して、step 3 の実装・テスト・リファクタリング・最適化のフローを再適用して修正を行う。
      depends_on: []
      command: %fix
      responsibility:
        - 不具合の原因を特定する
        - 修正内容に応じて step 3 の各プロセス（テストコード作成、実装、リファクタリング、最適化）を再実行する
        - 修正後の動作確認を行い、test-report.log を更新する
      outputs:
        - src/
        - src/test/

    - step: 6
      name: Issue記録
      purpose: 直前のタスクで直面したトラブルやその解決方法、試行錯誤の過程を記録し、GitHub Issuesの一般的な使い方に準じた形式で docs/issue/ に保存する。
      depends_on: []
      outputs:
        - docs/issue/
      command: %issue
      responsibility:
        - 問題の背景、発生条件、現象を明確に記録する
        - 原因の特定および修正内容を記載する
        - 次回以降の参考になるよう時系列や試行錯誤も含める
        - GitHub Issues の記法（タイトル、説明、再現手順、期待結果など）に準じて記述する

glossary:
  - term: ストーリー駆動開発（Story-Driven Development）
    definition: >
      ストーリー駆動開発は、ユーザーストーリーをYAML形式で構造化したDSL（ドメイン固有言語）に基づく開発手法である。
      ユーザーはツールやテキストエディタを用いて story.yaml を作成する。
      ユーザーとAIエージェントは、story.yaml を通じて共通理解できる構造化フォーマットに基づき、
      ストーリーブレインストーミング、詳細化、受け入れ基準の策定を行う。
      エージェントは story.yaml を元に plan.yaml を出力し、さらに plan.yaml を元に実装とテストを行う。
      この一連のプロセス全体をストーリー駆動開発と呼ぶ。
