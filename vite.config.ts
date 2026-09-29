import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// 3000 = Office (Dev/OTIF), 3100 = August — II gets its own port so all
	// three can run side by side.
	server: {
		host: '0.0.0.0',
		port: 3300,
		strictPort: false
	},
	preview: {
		host: '0.0.0.0',
		port: 3300
	}
});
