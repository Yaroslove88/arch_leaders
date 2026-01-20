import React, { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, forwardRef } from 'react';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

type Tone = 'focus' | 'growth' | 'warning' | 'critical' | 'neutral';

const toneMap: Record<Tone, string> = {
  focus: 'bg-strategic-blue text-ash-light',
  growth: 'bg-sage-green text-ash-light',
  warning: 'bg-catalyst-gold text-obsidian-core',
  critical: 'bg-tension-red text-ash-light',
  neutral: 'bg-graphite-structure text-ash-light',
};

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  elevated = false,
  padding = 'md',
  className,
  ...rest
}) => {
  const paddingClass =
    padding === 'none' ? '' : padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4';
  return (
    <div
      className={cn(
        'bg-graphite-structure border border-ui-border-soft rounded-xl',
        elevated && 'shadow-panel',
        paddingClass,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated,
  header,
  footer,
  className,
  ...rest
}) => (
  <Surface elevated={elevated} className={className} {...rest}>
    {header && <div className="mb-3">{header}</div>}
    <div>{children}</div>
    {footer && <div className="mt-3">{footer}</div>}
  </Surface>
);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'critical';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  block,
  className,
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-focus/60';
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-strategic-blue text-ash-light border border-strategic-blue/70 hover:bg-strategic-blue/90',
    secondary:
      'bg-graphite-structure text-ash-light border border-ui-border-soft hover:border-ui-border-strong',
    ghost:
      'bg-transparent text-ash-light hover:text-ash-light hover:border-ui-border-soft border border-transparent',
    critical:
      'bg-tension-red text-ash-light border border-tension-red/70 hover:bg-tension-red/80',
  };
  return (
    <button
      className={cn(base, variants[variant], block && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  soft?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = 'neutral', soft = true, className, ...rest }) => {
  const toneClass = toneMap[tone];
  const softClass = soft ? 'bg-opacity-20 text-opacity-90' : '';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg border border-ui-border-soft',
        toneClass,
        softClass,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  tone?: Tone;
  /** Custom color override (CSS color string) */
  customColor?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, tone = 'focus', customColor, className, ...rest }) => {
  const bounded = Math.max(0, Math.min(100, value));
  
  // Определяем цвет заливки
  const getBgColor = () => {
    if (customColor) return '';
    switch (tone) {
      case 'focus': return 'bg-strategic-blue';
      case 'growth': return 'bg-sage-green';
      case 'warning': return 'bg-catalyst-gold';
      case 'critical': return 'bg-tension-red';
      default: return 'bg-ui-border-soft';
    }
  };

  return (
    <div className={cn('w-full bg-obsidian-core rounded-full h-2', className)} {...rest}>
      <div
        className={cn('h-2 rounded-full transition-all duration-300', getBgColor())}
        style={{ 
          width: `${bounded}%`,
          backgroundColor: customColor || undefined
        }}
        aria-valuenow={bounded}
        role="progressbar"
      />
    </div>
  );
};

export interface PillTabsProps {
  tabs: Array<{ id: string; label: string; count?: number }>;
  activeId: string;
  onSelect: (id: string) => void;
  /** Scrollable variant for mobile with gradient hints */
  scrollable?: boolean;
  /** Aria label for the tablist */
  ariaLabel?: string;
}

export const PillTabs: React.FC<PillTabsProps> = ({
  tabs,
  activeId,
  onSelect,
  scrollable = false,
  ariaLabel,
}) => {
  const containerClass = scrollable
    ? 'relative'
    : '';
  const innerClass = scrollable
    ? 'flex items-center gap-2 overflow-x-auto scrollbar-hide px-1 py-1 -mx-1'
    : 'inline-flex items-center gap-2 p-1';

  return (
    <div className={containerClass}>
      {/* Left gradient hint for scrollable */}
      {scrollable && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-graphite-structure to-transparent z-10 md:hidden"
          aria-hidden="true"
        />
      )}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'bg-graphite-structure border border-ui-border-soft rounded-full',
          innerClass
        )}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 min-h-[36px] min-w-[44px] flex items-center justify-center gap-1.5',
                active
                  ? 'bg-strategic-blue text-ash-light'
                  : 'text-ui-text-muted hover:text-ash-light hover:bg-obsidian-core'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'text-xs',
                  active ? 'text-ash-light/80' : 'text-ui-text-dim'
                )}>
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Right gradient hint for scrollable */}
      {scrollable && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-graphite-structure to-transparent z-10 md:hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

// =============================================================================
// Spinner
// =============================================================================

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  tone?: Tone;
  /** Optional loading text displayed below spinner */
  text?: string;
  /** Fullscreen centered mode */
  fullScreen?: boolean;
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

const spinnerTones: Record<Tone, string> = {
  focus: 'border-t-strategic-blue',
  growth: 'border-t-sage-green',
  warning: 'border-t-catalyst-gold',
  critical: 'border-t-tension-red',
  neutral: 'border-t-ash-light',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  tone = 'focus',
  text,
  fullScreen = false,
  className,
  ...rest
}) => {
  const spinnerEl = (
    <div className="flex flex-col items-center justify-center" {...rest}>
      <div
        className={cn(
          spinnerSizes[size],
          'border-ui-border-soft rounded-full animate-spin',
          spinnerTones[tone],
          className
        )}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <p className="mt-4 text-sm text-ui-text-muted">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-core">
        {spinnerEl}
      </div>
    );
  }

  return spinnerEl;
};

