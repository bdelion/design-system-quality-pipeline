import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'data/**', 'node_modules/**']
  },
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
