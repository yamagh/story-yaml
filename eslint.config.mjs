import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default tseslint.config(
    // Base configs
    eslint.configs.recommended,
    ...tseslint.configs.recommended,

    // React specific configs
    reactRecommended,
    {
        plugins: {
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
            "import": importPlugin
        }
    },

    // General configuration for all TS/TSX files
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.eslint.json', // Use tsconfig.eslint.json
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            }
        },
        settings: {
            "import/resolver": {
                typescript: true,
                node: true,
            },
            "react": {
                version: "detect", // Automatically detect the React version
            }
        },
        rules: {
            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // React specific rules
            "react/react-in-jsx-scope": "off", // Not needed with new JSX transform
            "react/prop-types": "off", // Not needed with TypeScript

            // Import rules
            "import/prefer-default-export": "off", // Allow named exports
            "import/extensions": [
                "error",
                "ignorePackages",
                {
                    "ts": "never",
                    "tsx": "never"
                }
            ],

            // General quality of life rules
            "no-unused-vars": "off", // Use typescript-eslint version
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "@typescript-eslint/explicit-function-return-type": "off",
        }
    }
);