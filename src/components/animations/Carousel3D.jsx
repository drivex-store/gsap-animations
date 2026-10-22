'use client';

import React, { useRef, useEffect } from 'react'; // NOTE: module id: 271645
import { gsap } from '@/libs/utils/vendor'; // NOTE: module id: 989970
import TransitionLink from '@/components/navigation/TransitionLink'; // NOTE: module id: 101836

const ASPECT_RATIO = 1280 / 804;
function calcMetrics(containerWidth, containerHeight) {
  const w = Math.max(140, Math.min(0.24 * containerWidth, 0.6 * containerHeight * ASPECT_RATIO));
  return {
    w: w,
    h: w / ASPECT_RATIO,
    r: 1.9 * w, 
    p: 2.6 * w  
  };
}

// NOTE: module id: 260518
export default function Carousel3D({
  items = [],
  autoplay = true,
  speed = 0.22,
  className = ""
}) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  
  const repeatedItems = [];
  while (items.length && repeatedItems.length < 12) {
    repeatedItems.push(...items);
  }

  useEffect(() => {
    const container = containerRef.current;
    const validItems = itemRefs.current.filter(Boolean);
    
    if (!container || validItems.length === 0) return;
    
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let metrics = calcMetrics(container.offsetWidth, container.offsetHeight);
    let itemAngleStep = (metrics.w + 20) / metrics.r;
    let offset = 0;
    let velocity = 0;
    let isDragging = false;
    let hasDragged = false;
    let lastMouseX = 0;
    let lastTime = 0;
    let isActive = true;

    const updateMetrics = () => {
      metrics = calcMetrics(container.offsetWidth, container.offsetHeight);
      itemAngleStep = (metrics.w + 20) / metrics.r;
      container.style.setProperty("--cs-w", `${metrics.w}px`);
      container.style.setProperty("--cs-h", `${metrics.h}px`);
      container.style.perspective = `${metrics.p}px`;
    };
    
    updateMetrics();

    const renderItems = () => {
      const totalAngle = itemAngleStep * validItems.length;
      
      validItems.forEach((itemEl, idx) => {
        let rawAngle = idx * itemAngleStep + offset;
        rawAngle = gsap.utils.wrap(-totalAngle / 2, totalAngle / 2, rawAngle);
        
        const deg = (180 * rawAngle) / Math.PI;
        const absDeg = Math.abs(deg);
        
        const opacity = absDeg > 78 ? 0 : absDeg > 66 ? (78 - absDeg) / 12 : 1;
        
        itemEl.style.transform = `translate(-50%, -50%) translateZ(${metrics.r}px) rotateY(${-deg}deg) translateZ(${-metrics.r}px)`;
        itemEl.style.opacity = opacity;
        itemEl.style.visibility = opacity === 0 ? "hidden" : "visible";
        
        const video = itemEl.querySelector("video");
        if (video) {
          const shouldPlay = isActive && opacity > 0 && !prefersReducedMotion;
          if (shouldPlay && video.paused) {
            video.play().catch(() => {});
          } else if (!shouldPlay && !video.paused) {
            video.pause();
          }
        }
      });
    };

    const tick = (time, deltaTime) => {
      const frameRateFactor = deltaTime / (1000 / 60);
      
      if (!isDragging) {
        if (Math.abs(velocity) > 0.00002) {
          offset += velocity * frameRateFactor;
          velocity *= Math.pow(0.94, frameRateFactor);
        } else if (autoplay && !prefersReducedMotion) {
          offset += (speed * itemAngleStep) / 60 * frameRateFactor;
        }
      }
      renderItems();
    };

    const onPointerDown = (e) => {
      isDragging = true;
      hasDragged = false;
      velocity = 0;
      lastMouseX = e.clientX;
      lastTime = performance.now();
      container.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - lastMouseX;
      if (Math.abs(deltaX) > 2) {
        hasDragged = true;
      }
      
      const now = performance.now();
      const angleDelta = deltaX / metrics.r;
      
      offset += angleDelta;
      velocity = angleDelta / Math.max(1, now - lastTime) * (1000 / 60);
      lastMouseX = e.clientX;
      lastTime = now;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onClick = (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("click", onClick, true);

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isActive = entry.isIntersecting;
      if (isActive) {
        gsap.ticker.add(tick);
      } else {
        gsap.ticker.remove(tick);
        validItems.forEach((el) => el.querySelector("video")?.pause());
      }
    });
    
    intersectionObserver.observe(container);
    renderItems();

    return () => {
      gsap.ticker.remove(tick);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("click", onClick, true);
    };
  }, [repeatedItems.length, autoplay, speed]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-[320px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {repeatedItems.map((item, idx) => (
        <TransitionLink
          key={`${item.slug}-${idx}`}
          ref={(el) => (itemRefs.current[idx] = el)}
          href={`/animations/${item.slug}`}
          draggable={false}
          aria-label={item.title}
          className="absolute top-1/2 left-1/2 block h-(--cs-h) w-(--cs-w) overflow-hidden bg-surface text-left will-change-transform"
          style={{ backfaceVisibility: "hidden" }}
        >
          {item.video ? (
            <video
              src={item.video}
              poster={item.image}
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 block object-cover"
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <img
              src={item.image}
              alt=""
              draggable={false}
              className="absolute inset-0 block object-cover"
              style={{ width: "100%", height: "100%" }}
            />
          )}
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 px-10 pt-24 pb-8 lg:px-12 lg:pb-10"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
          >
            <span className="block text-[11px] font-medium leading-tight text-white lg:text-[12px]">
              {item.title}
            </span>
          </span>
        </TransitionLink>
      ))}
    </div>
  );
}
