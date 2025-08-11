module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        '@vue/standard',
        'plugin:vue/vue3-essential'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    plugins: [
        'vue'
    ],
    rules: {
        // Vue 相关规则
        'vue/multi-word-component-names': 'off',
        'vue/no-unused-vars': 'error',
        'vue/require-v-for-key': 'error',
        'vue/no-use-v-if-with-v-for': 'error',

        // 一般 JavaScript 规则
        'no-console': 'warn',
        'no-debugger': 'warn',
        'no-unused-vars': 'warn',
        'no-undef': 'error',

        // 代码风格
        'indent': ['error', 2],
        'quotes': ['error', 'single'],
        'semi': ['error', 'never'],
        'comma-dangle': ['error', 'never'],
        'space-before-function-paren': ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],

        // 其他
        'eqeqeq': ['error', 'always'],
        'no-trailing-spaces': 'error',
        'eol-last': 'error'
    },
    globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly'
    }
}