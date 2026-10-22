'use client';

// NOTE: module id: 73062
// Variable Mapping: r -> React, t -> ReactHooks, n -> gsap, a -> BunnyUtils
// Variable Mapping (Grid config): l -> DEFAULT_LAYOUT, s -> BackgroundGrid component
// Variable Mapping (Props): e -> images, s -> className, i -> cursorRef, o -> layout, c -> entrance, u -> driftVx, d -> driftVy
// Variable Mapping (Refs & State): m -> resolvedLayout, h -> containerRef, x -> wrapperRef, g -> cardsRef, p -> positionRef, C -> dragStateRef, v -> viewportSizeRef, b -> autoScrollRef, j -> rafIdRef, w -> lastTimeRef, y -> isVisibleRef, k -> hasRevealedRef
// Variable Mapping (Methods): N -> gridItems, L -> setCardRef, H -> revealAnimation

import React, { forwardRef, useMemo, useRef, useCallback, useImperativeHandle, useEffect } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl'; // NOTE: module id: 632021

const DEFAULT_LAYOUT = {
  cardW: 320,
  cardH: 180,
  gap: 48,
  cols: 6,
  rowCount: 6,
  offsetX: 184
};

const ImageCarousel = forwardRef(function ImageCarousel(
  {
    images,
    className = '',
    cursorRef = null,
    layout = null,
    entrance = null,
    driftVx = -28,
    driftVy = -14
  },
  ref
) {
  const resolvedLayout = useMemo(
    () => ({
      ...DEFAULT_LAYOUT,
      ...(layout || {})
    }),
    [layout]
  );

  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const cardsRef = useRef([]);
  
  const positionRef = useRef({
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 }
  });

  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0
  });

  const viewportSizeRef = useRef({
    w: 0,
    h: 0
  });

  const autoScrollRef = useRef({
    enabled: true,
    vx: driftVx,
    vy: driftVy
  });

  autoScrollRef.current.vx = driftVx;
  autoScrollRef.current.vy = driftVy;

  const rafIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isVisibleRef = useRef(true);
  const hasRevealedRef = useRef(false);

  const gridItems = useMemo(() => {
    const items = [];
    const cellW = resolvedLayout.cardW + resolvedLayout.gap;
    const cellH = resolvedLayout.cardH + resolvedLayout.gap;
    let imageIndex = 0;

    for (let row = 0; row < resolvedLayout.rowCount; row++) {
      const offsetX = row % 2 === 0 ? resolvedLayout.offsetX : 0;
      const startY = row * cellH;

      for (let col = 0; col < resolvedLayout.cols; col++) {
        const startX = offsetX + col * cellW;
        const currentImage = images[imageIndex % images.length];

        items.push({
          x: startX,
          y: startY,
          src: bunnyImageUrl(currentImage, { width: 640 })
        });
        imageIndex++;
      }
    }
    return items;
  }, [images, resolvedLayout]);

  const setCardRef = useCallback(
    (index) => (el) => {
      if (!el) return;
      if (!cardsRef.current[index]) {
        cardsRef.current[index] = {};
      }
      
      const card = cardsRef.current[index];
      card.el = el;
      card.img = el.querySelector('img');
      card.x = gridItems[index].x;
      card.y = gridItems[index].y;
      card.w = resolvedLayout.cardW;
      card.h = resolvedLayout.cardH;
      card.extraX = 0;
      card.extraY = 0;

      if (entrance === 'center-out' && !hasRevealedRef.current) {
        el.style.opacity = '0';
      }
    },
    [gridItems, resolvedLayout, entrance]
  );

  const revealAnimation = useCallback(() => {
    if (entrance !== 'center-out' || hasRevealedRef.current) return;
    
    hasRevealedRef.current = true;
    
    const viewport = viewportSizeRef.current;
    const centerX = viewport.w / 2;
    const centerY = viewport.h / 2;
    const pos = positionRef.current.current;

    cardsRef.current.forEach((card) => {
      if (!card?.el) return;
      
      const currentX = card.x + pos.x + (card.extraX || 0) + card.w / 2;
      const currentY = card.y + pos.y + (card.extraY || 0) + card.h / 2;
      
      const distance = Math.hypot(currentX - centerX, currentY - centerY);
      
      gsap.to(card.el, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.0016 * distance,
        overwrite: true
      });
    });
  }, [entrance]);

  useImperativeHandle(ref, () => ({
    reveal: revealAnimation
  }), [revealAnimation]);

  useEffect(() => {
    if (entrance !== 'center-out') return;
    const timeoutId = window.setTimeout(revealAnimation, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [entrance, revealAnimation]);

  useEffect(() => {
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!container || !wrapper) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    autoScrollRef.current.enabled = !prefersReducedMotion;

    const totalWidth = resolvedLayout.cols * (resolvedLayout.cardW + resolvedLayout.gap);
    const totalHeight = resolvedLayout.rowCount * (resolvedLayout.cardH + resolvedLayout.gap);

    const updateViewportSize = () => {
      const rect = container.getBoundingClientRect();
      viewportSizeRef.current.w = rect.width;
      viewportSizeRef.current.h = rect.height;
    };

    updateViewportSize();
    
    positionRef.current.current.x = positionRef.current.target.x = -(0.1 * viewportSizeRef.current.w);
    positionRef.current.current.y = positionRef.current.target.y = -(0.1 * viewportSizeRef.current.h);

    const observer = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: '200px' }
    );
    observer.observe(container);
    window.addEventListener('resize', updateViewportSize);

    const startDrag = (x, y) => {
      dragStateRef.current.active = true;
      dragStateRef.current.startX = x;
      dragStateRef.current.startY = y;
      dragStateRef.current.baseX = positionRef.current.target.x;
      dragStateRef.current.baseY = positionRef.current.target.y;
      
      wrapper.classList.add('is-dragging');
      
      if (!prefersReducedMotion) {
        cardsRef.current.forEach((card) => {
          if (card?.img) {
            gsap.to(card.img, {
              scale: 0.95,
              duration: 0.3,
              ease: 'expo.out',
              overwrite: true
            });
          }
        });
      }
    };

    const updateDrag = (x, y) => {
      if (dragStateRef.current.active) {
        positionRef.current.target.x = dragStateRef.current.baseX + (x - dragStateRef.current.startX);
        positionRef.current.target.y = dragStateRef.current.baseY + (y - dragStateRef.current.startY);
      }
    };

    const stopDrag = () => {
      if (dragStateRef.current.active) {
        dragStateRef.current.active = false;
        wrapper.classList.remove('is-dragging');
        
        cardsRef.current.forEach((card) => {
          if (card?.img) {
            gsap.to(card.img, {
              scale: 1,
              duration: 0.3,
              ease: 'expo.out',
              overwrite: true
            });
          }
        });
      }
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      }
    };

    const handleMouseMove = (e) => updateDrag(e.clientX, e.clientY);
    const handleMouseUp = () => stopDrag();

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      startDrag(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e) => {
      if (!dragStateRef.current.active) return;
      e.preventDefault();
      const touch = e.touches[0];
      updateDrag(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => stopDrag();

    wrapper.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd);

    const handlePointerEnter = () => cursorRef?.current?.setLabel?.('Drag');
    const handlePointerLeave = () => cursorRef?.current?.clearLabel?.();

    wrapper.addEventListener('pointerenter', handlePointerEnter);
    wrapper.addEventListener('pointerleave', handlePointerLeave);

    const animate = (time) => {
      rafIdRef.current = requestAnimationFrame(animate);
      
      if (!isVisibleRef.current) {
        lastTimeRef.current = time;
        return;
      }
      
      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;
      
      if (autoScrollRef.current.enabled && !dragStateRef.current.active && deltaTime > 0) {
        positionRef.current.target.x += autoScrollRef.current.vx * deltaTime;
        positionRef.current.target.y += autoScrollRef.current.vy * deltaTime;
      }
      
      const pos = positionRef.current;
      pos.current.x += (pos.target.x - pos.current.x) * 0.08;
      pos.current.y += (pos.target.y - pos.current.y) * 0.08;
      
      const viewport = viewportSizeRef.current;
      
      cardsRef.current.forEach((card) => {
        if (!card?.el) return;
        
        let targetX = card.x + pos.current.x + card.extraX;
        let targetY = card.y + pos.current.y + card.extraY;
        
        while (targetX + card.w < 0) {
          card.extraX += totalWidth;
          targetX += totalWidth;
        }
        while (targetX > viewport.w) {
          card.extraX -= totalWidth;
          targetX -= totalWidth;
        }
        
        while (targetY + card.h < 0) {
          card.extraY += totalHeight;
          targetY += totalHeight;
        }
        while (targetY > viewport.h) {
          card.extraY -= totalHeight;
          targetY -= totalHeight;
        }
        
        card.el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      });
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      observer.disconnect();
      window.removeEventListener('resize', updateViewportSize);
      
      wrapper.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
      
      wrapper.removeEventListener('pointerenter', handlePointerEnter);
      wrapper.removeEventListener('pointerleave', handlePointerLeave);
      cursorRef?.current?.clearLabel?.();
      
      cardsRef.current.forEach((card) => {
        if (card?.img) {
          gsap.killTweensOf(card.img);
        }
      });
    };
  }, [resolvedLayout]);

  return (
    <div
      ref={containerRef}
      className={`library-showcase relative h-full w-full overflow-hidden ${className}`.trim()}
      aria-hidden="true"
    >
      <div
        ref={wrapperRef}
        className="library-showcase-wrap absolute inset-0 cursor-grab select-none [&.is-dragging]:cursor-grabbing"
      >
        {gridItems.map((item, index) => (
          <div
            key={index}
            ref={setCardRef(index)}
            className="absolute left-0 top-0 will-change-transform"
            style={{
              width: `${resolvedLayout.cardW}px`,
              height: `${resolvedLayout.cardH}px`
            }}
          >
            <img
              src={item.src}
              alt=""
              loading="lazy"
              draggable="false"
              className="block object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

export default ImageCarousel;
