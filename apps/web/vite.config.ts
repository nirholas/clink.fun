import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		port: 3000,
		// The API is a separate process in development and the same origin in
		// production, so the app always calls /api/* and the proxy makes that
		// true locally too.
		proxy: { '/api': { target: process.env.CLINK_API_URL || 'http://localhost:8787', changeOrigin: true } },
	},
	build: { outDir: 'dist', sourcemap: true },
});
