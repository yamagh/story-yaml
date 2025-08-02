environment:
  devbox: true
  instructions: >
    開発に必要なパッケージ（例: npm モジュールなど）は Devbox を用いてインストールすること。
  examples:
      - devbox init
      - devbox add nodejs
      - devbox run npm install
      - devbox run npm run build

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
    - css: bootstrap, bootstrap-icons
