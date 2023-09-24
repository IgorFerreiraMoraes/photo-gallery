import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';

const pwa_manifest: Partial<VitePWAOptions> = {
	registerType: 'prompt',
	includeAssets: ['favicon.png'],
	manifest: {
		name: 'Photo Gallery',
		short_name: 'Photo Gallery',
		description: 'Vue & Ionic Test PWA',
		icons: [
			{
				src: '/favicon.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any maskable',
			},
		],
		theme_color: '#3880ff',
		background_color: '#ffffff',
		display: 'standalone',
		scope: '/',
		start_url: '/',
		orientation: 'portrait',
	},
};

// https://vitejs.dev/config/
export default defineConfig({
	base: './',
	plugins: [vue(), legacy(), VitePWA(pwa_manifest)],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
