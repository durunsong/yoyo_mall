import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'prisma/migrations/**',
    ],
    rules: {
      // TypeScript规则
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // React规则
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      
      // 通用规则
      'prefer-const': 'warn',
      'no-var': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'comma-dangle': 'off',
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single'],
      'jsx-quotes': ['warn', 'prefer-double'],
      'react/no-unescaped-entities': 'warn',
      'react-hooks/purity': 'warn',
      
      // Next.js规则
      '@next/next/no-img-element': 'warn',
      '@next/next/no-page-custom-font': 'off',
    },
  },
];

export default eslintConfig;
