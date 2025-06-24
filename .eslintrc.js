// .eslintrc.js - 점진적 개선 버전
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // 🔸 기존 규칙 유지 (하위 호환성)
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // 🔸 점진적 강화 (error → warn으로 시작)
    '@typescript-eslint/no-explicit-any': 'warn', // 기존 off → warn
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-inferrable-types': 'warn',
    
    // 🔸 코드 품질 향상
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    
    // 🔸 NestJS 특화 규칙
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    
    // 🔸 Import 정리 (선택적)
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': true,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
      'allowSeparatedGroups': true
    }]
  },
  
  // 🔸 특정 파일에 대한 규칙 완화
  overrides: [
    {
      files: ['*.spec.ts', '*.e2e-spec.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // 테스트 파일은 완화
      }
    },
    {
      files: ['src/main.ts'],
      rules: {
        'no-console': 'off', // main.ts는 console.log 허용
      }
    }
  ]
};