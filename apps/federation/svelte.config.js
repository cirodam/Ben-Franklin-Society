import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Mark better-sqlite3 as external to avoid bundling CommonJS module
			external: ['better-sqlite3']
		})
	}
};

export default config;
