'use client';

// NOTE: module id: 687989
// Variable Mapping: u -> SIZES, s -> THEMES, e -> children, c -> className, l -> href, f -> size, d -> theme, p -> icon, g -> active, m -> loading, h -> disabled, y -> onClick, v -> restProps, b -> resolvedSize, _ -> resolvedTheme, x -> isDisabled, w -> handleClick, S -> innerContent, k -> containerClassName, P -> dataActive

import Link from 'next/link'; // NOTE: module id: 522016
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import { useTransitionClick } from '@/hooks/useTransitionClick'; // NOTE: module id: 995289
import { InlineLoader } from '@/components/layout/Loader/InlineLoader'; // NOTE: module id: 461376
import SlideText from '@/components/animations/SlideText'; // NOTE: module id: 991642

const SIZES = {
  xs: {
    content: 'h-24 px-8 lg:h-28 lg:px-10',
    text: 'text-[13px] font-medium normal-case tracking-normal font-sans'
  },
  sm: {
    content: 'h-32 px-10 lg:h-40 lg:px-14',
    text: 'text-body-sm font-medium normal-case tracking-normal font-sans'
  },
  default: {
    content: 'h-40 px-14 lg:h-48 lg:px-18',
    text: 'text-body-sm lg:text-body font-medium normal-case tracking-normal font-sans'
  }
};

const THEMES = {
  light: 'bg-foreground text-background group-hover:bg-[color-mix(in_srgb,var(--foreground),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--foreground),#000_10%)]',
  dark: 'bg-foreground text-background group-hover:bg-[color-mix(in_srgb,var(--foreground),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--foreground),#000_10%)]',
  brand: 'bg-brand text-[#141314] group-hover:bg-[color-mix(in_srgb,var(--brand),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--brand),#000_10%)]',
  surface: 'bg-surface text-foreground group-hover:bg-[color-mix(in_srgb,var(--surface),#000_10%)] group-data-[active=true]:bg-[color-mix(in_srgb,var(--surface),#000_10%)]'
};

export default function AnimatedButton({
  children,
  className,
  href,
  size = 'default',
  theme = 'light',
  icon = null,
  active = false,
  loading = false,
  disabled = false,
  onClick,
  ...restProps
}) {
  const resolvedSize = SIZES[size] ?? SIZES.default;
  const resolvedTheme = THEMES[theme] ?? THEMES.light;
  const isDisabled = loading || disabled;

  const handleClick = useTransitionClick(href, {
    onClick
  });

  const innerContent = (
    <span
      className={cn(
        'pointer-events-none flex w-full items-center justify-center',
        'transition-colors duration-(--duration-quick) ease-(--ease-expo-out)',
        resolvedSize.content,
        resolvedTheme
      )}
    >
      {icon && !loading ? (
        <span className="pointer-events-none mr-6 flex items-center">
          {icon}
        </span>
      ) : null}
      {loading ? (
        <InlineLoader
          size={size === 'xs' ? '14' : '18'}
          color="currentColor"
        />
      ) : (
        <SlideText>{children}</SlideText>
      )}
    </span>
  );

  const containerClassName = cn(
    resolvedSize.text,
    'group inline-flex min-w-0 shrink-0 cursor-pointer items-center justify-center',
    'whitespace-nowrap outline-none',
    'transition-transform duration-(--duration-quick) ease-(--ease-back-out)',
    'hover:scale-[0.95] data-[active=true]:scale-[0.95] disabled:hover:scale-100',
    'focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2',
    'disabled:cursor-default',
    className
  );

  const dataActive = active ? 'true' : undefined;

  if (href) {
    return (
      <Link
        href={href}
        className={containerClassName}
        data-active={dataActive}
        aria-busy={loading || undefined}
        onClick={handleClick}
        {...restProps}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={containerClassName}
      data-active={dataActive}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...restProps}
    >
      {innerContent}
    </button>
  );
}
