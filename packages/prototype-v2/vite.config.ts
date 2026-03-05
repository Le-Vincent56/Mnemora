import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@mnemora/core': path.resolve(__dirname, '../core'),
        },
    },
    server: {
        port: 3000,
    },
});