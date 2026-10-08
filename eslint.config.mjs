import eslint from '@eslint/js';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Exclure les dépendances et les fichiers générés.
  globalIgnores([
    'dist/**',
    'data/**',
    'node_modules/**',
    'docs/api/**'
  ]),

  // Règles recommandées JavaScript et TypeScript.
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Autoriser les API navigateur dans les assets du dashboard.
  {
    files: ['src/dashboard/assets/**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        URLSearchParams: 'readonly',
        window: 'readonly'
      }
    }
  }
);