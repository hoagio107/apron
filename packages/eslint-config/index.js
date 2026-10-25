module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', 'legacy', '.eslintrc.cjs', 'tailwind.config.js', 'eslint-local-rules.cjs', 'src/main.tsx', 'shadcn-studio', '_legacy_vue', 'src-tauri'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json'],
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['local-rules', 'jsx-a11y', 'sonarjs'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // ─── File Size ────────────────────────────────────────────────────────────
    // Giới hạn 300 dòng/file để buộc phân tách component
    'max-lines': ['error', { 'max': 650, 'skipBlankLines': true, 'skipComments': true }],

    // ─── Import ───────────────────────────────────────────────────────────────
    // Cấm import CSS rời rạc — chỉ dùng Tailwind qua className
    'no-restricted-imports': ['error', {
      'patterns': [{
        'group': ['*.css', '*.scss', '*.sass', '!./global.css', '!global.css'],
        'message': 'CẤM import CSS rời rạc. Chỉ dùng Tailwind theo chuẩn Design System của HeroUI.'
      }]
    }],

    // ─── Local Rules: Design System & Architecture ────────────────────────────

    'local-rules/forbid-explicit-css': 'error',
    'local-rules/forbid-eslint-disable': 'error',
    'local-rules/forbid-primitive-jsx-props': 'off', // HeroUI doesn't use Box/Stack
    'local-rules/forbid-native-jsx-elements': 'off', // HeroUI uses native divs for layout
    'local-rules/forbid-native-dom-query': 'error',
    'local-rules/forbid-magic-timeout': 'error',
    'local-rules/forbid-native-as-prop': 'off',
    'local-rules/strict-tailwind-spacing-radius': 'off', // Tailwind v4 + HeroUI uses arbitrary values often
    'local-rules/strict-tailwind-tokens': 'off', // No more strict shadcn tokens
    'local-rules/forbid-repeated-jsx-ternary': 'warn',
    'local-rules/forbid-inline-svg-component': 'warn',
    'local-rules/forbid-cross-feature-import': 'error',
    'local-rules/require-popover-active-state': 'warn',
    'local-rules/forbid-tailwind-invalid-spacing': 'off',
    'local-rules/forbid-onclick-on-layout-components': 'warn',
    'local-rules/forbid-custom-classname-on-empty-state': 'off',
    'local-rules/forbid-custom-hw-classes': 'off',
    'local-rules/forbid-adhoc-dark-classes': 'error',
    'local-rules/enforce-style-css-components': 'error',

    // ─── Console ─────────────────────────────────────────────────────────────
    // Cấm console.log/warn/debug — dùng logger service thay thế
    'no-console': ['warn', { 'allow': ['error'] }],

    // ─── DRY & Code Smells (SonarJS) ─────────────────────────────────────────
    'sonarjs/no-duplicate-string': ['warn', { 'threshold': 5 }], // Cảnh báo nếu string lặp lại >= 5 lần
    'sonarjs/no-identical-functions': 'warn', // Cảnh báo hàm giống hệt nhau
    'sonarjs/no-identical-expressions': 'warn', // Cảnh báo biểu thức dư thừa (a === 1 || a === 1)

    // ─── Nhóm 1: React Patterns ──────────────────────────────────────────────

    // Tắt rule không cần thiết trong React 17+ (JSX transform tự động)
    'react/react-in-jsx-scope': 'off',
    // Tắt prop-types vì dự án dùng TypeScript
    'react/prop-types': 'off',

    // Buộc self-closing tag khi component không có children
    // ❌ <Box></Box>  ✅ <Box />
    'react/self-closing-comp': ['error', { 'component': true, 'html': false }],

    // Cấm <></SomeComp></> thừa không cần thiết
    'react/jsx-no-useless-fragment': ['error', { 'allowExpressions': true }],

    // Bắt buộc tên component PascalCase để phân biệt với thẻ HTML
    'react/jsx-pascal-case': ['error', { 'allowAllCaps': false, 'ignore': [] }],

    // Chuẩn hóa boolean prop: dùng shorthand (disabled thay vì disabled={true})
    'react/jsx-boolean-value': ['error', 'never'],

    // Cấm dangerouslySetInnerHTML — Tauri app không bao giờ cần
    'react/no-danger': 'error',

    // Cảnh báo dùng array index làm key — performance trap trong re-render
    'react/no-array-index-key': 'warn',

    // ─── Nhóm 1: React Hooks ─────────────────────────────────────────────────

    // Nâng exhaustive-deps từ warn (recommended mặc định) lên error
    // Stale closure do thiếu dependency là nguồn gốc bug khó tìm nhất
    'react-hooks/exhaustive-deps': 'error',

    // ─── Nhóm 2: Accessibility (jsx-a11y) — điều chỉnh cho Tauri Desktop ─────

    // Tắt các rule không phù hợp desktop mouse-first app
    'jsx-a11y/click-events-have-key-events': 'off',   // Desktop: mouse-first OK
    'jsx-a11y/no-autofocus': 'off',                   // Editor cần autofocus
    'jsx-a11y/anchor-is-valid': 'off',                // Không dùng <a> trong Tauri
    'jsx-a11y/no-static-element-interactions': 'off', // ActionArea xử lý qua component

    // Giữ lại các rule quan trọng (override từ recommended nếu cần)
    'jsx-a11y/alt-text': 'error',                     // AppImage phải có alt
    'jsx-a11y/interactive-supports-focus': 'error',   // ActionArea phải focusable

    // ─── Nhóm 3: TypeScript Strict ───────────────────────────────────────────

    // Nâng no-unused-vars lên error — prefix _ để bỏ qua khi cần thiết
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],

    // Giữ any là warn — cho phép khi thực sự không thể thay thế
    '@typescript-eslint/no-explicit-any': 'warn',

    // Bắt buộc dùng `import type` cho type-only imports
    // Giúp bundle sạch hơn, tránh circular dependency do value import
    '@typescript-eslint/consistent-type-imports': ['error', {
      'prefer': 'type-imports',
      'fixStyle': 'inline-type-imports'
    }],

    // Cảnh báo ép kiểu object literal trực tiếp ({} as Type)
    '@typescript-eslint/consistent-type-assertions': ['warn', {
      'assertionStyle': 'as',
      'objectLiteralTypeAssertions': 'allow-as-parameter'
    }],

    // Cảnh báo dùng ! non-null assertion — source of runtime null errors
    // Khi chắc chắn không null, prefix biến bằng _ để bypass no-unused-vars
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Khuyến khích ?? thay vì || để phân biệt nullish vs falsy
    // string: true = cho phép "" || "default" (falsy behavior đôi khi đúng ý)
    '@typescript-eslint/prefer-nullish-coalescing': ['warn', {
      'ignorePrimitives': { 'string': true, 'boolean': true }
    }],

    // Bắt buộc optional chaining — tránh verbose null check chains
    // ❌ a && a.b && a.b.c   ✅ a?.b?.c
    '@typescript-eslint/prefer-optional-chain': 'error',
  },
  overrides: [
    {
      // Nới lỏng rules cho các component HeroUI custom và các trang hiển thị Rich Text Tiptap
      files: [
        '**/packages/ui/src/components/**/*.tsx',
        '**/src/pages/recipes/**/*.tsx',
        '**/src/pages/tips/**/*.tsx',
        '**/src/pages/courses/**/*.tsx',
        '**/src/components/**/*.tsx'
      ],
      rules: {
        'react/no-danger': 'off',
      }
    }
  ],
}