// =============================================================================
// Empty — пустое состояние
// =============================================================================

export interface EmptyProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon element (e.g. from lucide-react) */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button/element */
  action?: ReactNode;
}

export const Empty: React.FC<EmptyProps> = ({
  icon,
  title,
  description,
  action,
  className,
  ...rest
}) => {
  return (
    <Surface
      padding="lg"
      className={cn('flex flex-col items-center justify-center text-center py-12', className)}
      {...rest}
    >
      {icon && (
        <div className="mb-4 text-ui-text-dim" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ash-light mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-ui-text-muted max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">{action}</div>
      )}
    </Surface>
  );
};

// =============================================================================
// Field — обертка для форм с label, description, error
// =============================================================================

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  /** Label text */
  label: string;
  /** Unique ID linking label to input */
  htmlFor: string;
  /** Optional description below label */
  description?: string;
  /** Error message */
  error?: string;
  /** Required indicator */
  required?: boolean;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  className,
  ...rest
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...rest}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-ash-light flex items-center gap-1"
      >
        {label}
        {required && <span className="text-tension-red">*</span>}
      </label>
      {description && (
        <p className="text-xs text-ui-text-muted -mt-0.5">{description}</p>
      )}
      <div>{children}</div>
      {error && (
        <p className="text-xs text-tension-red flex items-center gap-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// =============================================================================
// Input — базовый инпут
// =============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Error state */
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  hasError,
  className,
  ...rest
}, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm text-ash-light bg-obsidian-core border rounded-lg',
        'placeholder:text-ui-text-dim',
        'focus:outline-none focus:ring-2 focus:ring-strategic-blue/50 focus:border-strategic-blue',
        'transition-colors',
        hasError
          ? 'border-tension-red focus:ring-tension-red/50 focus:border-tension-red'
          : 'border-ui-border-soft hover:border-ui-border-strong',
        className
      )}
      {...rest}
    />
  );
});

Input.displayName = 'Input';

// =============================================================================
// Textarea — базовый textarea
// =============================================================================

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  hasError,
  className,
  ...rest
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 text-sm text-ash-light bg-obsidian-core border rounded-lg',
        'placeholder:text-ui-text-dim',
        'focus:outline-none focus:ring-2 focus:ring-strategic-blue/50 focus:border-strategic-blue',
        'transition-colors resize-none',
        hasError
          ? 'border-tension-red focus:ring-tension-red/50 focus:border-tension-red'
          : 'border-ui-border-soft hover:border-ui-border-strong',
        className
      )}
      {...rest}
    />
  );
});

Textarea.displayName = 'Textarea';
