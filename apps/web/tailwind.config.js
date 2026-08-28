/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				// One dark surface ramp rather than Tailwind's greys, so every
				// panel edge in the app is deliberate instead of whichever
				// zinc-8xx happened to be typed.
				ink: {
					950: '#050506',
					900: '#0a0a0c',
					850: '#101013',
					800: '#16161a',
					700: '#1f1f25',
					600: '#2a2a32',
				},
				accent: {
					DEFAULT: '#a855f7',
					soft: '#c084fc',
					dim: 'rgba(168,85,247,0.14)',
				},
				up: '#3ddc84',
				down: '#ff5c5c',
				muted: '#8b8b96',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			},
			// Tailwind ships 5/10/20/25 and jumps. These are the in-between
			// steps this design actually uses for hairline borders and washes.
			opacity: { 4: '0.04', 6: '0.06', 8: '0.08', 12: '0.12', 15: '0.15', 18: '0.18' },
			animation: { 'fade-in': 'fadeIn 0.24s ease-out', 'rise': 'rise 0.3s ease-out' },
			keyframes: {
				fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
				rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
			},
		},
	},
	plugins: [],
};
