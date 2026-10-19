import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Les actions serveur utilisées avec useActionState reçoivent d'abord l'état précédent.
    rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] },
  },
  {
    // Règle du projet : aucun texte en dur dans l'interface.
    // Tous les textes viennent de textes/*.md (via messages/fr.json et next-intl).
    files: ["src/**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
        {
          noStrings: true,
          ignoreProps: true,
          allowedStrings: [" ", " · ", "·", "•", "*", " *", "/", "-", "–", "|"],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    "playwright-report/**",
    "test-results/**",
    // Reference CV templates delivered as is (standalone HTML, CSS and scripts, not app code).
    "docs/modeles-cv/**",
    // Mockup boards and their generators (docs/refonte-mobile, …): reference files, not app code.
    "docs/**/maquette/**",
    "docs/**/source/**",
  ]),
]);

export default eslintConfig;
