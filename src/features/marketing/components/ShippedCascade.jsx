'use client';

import React, { useRef, useMemo } from 'react';
import { gsap, useGSAP } from '@/libs/utils/vendor';
import { CustomEase } from 'gsap/CustomEase';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useTransitionRouter } from '@/providers/contexts/RouterContext';
import { t } from '@/libs/utils/i18n';
import AnimatedHeading from '@/components/animations/AnimatedHeading';
import AnimatedText from '@/components/animations/AnimatedText';

const ANIMATED_TEXT_PROPS = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: {
    yPercent: 100
  }
};

gsap.registerPlugin(CustomEase);
CustomEase.create("annnimateInOut", "M0,0 C0.7,0 0.16,1 1,1");

const EASE_NAME = "annnimateInOut";
const ASPECT_RATIO = 1280 / 804;
const TILT_TAN = Math.tan((15 * Math.PI) / 180);
const BASE_OVERLAY_CLASSES = "absolute inset-0 origin-top-left will-change-transform";

const mathCurveHelper = (val) => (0.89 * (1 - Math.pow(0.89, val))) / 0.10999999999999999;

export function CascadeSlider({
  items = [],
  fill = false,
  className = ""
}) {
  const containerRef = useRef(null);
  const gapSize = fill ? 24 : 80;
  
  const itemRefs = useRef([]);
  const bgScaleRefs = useRef([]);
  const textRefs = useRef([]);
  const shadowRefs = useRef([]);
  
  const customValuesRef = useRef([]);
  
  const renderFnRef = useRef(() => {});
  const handleActiveFnRef = useRef(() => {});
  const stateRef = useRef({ offset: 0, w: 480, active: -1 });
  
  const router = useTransitionRouter();
  
  const displayItems = useMemo(() => {
    const arr = [];
    while (items.length && arr.length < 20) {
      arr.push(...items);
    }
    return arr;
  }, [items]);

  useGSAP(() => {
    const s = stateRef.current;
    const totalItems = displayItems.length;
    s.active = -1;
    
    gsap.set(textRefs.current.filter(Boolean), { yPercent: 100 });
    
    customValuesRef.current = Array.from({ length: totalItems }, () => ({ v: 0 }));

    const calcDimensions = () => {
      const el = containerRef.current;
      if (!el) return;
      
      const maxH = fill ? (el.clientHeight - 2 * (48 + gapSize + 40 + 48)) * ASPECT_RATIO : Infinity;
      s.w = Math.max(280, Math.min(0.4 * el.clientWidth, 640, maxH));
      
      const winW = window.innerWidth;
      s.peek = Math.min(0.5, Math.max(0.18, ((0.6 * winW) / s.w - 0.5) / mathCurveHelper(Math.min(8, Math.max(3, Math.round(winW / 360))))));
      
      el.style.setProperty("--ss-w", `${s.w}px`);
      el.style.setProperty("--ss-h", `${s.w / ASPECT_RATIO}px`);
    };

    const animateActiveItem = (idx, isActive) => {
      const targetObj = customValuesRef.current[idx];
      const textEl = textRefs.current[idx];
      if (!targetObj || !textEl) return;
      
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = 0.6 * (!prefersReducedMotion ? 1 : 0);
      
      gsap.to(targetObj, {
        v: 32 * (isActive ? 1 : 0),
        duration: duration,
        ease: EASE_NAME,
        overwrite: true,
        onUpdate: () => renderFnRef.current()
      });
      
      gsap.to(textEl, {
        yPercent: 100 * (isActive ? 0 : 1),
        duration: isActive ? duration : 0.6 * duration,
        delay: isActive ? 0.25 * duration : 0,
        ease: EASE_NAME,
        overwrite: true
      });
    };

    const renderLayout = () => {
      const { w, offset, peek } = s;
      
      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        
        const dist = gsap.utils.wrap(-totalItems / 2, totalItems / 2, idx - offset);
        const absDist = Math.abs(dist);
        
        const pxOffset = Math.sign(dist) * (0.5 + peek * mathCurveHelper(absDist) - Math.pow(0.89, absDist) / 2) * w;
        const scale = Math.pow(0.89, absDist);
        const rotate = 0.5 * Math.sign(dist) * (15 * (1 - Math.pow(0.7, absDist)));
        
        el.style.transform = `translate(-50%, -50%) translate(${pxOffset}px, ${pxOffset * TILT_TAN}px) rotate(${rotate}deg) scale(${scale})`;
        el.style.zIndex = String(100 - Math.round(10 * absDist));
        
        const spread = 16 * Math.pow(0.55, absDist);
        const h = w / ASPECT_RATIO;
        const bgTransform = `translate(${-spread}px, ${-spread}px) scale(${(w + 2 * spread) / w}, ${(h + 2 * spread + (customValuesRef.current[idx]?.v || 0)) / h})`;
        
        const bgEl = bgScaleRefs.current[idx];
        if (bgEl) bgEl.style.transform = bgTransform;
        
        const shadowEl = shadowRefs.current[idx];
        if (shadowEl) {
          shadowEl.style.transform = bgTransform;
          shadowEl.style.opacity = Math.min(1, absDist < 1 ? 0.3 * absDist : 0.2 + 0.1 * absDist);
        }
      });
    };

    handleActiveFnRef.current = (forceRender, currOffset = s.offset) => {
      if (!forceRender) {
        animateActiveItem(s.active, false);
        s.active = -1;
        return;
      }
      const centerIdx = gsap.utils.wrap(0, totalItems, Math.round(currOffset));
      if (centerIdx !== s.active) {
        animateActiveItem(s.active, false);
        animateActiveItem(centerIdx, true);
        s.active = centerIdx;
      }
    };

    renderFnRef.current = renderLayout;
    
    calcDimensions();
    renderLayout();
    handleActiveFnRef.current(true);

    const resizeObs = new ResizeObserver(() => {
      calcDimensions();
      renderLayout();
    });
    resizeObs.observe(containerRef.current);
    
    return () => resizeObs.disconnect();
  }, { scope: containerRef, dependencies: [displayItems.length] });

  const tweenToOffset = (targetOffset, duration = 0.7, easeStr = EASE_NAME) => {
    let triggeredActive = false;
    stateRef.current.target = targetOffset;
    
    const tween = gsap.to(stateRef.current, {
      offset: targetOffset,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration,
      ease: easeStr,
      overwrite: true,
      onUpdate: () => {
        renderFnRef.current();
        if (!triggeredActive && tween.progress() >= 0.3) {
          triggeredActive = true;
          handleActiveFnRef.current(true, targetOffset);
        }
      },
      onComplete: () => handleActiveFnRef.current(true)
    });
    return tween;
  };

  const dragState = useRef({
    on: false,
    moved: false,
    x: 0,
    start: 0,
    v: 0,
    lastX: 0,
    lastT: 0
  });

  const getDragSensitivity = () => 1 / (0.3 * stateRef.current.w * 1.6);

  const handleDragRelease = () => {
    const ds = dragState.current;
    if (!ds.on) return;
    ds.on = false;
    if (!ds.moved) return;
    
    const velocity = performance.now() - ds.lastT < 80 ? ds.v : 0;
    const target = Math.round(stateRef.current.offset + 450 * velocity);
    const diff = Math.abs(target - stateRef.current.offset);
    
    tweenToOffset(target, gsap.utils.clamp(0.5, 1.4, 0.45 + 0.25 * diff), "expo.out");
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        const now = performance.now();
        dragState.current = {
          on: true,
          moved: false,
          x: e.clientX,
          start: stateRef.current.offset,
          v: 0,
          lastX: e.clientX,
          lastT: now
        };
        gsap.killTweensOf(stateRef.current);
      }}
      onPointerMove={(e) => {
        const ds = dragState.current;
        if (!ds.on) return;
        
        if (!ds.moved && Math.abs(e.clientX - ds.x) > 4) {
          ds.moved = true;
          handleActiveFnRef.current(false);
        }
        
        stateRef.current.offset = ds.start - (e.clientX - ds.x) * getDragSensitivity();
        
        const now = performance.now();
        const vRaw = -(e.clientX - ds.lastX) * getDragSensitivity() / Math.max(1, now - ds.lastT);
        ds.v = 0.6 * ds.v + 0.4 * vRaw;
        ds.lastX = e.clientX;
        ds.lastT = now;
        
        renderFnRef.current();
      }}
      onPointerUp={handleDragRelease}
      onPointerLeave={handleDragRelease}
      style={fill ? { "--ss-gap": `${gapSize}px` } : undefined}
      className={`relative w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${fill ? "h-full" : "h-[calc(var(--ss-h)_+_240px)] [--ss-gap:32px] lg:h-[calc(var(--ss-h)_+_336px)] lg:[--ss-gap:80px]"} ${className}`}
    >
      {}
      {displayItems.map((item, idx) => (
        <a
          key={`${item.slug}-${idx}`}
          ref={(el) => (itemRefs.current[idx] = el)}
          href={`/animations/${item.slug}`}
          aria-label={item.title}
          draggable={false}
          onClick={(e) => {
            e.preventDefault();
            if (dragState.current.moved) return;
            
            const s = stateRef.current;
            const dist = gsap.utils.wrap(-displayItems.length / 2, displayItems.length / 2, idx - s.offset);
            const targetUrl = `/animations/${displayItems[idx].slug}`;
            
            if (Math.abs(dist) < 0.5) {
              if (router) {
                router.push(targetUrl);
              } else {
                window.location.href = targetUrl;
              }
            } else {
              handleActiveFnRef.current(false);
              tweenToOffset(Math.round(s.offset + dist));
            }
          }}
          className="absolute top-1/2 left-1/2 block h-(--ss-h) w-(--ss-w) will-change-transform"
        >
          {}
          <span ref={(el) => (bgScaleRefs.current[idx] = el)} className={`${BASE_OVERLAY_CLASSES} bg-surface`} />
          
          {}
          <span className="absolute inset-0 overflow-hidden bg-surface">
            <img
              src={item.image}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 object-cover"
              style={{ width: "100%", height: "100%" }}
            />
          </span>
          
          {}
          <span ref={(el) => (shadowRefs.current[idx] = el)} className={`${BASE_OVERLAY_CLASSES} pointer-events-none bg-black opacity-0`} />
          
          {}
          <span className="absolute top-full right-0 left-0 flex h-48 items-center">
            <span className="block min-w-0 overflow-hidden">
              <span ref={(el) => (textRefs.current[idx] = el)} className="text-body-sm block truncate font-medium">
                {item.title}
              </span>
            </span>
          </span>
        </a>
      ))}

      {}
      <div className="absolute top-[calc(50%_+_var(--ss-h)/2_+_48px_+_var(--ss-gap))] right-0 left-0 z-[200] flex items-center justify-center gap-8">
        {[
          { dir: -1, label: "Previous", Icon: CaretLeft },
          { dir: 1, label: "Next", Icon: CaretRight }
        ].map(({ dir, label, Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            onClick={() => {
              handleActiveFnRef.current(false);
              const s = stateRef.current;
              const currentVal = gsap.isTweening(s) ? (s.target ?? Math.round(s.offset)) : Math.round(s.offset);
              tweenToOffset(currentVal + dir);
            }}
            className="inline-flex size-40 cursor-pointer items-center justify-center bg-surface text-foreground transition-[background-color,scale] duration-200 ease-(--ease-expo-out) hover:bg-surface/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/60 active:scale-90"
          >
            <Icon className="size-16" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ShippedSection({
  items = [],
  count = 0,
  headline,
  line,
  theme = "dark"
}) {
  return (
    <section data-theme={theme} className="overflow-hidden bg-background py-64 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-16">
        <AnimatedHeading as="h2" sizeClass="text-h2" className="font-medium text-balance" trigger="scroll">
          {headline ?? t("home-v3.shipped.headline")}
        </AnimatedHeading>
        
        <AnimatedText
          tag="p"
          className="text-body-lg max-w-[40rem] text-foreground-muted"
          {...ANIMATED_TEXT_PROPS}
          triggerMode="scroll"
          delay={0.25}
        >
          {line ?? t("home-v3.shipped.line", { count })}
        </AnimatedText>
      </div>
      
      <div className="v2-container">
        <CascadeSlider items={items} className="mt-32 lg:mt-176" />
      </div>
    </section>
  );
}
