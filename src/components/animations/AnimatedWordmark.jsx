'use client';

import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

function LogoSvg({ width, height, strokeWidth = 26, ...restProps }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 255 129"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      {...restProps}
    >
      <path d="M13 129C13 105.252 32.0279 86 55.5 86C78.9721 86 98 105.252 98 129" />
      <path d="M13 129C13 89.7878 44.3401 58 83 58C121.66 58 153 89.7878 153 129" />
      <path d="M13 129C13 64.935 64.2634 13 127.5 13C190.737 13 242 64.935 242 129" />
    </svg>
  );
}

const AnimatedWordmark = forwardRef(function AnimatedWordmark(
  {
    className,
    strokeWidth = 26,
    fit = 'height',
    tone = 'default',
    playOnView = false,
    ...restProps
  },
  ref
) {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);

  const getPaths = () => {
    const container = containerRef.current;
    return {
      brand: Array.from(container?.querySelectorAll('[data-pass="brand"] path') || []),
      fg: Array.from(container?.querySelectorAll('[data-pass="fg"] path') || [])
    };
  };

  const setDashOffset = (paths) => {
    paths.forEach((path) => {
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length
      });
    });
  };

  const playAnimation = () => {
    const { brand, fg } = getPaths();
    if (!brand.length) return;

    timelineRef.current?.kill();

    setDashOffset(brand);
    setDashOffset(fg);

    const staggerConfig = { each: 0.1 };
    const timeline = gsap.timeline();

    timeline.to(
      brand,
      {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: 'expo.inOut',
        stagger: staggerConfig
      },
      0
    );

    timeline.to(
      fg,
      {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: 'expo.inOut',
        stagger: staggerConfig
      },
      0.12
    );

    timelineRef.current = timeline;
  };

  useImperativeHandle(ref, () => ({ play: playAnimation }), []);

  useGSAP(
    () => {
      const { brand, fg } = getPaths();
      [...brand, ...fg].forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: 0
        });
      });

      return () => timelineRef.current?.kill();
    },
    { scope: containerRef }
  );

  useEffect(() => {
    if (!playOnView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let isPrimed = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (isPrimed) {
            playAnimation();
          }
          isPrimed = false;
        } else if (entry.boundingClientRect.top > 0 && !isPrimed) {
          timelineRef.current?.kill();
          const { brand, fg } = getPaths();
          setDashOffset(brand);
          setDashOffset(fg);
          isPrimed = true;
        }
      },
      { rootMargin: '0px 0px -20% 0px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [playOnView]);

  const svgClassName = cn(
    'col-start-1 row-start-1',
    fit === 'width' ? 'h-auto w-full' : 'h-full w-auto'
  );
  const isMutedTone = tone === 'muted';

  return (
    <span
      ref={containerRef}
      className={cn('grid place-items-center', className)}
      {...restProps}
    >
      <LogoSvg
        data-pass="brand"
        strokeWidth={strokeWidth}
        className={cn(svgClassName, isMutedTone ? 'text-foreground' : 'text-brand')}
      />
      <LogoSvg
        data-pass="fg"
        strokeWidth={strokeWidth}
        className={cn(
          svgClassName,
          isMutedTone
            ? 'text-[color-mix(in_srgb,var(--foreground)_10%,var(--background))]'
            : 'text-foreground'
        )}
      />
    </span>
  );
});

export default AnimatedWordmark;
