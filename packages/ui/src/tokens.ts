// Design tokens v2 for Leadership Architect
// Централизованные палитры, типографика, радиусы, тени и отступы.

/** Node state types for ability tree */
export type NodeState = 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';

/** Branch IDs for ability tree */
export type BranchId = 
  | 'subjectivity' 
  | 'architectural-thinking' 
  | 'resilience' 
  | 'responsibility' 
  | 'feedback' 
  | 'environment-maturity';

/** Node state style structure */
export interface NodeStateStyle {
  bg: string;
  border: string;
  text: string;
  accent: string;
}

export const tokens = {
  colors: {
    base: {
      obsidianCore: '#0F1216',
      graphiteStructure: '#1A1F26',
      ashLight: '#E6E8EB',
    },
    text: {
      main: '#E6E8EB',
      muted: '#A4A8AD',
      dim: '#8A8E94',
    },
    core: {
      strategicBlue: '#1F3A5F', // Синхронизировано с globals.css
      innerViolet: '#8B5CF6',
      sageGreen: '#4E6F5D',
      tensionRed: '#8C2F2F',
      catalystGold: '#C6A75E',
      warmAmber: '#B8743A',
    },
    structure: {
      uiBorderSoft: 'rgba(255, 255, 255, 0.06)',
      uiBorderStrong: 'rgba(255, 255, 255, 0.12)',
      uiGrid: 'rgba(255, 255, 255, 0.04)',
    },
    state: {
      focus: '#1F3A5F',
      growth: '#4E6F5D',
      warning: '#C6A75E',
      critical: '#8C2F2F',
      disabled: 'rgba(255, 255, 255, 0.24)',
    },
    // Role-based aliases for components
    roles: {
      surface: '#1A1F26',
      surfaceAlt: '#0F1216',
      surfaceMuted: '#0F1216',
      border: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(255, 255, 255, 0.12)',
      shadow: '0 1px 0 rgba(255,255,255,0.04), 0 12px 24px rgba(0,0,0,0.45)',
    },
    // Branch colors (ability tree branches)
    branches: {
      subjectivity: '#4A90E2',
      'architectural-thinking': '#50C878',
      resilience: '#FF6B6B',
      responsibility: '#FFA500',
      feedback: '#9B59B6',
      'environment-maturity': '#1ABC9C',
      // Fallback for unknown branches
      default: '#6B7280',
    },
    // Node state colors (for tree visualization)
    nodeStates: {
      locked: {
        bg: '#1A1A1A',
        border: '#2A2A2A',
        text: '#555555',
        accent: '#333333',
      },
      available: {
        bg: '#1A212A',
        border: '#3A6F8F',
        text: '#8BA5B5',
        accent: '#D29B1B',
      },
      active: {
        bg: '#1A2A21',
        border: '#4A9F6F',
        text: '#8FC5A5',
        accent: '#3A6F8F',
      },
      unlocked: {
        bg: '#212A1A',
        border: '#8FAF4A',
        text: '#C5D58F',
        accent: '#4A9F6F',
      },
      integrated: {
        bg: '#2A211A',
        border: '#CF9F4A',
        text: '#E5C58F',
        accent: '#CF9F4A',
      },
    },
  },
    spacing: {
      xs: '0.25rem',   // 4px
      sm: '0.5rem',    // 8px
      md: '0.75rem',   // 12px
      lg: '1rem',      // 16px
      xl: '1.5rem',    // 24px
      '2xl': '2rem',   // 32px
      '3xl': '3rem',   // 48px
      '18': '4.5rem',
      '88': '22rem',
    },
    radii: {
      none: '0',
      sm: '0.25rem',    // 4px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
      xl: '1.125rem',   // 18px
      '2xl': '1.5rem',  // 24px
      full: '9999px',
    },
    shadows: {
      panel: '0 1px 0 rgba(255,255,255,0.04), 0 12px 24px rgba(0,0,0,0.45)',
      floating: '0 2px 0 rgba(255,255,255,0.06), 0 24px 60px rgba(0,0,0,0.65)',
      active: '0 0 0 1px rgba(31,58,95,0.35), 0 24px 60px rgba(0,0,0,0.7)',
      'glow-blue': '0 0 24px rgba(31,58,95,0.25)',
      'glow-gold': '0 0 32px rgba(198,167,94,0.3)',
      'glow-green': '0 0 32px rgba(78,111,93,0.2)',
      'glow-violet': '0 0 24px rgba(59,47,74,0.25)',
      'node-locked': '0 0 0 1px rgba(255,255,255,0.08)',
      'node-available': '0 0 24px rgba(31,58,95,0.15)',
      'node-active': '0 0 0 1px rgba(31,58,95,0.25), 0 12px 32px rgba(0,0,0,0.6)',
      'node-integrated': '0 0 32px rgba(78,111,93,0.2)',
    },
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
      mono: 'Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    lineHeight: {
      tight: '1.1',
      snug: '1.3',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
    },
  },
};

