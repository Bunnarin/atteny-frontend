import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	base: './',
	plugins: [
		sveltekit(), 
		tailwindcss(), 
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Atteny',
				short_name: 'Atteny',
				start_url: '/',
				display: 'standalone',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				description: "add to your homescreen for easier access",
				icons: [
					{
						src: '/logo192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/logo512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
		})],
});
