// Checks run on staged files before each commit (Husky, .husky/pre-commit).
const config = {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,mjs,css,json,yml,yaml}": "prettier --write",
  // Texts changed: messages/fr.json must have been regenerated (pnpm messages).
  "textes/*.md": () => "pnpm messages:check",
  // Brand files changed: generated icons and public copies must be up to date (pnpm brand).
  "ressources/**/*.svg": () => "pnpm brand:check",
};

export default config;
