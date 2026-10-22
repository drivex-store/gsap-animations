'use client';

// Variable Mapping: w -> MARQUEE_ITEMS, y -> HeaderMarquee, e -> scrolled, i -> shiftY, s -> trackRef, o -> animStateRef, l -> containerRef, a -> scrolledRef, c -> isIntersectingRef, h -> syncPlayback, d -> tweenPlaybackRate

import { Fragment, useRef, useEffect } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import { isOfferActive } from '@/features/pricing/utils/packSlugs'; // NOTE: module id: 825740
import TransitionLink from '@/components/navigation/TransitionLink'; // NOTE: module id: 101836

const MARQUEE_ITEMS = [
  {
    label: t('common.header.marquee.label'),
    href: '/pricing',
    offer: true,
  },
  {
    label: t('common.header.marquee.labelMenuKit'),
    href: '/kits/menu',
    square: true,
  },
];

// NOTE: module id: 76624
export default function HeaderMarquee({ scrolled = false, shiftY = 0 }) {
  const trackRef = useRef(null);
  const animStateRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const root = document.documentElement;
    const updateHeightVar = () => {
      root.style.setProperty('--anm-marquee-h', `${container.offsetHeight}px`);
    };

    updateHeightVar();
    const observer = new ResizeObserver(updateHeightVar);
    observer.observe(container);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--anm-marquee-h');
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const getKeyframes = () => [{ transform: 'translateX(0px)' }, { transform: `translateX(${-track.scrollWidth / 2}px)` }];

    const anim = track.animate(getKeyframes(), {
      duration: 150000,
      iterations: Infinity,
      easing: 'linear',
    });

    const observer = new ResizeObserver(() => {
      anim.effect.setKeyframes(getKeyframes());
    });

    observer.observe(track);
    animStateRef.current = {
      anim,
      rate: 1,
    };

    return () => {
      observer.disconnect();
      gsap.killTweensOf(animStateRef.current);
      anim.cancel();
      animStateRef.current = null;
    };
  }, []);

  const scrolledRef = useRef(scrolled);
  const isIntersectingRef = useRef(true);

  const syncPlayback = () => {
    const anim = animStateRef.current?.anim;
    if (anim) {
      if (scrolledRef.current && isIntersectingRef.current) {
        anim.play();
      } else {
        anim.pause();
      }
    }
  };

  useEffect(() => {
    scrolledRef.current = scrolled;
    syncPlayback();
  }, [scrolled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(([entry]) => {
      isIntersectingRef.current = entry.isIntersecting;
      syncPlayback();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const tweenPlaybackRate = (targetRate) => {
    const state = animStateRef.current;
    if (state) {
      gsap.to(state, {
        rate: targetRate,
        duration: targetRate === 0 ? 0.6 : 0.9,
        ease: 'power3.out',
        overwrite: true,
        onUpdate: () => {
          state.anim.playbackRate = state.rate;
        },
      });
    }
  };

  return (
    <div
      data-visible={scrolled}
      aria-hidden={!scrolled}
      className="invisible absolute inset-x-0 top-full z-[290] hidden opacity-0 transition-[opacity,visibility] duration-(--duration-quick) ease-(--ease-power3-out) data-[visible=true]:visible data-[visible=true]:opacity-100 lg:block">
      <div
        style={{ transform: `translateY(${shiftY}px)` }}
        className="transition-transform duration-(--duration-snap) ease-(--ease-expo-out)">
        <div className="mx-auto w-[calc(100%-2*var(--v2-header-pad,0px))] max-w-[calc(var(--v2-max,1920px)-2*var(--v2-header-pad,0px))] transition-[width,max-width] duration-(--duration-quick) ease-(--ease-power3-out)">
          <div
            ref={containerRef}
            onMouseEnter={() => tweenPlaybackRate(0)}
            onMouseLeave={() => tweenPlaybackRate(1)}
            className="overflow-hidden border-y border-foreground/10 bg-background-muted text-foreground">
            <div ref={trackRef} className="flex w-max items-center">
              {Array.from({ length: 20 }).map((_, repeatIndex) => {
                const isFirstCopy = repeatIndex === 0;
                return (
                  <Fragment key={repeatIndex}>
                    {MARQUEE_ITEMS.filter((item) => !item.offer || isOfferActive()).map((item, itemIndex) => (
                      <Fragment key={itemIndex}>
                        <TransitionLink
                          href={item.href}
                          aria-hidden={!isFirstCopy || undefined}
                          tabIndex={isFirstCopy ? undefined : -1}
                          className="text-mono-sm inline-flex items-center gap-10 whitespace-nowrap px-32 py-8 transition-colors duration-(--duration-quick) hover:text-brand">
                          {item.square ? <span aria-hidden="true" className="size-8 shrink-0 bg-brand" /> : null}
                          {item.label}
                        </TransitionLink>
                        <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-foreground/30" />
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