/**
 * CSS variables map for consumption in Tailwind/theme.
 */
export const cssVars: Record<string, string> = {
  '--color-obsidian-core': tokens.colors.base.obsidianCore,
  '--color-graphite-structure': tokens.colors.base.graphiteStructure,
  '--color-ash-light': tokens.colors.base.ashLight,
  '--color-text-main': tokens.colors.text.main,
  '--color-text-muted': tokens.colors.text.muted,
  '--color-text-dim': tokens.colors.text.dim,
  '--color-strategic-blue': tokens.colors.core.strategicBlue,
  '--color-inner-violet': tokens.colors.core.innerViolet,
  '--color-sage-green': tokens.colors.core.sageGreen,
  '--color-tension-red': tokens.colors.core.tensionRed,
  '--color-catalyst-gold': tokens.colors.core.catalystGold,
  '--color-warm-amber': tokens.colors.core.warmAmber,
  '--color-ui-border-soft': tokens.colors.structure.uiBorderSoft,
  '--color-ui-border-strong': tokens.colors.structure.uiBorderStrong,
  '--color-ui-grid': tokens.colors.structure.uiGrid,
  '--state-focus': tokens.colors.state.focus,
  '--state-growth': tokens.colors.state.growth,
  '--state-warning': tokens.colors.state.warning,
  '--state-critical': tokens.colors.state.critical,
  '--state-disabled': tokens.colors.state.disabled,
  // Shadows
  '--shadow-panel': tokens.shadows.panel,
  '--shadow-floating': tokens.shadows.floating,
  '--shadow-active': tokens.shadows.active,
  // Radii
  '--radius-sm': tokens.radii.sm,
  '--radius-md': tokens.radii.md,
  '--radius-lg': tokens.radii.lg,
  '--radius-xl': tokens.radii.xl,
  '--radius-2xl': tokens.radii['2xl'],
  // Branch colors
  '--branch-subjectivity': tokens.colors.branches.subjectivity,
  '--branch-architectural-thinking': tokens.colors.branches['architectural-thinking'],
  '--branch-resilience': tokens.colors.branches.resilience,
  '--branch-responsibility': tokens.colors.branches.responsibility,
  '--branch-feedback': tokens.colors.branches.feedback,
  '--branch-environment-maturity': tokens.colors.branches['environment-maturity'],
  '--branch-default': tokens.colors.branches.default,
  // Node state: locked
  '--node-locked-bg': tokens.colors.nodeStates.locked.bg,
  '--node-locked-border': tokens.colors.nodeStates.locked.border,
  '--node-locked-text': tokens.colors.nodeStates.locked.text,
  '--node-locked-accent': tokens.colors.nodeStates.locked.accent,
  // Node state: available
  '--node-available-bg': tokens.colors.nodeStates.available.bg,
  '--node-available-border': tokens.colors.nodeStates.available.border,
  '--node-available-text': tokens.colors.nodeStates.available.text,
  '--node-available-accent': tokens.colors.nodeStates.available.accent,
  // Node state: active
  '--node-active-bg': tokens.colors.nodeStates.active.bg,
  '--node-active-border': tokens.colors.nodeStates.active.border,
  '--node-active-text': tokens.colors.nodeStates.active.text,
  '--node-active-accent': tokens.colors.nodeStates.active.accent,
  // Node state: unlocked
  '--node-unlocked-bg': tokens.colors.nodeStates.unlocked.bg,
  '--node-unlocked-border': tokens.colors.nodeStates.unlocked.border,
  '--node-unlocked-text': tokens.colors.nodeStates.unlocked.text,
  '--node-unlocked-accent': tokens.colors.nodeStates.unlocked.accent,
  // Node state: integrated
  '--node-integrated-bg': tokens.colors.nodeStates.integrated.bg,
  '--node-integrated-border': tokens.colors.nodeStates.integrated.border,
  '--node-integrated-text': tokens.colors.nodeStates.integrated.text,
  '--node-integrated-accent': tokens.colors.nodeStates.integrated.accent,
};

