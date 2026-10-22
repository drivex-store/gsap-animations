'use client';

import React, { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import gsap from 'gsap';

import { cn } from '@/libs/utils/className';

const TOOLTIP_CONTENT_CLASSES = 'z-50 overflow-hidden border border-foreground/10 bg-surface px-10 py-6 text-accent-xs text-foreground';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      TOOLTIP_CONTENT_CLASSES,
      'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

const SmartTooltipContext = createContext(null);

export function SmartTooltip({ children, content, id }) {
  const groupContext = useContext(SmartTooltipContext);
  const tooltipIdRef = useRef(id || `tooltip-${Math.random().toString(36).substr(2, 9)}`);
  const [triggerElement, setTriggerElement] = useState(null);

  const handleTriggerRef = useCallback((node) => {
    setTriggerElement(node);
  }, []);

  useEffect(() => {
    if (groupContext && triggerElement) {
      groupContext.registerTrigger(tooltipIdRef.current, triggerElement);
      return () => {
        groupContext.registerTrigger(tooltipIdRef.current, null);
      };
    }
  }, [groupContext, triggerElement]);

  if (groupContext) {
    return (
      <div
        ref={handleTriggerRef}
        onMouseEnter={() => groupContext.handleMouseEnter(tooltipIdRef.current, content)}
        onMouseLeave={() => groupContext.handleMouseLeave()}
        className="flex flex-1 min-w-0">
        {children}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SmartTooltipGroup({
  children,
  delayDuration = 300,
  flipDuration = 0.2,
  flipEase = 'power3.out',
  enterDuration = 0.25,
  enterEase = 'power3.out',
  exitDuration = 0.2,
  exitEase = 'power2.in',
  hideDelay = 100,
  flipThreshold = 800,
  side = 'top',
  sideOffset = 8,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipContent, setTooltipContent] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const tooltipRef = useRef(null);
  const triggersRef = useRef(new Map());
  const showTimeoutRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const lastHoverTimeRef = useRef(0);
  const isExitingRef = useRef(false);

  const calculatePosition = useCallback(
    (triggerElement) => {
      let top;
      let left;

      if (!triggerElement || !tooltipRef.current) {
        return { top: 0, left: 0 };
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      let resolvedSide = side;

      switch (side) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - sideOffset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          if (top < sideOffset) {
            resolvedSide = 'bottom';
            top = triggerRect.bottom + sideOffset;
          }
          break;
        case 'bottom':
          top = triggerRect.bottom + sideOffset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          if (top + tooltipRect.height > viewportHeight - sideOffset) {
            resolvedSide = 'top';
            top = triggerRect.top - tooltipRect.height - sideOffset;
          }
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left - tooltipRect.width - sideOffset;
          if (left < sideOffset) {
            resolvedSide = 'right';
            left = triggerRect.right + sideOffset;
          }
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + sideOffset;
          if (left + tooltipRect.width > viewportWidth - sideOffset) {
            resolvedSide = 'left';
            left = triggerRect.left - tooltipRect.width - sideOffset;
          }
          break;
        default:
          top = triggerRect.top - tooltipRect.height - sideOffset;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      }

      left = Math.max(sideOffset, Math.min(left, viewportWidth - tooltipRect.width - sideOffset));
      top = Math.max(sideOffset, Math.min(top, viewportHeight - tooltipRect.height - sideOffset));

      return {
        top,
        left,
        side: resolvedSide,
      };
    },
    [side, sideOffset],
  );

  const showTooltip = useCallback(
    (id, content) => {
      const now = Date.now();
      const timeSinceLastHover = now - lastHoverTimeRef.current;
      lastHoverTimeRef.current = now;

      const triggerElement = triggersRef.current.get(id);
      if (!triggerElement) {
        return;
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (isVisible && activeTooltip !== id && timeSinceLastHover < flipThreshold && tooltipRef.current) {
        setTooltipContent(content);
        setActiveTooltip(id);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!tooltipRef.current) {
              return;
            }
            const { top, left } = calculatePosition(triggerElement);
            gsap.to(tooltipRef.current, {
              x: left,
              y: top,
              duration: flipDuration,
              ease: flipEase,
            });
          });
        });
      } else {
        setTooltipContent(content);
        setActiveTooltip(id);
        setIsVisible(true);

        requestAnimationFrame(() => {
          if (!tooltipRef.current) {
            return;
          }
          const { top, left, side: resolvedSide } = calculatePosition(triggerElement);
          gsap.set(tooltipRef.current, { x: left, y: top });
          gsap.fromTo(
            tooltipRef.current,
            {
              opacity: 0,
              scale: 0.9,
              yPercent: resolvedSide === 'top' ? 5 : resolvedSide === 'bottom' ? -5 : 0,
            },
            {
              opacity: 1,
              scale: 1,
              yPercent: 0,
              duration: enterDuration,
              ease: enterEase,
            },
          );
        });
      }
    },
    [isVisible, activeTooltip, flipThreshold, flipDuration, flipEase, enterDuration, enterEase, calculatePosition],
  );

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current && !isExitingRef.current) {
      isExitingRef.current = true;
      gsap.to(tooltipRef.current, {
        opacity: 0,
        scale: 0.9,
        yPercent: side === 'top' ? 5 : side === 'bottom' ? -5 : 0,
        duration: exitDuration,
        ease: exitEase,
        onComplete: () => {
          setIsVisible(false);
          setActiveTooltip(null);
          isExitingRef.current = false;
        },
      });
    }
  }, [side, exitDuration, exitEase]);

  const registerTrigger = useCallback((id, element) => {
    if (element) {
      triggersRef.current.set(id, element);
    } else {
      triggersRef.current.delete(id);
    }
  }, []);

  const handleMouseEnter = useCallback(
    (id, content) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }

      if (isVisible) {
        showTooltip(id, content);
      } else {
        showTimeoutRef.current = setTimeout(() => {
          showTooltip(id, content);
          showTimeoutRef.current = null;
        }, delayDuration);
      }
    },
    [isVisible, delayDuration, showTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    hideTimeoutRef.current = setTimeout(() => {
      hideTooltip();
      hideTimeoutRef.current = null;
    }, hideDelay);
  }, [hideDelay, hideTooltip]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SmartTooltipContext.Provider
      value={{
        registerTrigger,
        handleMouseEnter,
        handleMouseLeave,
        activeTooltip,
      }}>
      {children}
      {isVisible && (
        <div ref={tooltipRef} className={cn('pointer-events-none fixed', TOOLTIP_CONTENT_CLASSES)} style={{ top: 0, left: 0, opacity: 0 }}>
          {tooltipContent}
        </div>
      )}
    </SmartTooltipContext.Provider>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
