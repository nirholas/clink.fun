/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				// One dark surface ramp rather than Tailwind's greys, so every
				// panel edge in the app is deliberate. The ramp leans a few
				// degrees blue so the page reads as night sky, not as charcoal.
				ink: {
					950: '#06060b',
					900: '#0b0b13',
					850: '#10101a',
					800: '#161623',
					700: '#1f1f2e',
					600: '#2b2b3d',
				},
				accent: {
					DEFAULT: '#a855f7',
					soft: '#c084fc',
					deep: '#7c3aed',
					dim: 'rgba(168,85,247,0.14)',
				},
				// A second hue so gradients have somewhere to go. Cyan against
				// violet is the "space" pairing; used for glows and gradient text.
				sky: {
					DEFAULT: '#38bdf8',
					soft: '#7dd3fc',
				},
				up: '#3ddc84',
				down: '#ff5c5c',
				muted: '#8b8b9c',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
				display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
			},
			// Tailwind ships 5/10/20/25 and jumps. These are the in-between
			// steps this design actually uses for hairline borders and washes.
			opacity: { 4: '0.04', 6: '0.06', 8: '0.08', 12: '0.12', 15: '0.15', 18: '0.18' },
			boxShadow: {
				glow: '0 0 0 1px rgba(168,85,247,0.35), 0 12px 40px -12px rgba(168,85,247,0.55)',
				'glow-sm': '0 0 24px -6px rgba(168,85,247,0.6)',
				card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 50px -30px rgba(0,0,0,0.9)',
			},
			animation: {
				'fade-in': 'fadeIn 0.24s ease-out',
				rise: 'rise 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
				bump: 'bump 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
				marquee: 'marquee 40s linear infinite',
				float: 'float 7s ease-in-out infinite',
				'float-slow': 'float 11s ease-in-out infinite',
				'glow-pulse': 'glowPulse 3.2s ease-in-out infinite',
				shine: 'shine 1.4s ease-in-out',
			},
			keyframes: {
				fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
				rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
				// The pump.fun "bump": a card that just traded jolts and glows
				// so the feed reads as alive.
				bump: {
					'0%': { transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 0 rgba(168,85,247,0)' },
					'25%': { transform: 'translateY(-4px) scale(1.02)', boxShadow: '0 0 0 2px rgba(168,85,247,0.6)' },
					'100%': { transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 0 rgba(168,85,247,0)' },
				},
				marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
				float: {
					'0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
					'50%': { transform: 'translateY(-14px) rotate(1deg)' },
				},
				glowPulse: {
					'0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
					'50%': { opacity: '0.9', transform: 'scale(1.06)' },
				},
				shine: { from: { transform: 'translateX(-120%)' }, to: { transform: 'translateX(220%)' } },
			},
		},
	},
	plugins: [],
};
