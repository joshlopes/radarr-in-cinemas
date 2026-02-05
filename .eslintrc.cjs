module.exports = {
    overrides: [
        {
            files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
            extends: 'love'
        }
    ],
    ignorePatterns: [
        '.eslintrc.cjs',
        'node_modules/',
        'tests/',
        'dist/',
    ],
}