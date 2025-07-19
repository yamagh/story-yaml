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
            - 具体的なストーリー例や改善案、分割案などを論理的に提示する
            - 必要に応じてINVEST原則、Definition of Doneといったフレームワークに基づきチェックリストやアドバイスを提供する
            - 表面的な回答だけでなく、「なぜそれが必要か？」「本当にこのストーリーで価値は生まれるか？」など、ユーザーの思考や会話を深める問いを投げかける
            - 質問やフィードバックのやりとりによってユーザー自身の発見や気づきを促進する
            - ユーザーやチームに偏らず、第三者的な視点でバランスよく意見やアドバイスする
            - ベストプラクティスや過去事例など幅広い知識から根拠を示して説明する
          depends_on: []
          outputs:
            - .story/idea.yaml
          command: '%idea'

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
          command: '%synthesize'

    - step: 2
      name: 計画
      command: '%plan'
      substeps:
        - step: 2.1
          name: 実装計画
          purpose: ストーリーをもとに実装タスクを洗い出し、plan.yamlに出力する。
          ai_support:
            - ゴール/要件から逆算して必要なタスクの洗い出しと優先度付け
            - 現状の課題やリソースを把握し、実装したい範囲（スコープ）を明確に設定
            - いきなり全体計画を漠然と立てるのではなく、まずスモールスタート（小さなゴールの設定）を行い、進捗状況や効果を見ながら段階的にスコープや難易度を拡張する計画立案
            - 実装計画の精度を上げるために、過去の事例や既存のリソース・データベースを検索・分析し、「どういう実装が最適か」を確認
          depends_on:
            - .story/story.md
          outputs:
            - .story/plan.md
        - step: 2.2
          name: テスト戦略の定義
          purpose: |
            ユニットテスト、インテグレーションテスト、手動テストで何を確認するか境界線を明確にする。
            特に、ファイルシステム、ネットワーク、VS Code APIなど、外部環境への依存度が高い機能については、
            モック化のコストと効果を考慮し、テストアプローチを決定する。
          depends_on:
            - .story/plan.yaml
          outputs:
            - .story/plan.yaml

    - step: 3
      name: 実装とテストの統合管理
      command: '%dev'
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
            - .story/plan.yaml
          outputs:
            - src/
            - src/test/
          command: '%implement'

        - step: 3.2
          name: 実装とテスト
          purpose: 生成されたテストコードに基づいて最小限の実装を行い、テストを実行する。失敗した場合は原因を特定し修正を繰り返す。
          depends_on:
            - src/
            - src/test/
          outputs:
            - test-report.log
          command: '%test'
          responsibility:
            - テストを自動実行しログを収集する
            - エラーの要因を分析し修正案を提示する

    - step: 4
      name: レビュー
      command: '%improve'
      substeps:
        - step: 4.1
          name: 改善計画
          purpose: |
            コードベース全体を次の観点でレビューし改善計画を立てる
            - 技術的負債
            - リファクタリング: コードのクリーンアップ、命名や責務の整理、重複の排除
            - 最適化: パフォーマンスやリソース効率、応答速度を改善するためにアルゴリズムや実装の見直しを行う
            - ベストプラクティス
          depends_on: []
          outputs:
            - .story/plan.md
          command: '%improve-plan'
          responsibility:
            - コードベース改善のための多角的なレビューと計画を行う
        - step: 4.2
          name: 改善実行
          purpose:
          depends_on:
            - .story/plan.md
          outputs: []
          command: '%improve-execute'
          responsibility:
            - コードベースの改善を実行する

    - step: 5
      name: 不具合対応
      purpose: 指摘された不具合に対して、step 3 の実装・テスト・リファクタリング・最適化のフローを再適用して修正を行う。
      depends_on: []
      command: '%fix'
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
      command: '%issue'
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
