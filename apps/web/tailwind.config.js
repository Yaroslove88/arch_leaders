/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Включаем shared UI пакет для сканирования Tailwind классов
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Foundation Colors via CSS vars
        'obsidian-core': 'var(--color-obsidian-core, #0F1216)',
        'graphite-structure': 'var(--color-graphite-structure, #1A1F26)',
        'ash-light': 'var(--color-ash-light, #E6E8EB)',

        // Core Meaning Colors (системные) - смыслы
        'strategic-blue': 'var(--color-strategic-blue, #1F3A5F)',
        'inner-violet': 'var(--color-inner-violet, #3B2F4A)',
        'sage-green': 'var(--color-sage-green, #4E6F5D)',
        'tension-red': 'var(--color-tension-red, #8C2F2F)',

        // Accent / Power Colors (5-10% интерфейса) - энергия
        'catalyst-gold': 'var(--color-catalyst-gold, #C6A75E)',
        'warm-amber': 'var(--color-warm-amber, #B8743A)',

        // Семантические цвета для UI элементов (на основе Foundation)
        'ui-border-soft': 'var(--color-ui-border-soft, rgba(255, 255, 255, 0.06))',
        'ui-border-strong': 'var(--color-ui-border-strong, rgba(255, 255, 255, 0.12))',
        'ui-grid': 'var(--color-ui-grid, rgba(255, 255, 255, 0.04))',

        // Legacy aliases для обратной совместимости (будут постепенно заменены)
        'bg-main': 'var(--color-obsidian-core, #0F1216)',              // → obsidian-core
        'bg-secondary': 'var(--color-graphite-structure, #1A1F26)',    // → graphite-structure
        'bg-panel': 'var(--color-graphite-structure, #1A1F26)',        // → graphite-structure
        'bg-canvas': 'var(--color-obsidian-core, #0F1216)',            // → obsidian-core

        'ui-text-main': 'var(--color-text-main, #E6E8EB)',             // → ash-light
        'ui-text-muted': 'var(--color-text-muted, #A4A8AD)',           // вторичный текст
        'ui-text-dim': 'var(--color-text-dim, #8A8E94)',               // третичный текст

        // System colors (маппинг на новые смысловые цвета)
        'system-focus': 'var(--state-focus, #1F3A5F)',
        'system-stable': 'var(--color-sage-green, #4E6F5D)',
        'system-growth': 'var(--state-growth, #4E6F5D)',
        'system-warning': 'var(--state-warning, #C6A75E)',
        'system-critical': 'var(--state-critical, #8C2F2F)',
        'system-disabled': 'var(--state-disabled, rgba(255, 255, 255, 0.24))',
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
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
        'mono': ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.02em',
        'wider': '0.05em',
      },
      borderRadius: {
        'none': '0',
        'sm': 'var(--radius-sm, 0.25rem)',
        'DEFAULT': 'var(--radius-md, 0.5rem)',
        'md': 'var(--radius-md, 0.5rem)',
        'lg': 'var(--radius-lg, 0.75rem)',
        'xl': 'var(--radius-lg, 0.75rem)',      // 12px - для карточек
        '2xl': 'var(--radius-xl, 1.125rem)',    // 18px - для карточек и модальных окон
        '3xl': 'var(--radius-2xl, 1.5rem)',
        'full': '9999px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        // Мягкие тени для карточек (12-18px скругления)
        'panel': 'var(--shadow-panel, 0 1px 0 rgba(255,255,255,0.04), 0 12px 24px rgba(0,0,0,0.45))',
        'floating': 'var(--shadow-floating, 0 2px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.65))',
        // Subtle glow для активных элементов
        'active': 'var(--shadow-active, 0 0 0 1px rgba(31,58,95,0.35), 0 24px 60px rgba(0,0,0,0.7))',
        'glow-blue': '0 0 24px rgba(31,58,95,0.25)',
        'glow-gold': '0 0 32px rgba(198,167,94,0.3)',
        'glow-green': '0 0 32px rgba(78,111,93,0.2)',
        'glow-violet': '0 0 24px rgba(59,47,74,0.25)',
        // Node states
        'node-locked': '0 0 0 1px rgba(255,255,255,0.08)',
        'node-available': '0 0 24px rgba(31,58,95,0.15)',
        'node-active': '0 0 0 1px rgba(31,58,95,0.25), 0 12px 32px rgba(0,0,0,0.6)',
        'node-integrated': '0 0 32px rgba(78,111,93,0.2)',
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

