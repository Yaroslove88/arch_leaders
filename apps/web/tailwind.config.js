/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base (поле)
        'bg-main': '#0E1116',
        'bg-secondary': '#0F1C2E',
        'bg-panel': '#141B26',
        'bg-canvas': '#0B0F14',
        
        // Structure (контуры, UI)
        'ui-border-soft': 'rgba(255, 255, 255, 0.06)',
        'ui-border-strong': 'rgba(255, 255, 255, 0.12)',
        'ui-line': '#243044',
        'ui-grid': 'rgba(255, 255, 255, 0.04)',
        'ui-text-main': '#E6E9EF',
        'ui-text-muted': '#9AA4B2',
        'ui-text-dim': '#6C7684',
        
        // System colors (состояния)
        'system-focus': '#3A6F8F',      // Structural Cyan
        'system-stable': '#2F8C8C',     // Muted Teal
        'system-growth': '#5FA38D',      // Emergence Green
        'system-warning': '#F2A03D',     // Tension Amber
        'system-critical': '#C14949',     // Subject Red
        
        // Рабочие цвета
        'structural-cyan': '#3A6F8F',
        'muted-teal': '#2F8C8C',
        'steel-gray': '#8A93A1',
        'tension-amber': '#F2A03D',
        'subject-red': '#C14949',
        'emergence-green': '#5FA38D',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'panel': '0 1px 0 rgba(255,255,255,0.04), 0 12px 24px rgba(0,0,0,0.45)',
        'floating': '0 2px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.65)',
        'active': '0 0 0 1px rgba(58,111,143,0.35), 0 24px 60px rgba(0,0,0,0.7)',
        'node-locked': '0 0 0 1px rgba(255,255,255,0.08)',
        'node-available': '0 0 24px rgba(58,111,143,0.15)',
        'node-active': '0 0 0 1px rgba(58,111,143,0.25), 0 12px 32px rgba(0,0,0,0.6)',
        'node-integrated': '0 0 32px rgba(95,163,141,0.2)',
      },
      backgroundImage: {
        'grid': `
          repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.03),
            rgba(255,255,255,0.03) 1px,
            transparent 1px,
            transparent 64px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(255,255,255,0.03),
            rgba(255,255,255,0.03) 1px,
            transparent 1px,
            transparent 64px
          )
        `,
        'panel-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))',
      },
    },
  },
  plugins: [],
};

