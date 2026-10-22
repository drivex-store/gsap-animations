'use client';

// Variable Mapping: s -> NAV_SURFACE, e -> href, i -> children, o -> className, c -> onMouseEnter, u -> onClick, d -> active, f -> icon, m -> as, h -> inline, x -> showIndicator, g -> variant, p -> props, C -> handleTransitionClick, v -> Component, b -> isDefaultLink, j -> wrapperClassName, w -> contentClassName

import Link from 'next/link'; // NOTE: module id: 522016
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import SlideText from '@/components/animations/SlideText'; // NOTE: module id: 991642
import { useTransitionClick } from '@/hooks/useTransitionClick'; // NOTE: module id: 995289

export const NAV_SURFACE =
  'pointer-events-none relative inline-flex items-center px-12 py-6 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) group-hover:bg-foreground/[0.06] group-data-[active=true]:bg-foreground/[0.06]';

// NOTE: module id: 520237
export default function NavLink({
  href,
  children,
  className,
  onMouseEnter,
  onClick,
  active = false,
  icon,
  as,
  inline = false,
  showIndicator = false,
  variant,
  ...props
}) {
  const handleTransitionClick = useTransitionClick(href, { onClick });
  const Component = as || Link;
  const isDefaultLink = Component === Link;

  if (variant === 'text') {
    return (
      <Component
        {...(isDefaultLink ? { href, onClick: handleTransitionClick } : {})}
        onMouseEnter={onMouseEnter}
        className={cn(
          'text-foreground underline decoration-foreground/30 underline-offset-[3px] transition-[text-decoration-color] duration-200 hover:decoration-foreground',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }

  if (variant === 'nav') {
    return (
      <Component
        {...(isDefaultLink ? { href, onClick: handleTransitionClick } : {})}
        onMouseEnter={onMouseEnter}
        data-active={active ? 'true' : undefined}
        className={cn(
          'group relative inline-flex w-fit items-center',
          'transition-transform duration-(--duration-quick) ease-(--ease-back-out)',
          'hover:scale-[0.95] data-[active=true]:scale-[0.95]',
          className
        )}
        {...props}
      >
        <span className={NAV_SURFACE}>
          <SlideText>{children}</SlideText>
          {icon ? (
            <span
              aria-hidden="true"
              className="ml-[0.5em] inline-flex shrink-0 items-center"
            >
              {icon}
            </span>
          ) : null}
        </span>
      </Component>
    );
  }

  const wrapperClassName = inline
    ? cn(
        'group relative inline-flex items-baseline align-baseline',
        'transition-[padding-left,color] duration-500 ease-power3-out',
        showIndicator ? 'pl-[1.4em]' : 'pl-0',
        'hover:pl-[1.4em] data-[active=true]:pl-[1.4em]',
        className
      )
    : cn('group relative inline-flex w-fit items-center', className);

  const contentClassName = inline
    ? 'pointer-events-none inline-flex items-center'
    : cn(
        'pointer-events-none inline-flex items-center transition-transform duration-500 ease-power3-out',
        showIndicator && 'translate-x-[1.5em]',
        'group-hover:translate-x-[1.5em]',
        'group-data-[active=true]:translate-x-[1.5em]'
      );

  return (
    <Component
      {...(isDefaultLink ? { href, onClick: handleTransitionClick } : {})}
      onMouseEnter={onMouseEnter}
      data-active={active ? 'true' : undefined}
      className={wrapperClassName}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 my-auto size-[0.75em] -translate-y-[0.05em] bg-brand',
          inline ? 'left-[0.25em]' : 'left-0',
          showIndicator ? 'rotate-0 scale-100' : '-rotate-90 scale-0',
          'transition-transform duration-500 ease-out-back',
          'group-hover:rotate-0 group-hover:scale-100',
          'group-data-[active=true]:rotate-0 group-data-[active=true]:scale-100'
        )}
      />
      <span className={contentClassName}>
        <span>{children}</span>
        {icon ? (
          <span
            aria-hidden="true"
            className="ml-[0.5em] inline-flex shrink-0 items-center"
          >
            {icon}
          </span>
        ) : null}
      </span>
    </Component>
  );
}
