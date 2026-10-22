'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { gsap } from '@/libs/utils/vendor';
import { useReveal } from '@/hooks/useReveal';
import { t } from '@/libs/utils/i18n'; // Assuming i18n utility
import { analytics } from '@/libs/auth/analytics'; // Assuming analytics utility
import { EXPOSURE_KEY, exposureProps } from '@/libs/configs/abTests';

// Sub Components
import AnimatedHeading from '@/components/animations/AnimatedHeading';
import AnimatedText from '@/components/animations/AnimatedText';
import StaggerContainer from '@/components/ui/StaggerContainer';
import AnimatedButton from '@/components/animations/AnimatedButton';
import ClientLogos from '@/components/ui/ClientLogos';
import GlassCarousel from '@/features/webgl/GlassCarousel';

import HeroGrid from '@/features/webgl/HeroGrid'; 

const ANIMATED_TEXT_PROPS = {
  type: "lines",
  mask: "lines",
  duration: 0.6,
  stagger: 0.03,
  ease: "power2.out",
  animationProps: { yPercent: 100 },
  triggerMode: "pageEnter"
};

export default function HomeHero({ items = [], freeCount = 0, variant = "slider", headline = "award" }) {
  const isGridVariant = variant === "grid";

  useEffect(() => {
    const exposureData = { hero: variant, headline: headline };
    try {
      window.sessionStorage.setItem(EXPOSURE_KEY, JSON.stringify(exposureData));
    } catch (e) {
      // ignore
    }
    analytics.register(exposureProps(exposureData));
    analytics.track("homepage_experiment_viewed", exposureProps(exposureData));
  }, [variant, headline]);

  const handleCtaClick = (ctaName) => () => {
    analytics.track("hero_cta_clicked", {
      cta: ctaName,
      ...exposureProps({ hero: variant, headline: headline })
    });
  };

  const sectionRef = useRef(null);
  const contentWrapperRef = useRef(null);
  const textContainerRef = useRef(null);
  const backgroundWrapperRef = useRef(null);
  const onIntroCompleteRef = useRef(null);

  const handleIntroReady = useCallback((playFn) => {
    onIntroCompleteRef.current = playFn;
  }, []);

  useReveal(sectionRef, {
    mode: "hero",
    build: () => {
      const contentEl = contentWrapperRef.current;
      
      const setInitialPosition = () => {
        const sectionRect = sectionRef.current.getBoundingClientRect();
        const textRect = textContainerRef.current.getBoundingClientRect();
        const currentY = Number(gsap.getProperty(contentEl, "y")) || 0;
        gsap.set(contentEl, {
          y: sectionRect.top + sectionRect.height / 2 - (textRect.top - currentY + textRect.height / 2)
        });
      };

      setInitialPosition();

      return gsap.timeline({ paused: true })
        .call(setInitialPosition, null, 0)
        .to(contentEl, { y: 0, duration: 1.1, ease: 'expo.out' }, 0.4) 
        .fromTo(backgroundWrapperRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" }, 0.4 + 0.55)
        .call(() => onIntroCompleteRef.current?.(), null, 0.4 + 0.55);
    }
  });

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className="relative flex h-svh min-h-[680px] flex-col overflow-hidden bg-background pt-112 text-foreground lg:pt-136"
    >
      {/* GRID VARIANT BACKGROUND */}
      {isGridVariant && (
        <div ref={backgroundWrapperRef} className="invisible absolute inset-0">
          <HeroGrid items={items} onIntro={handleIntroReady} glassRef={contentWrapperRef} />
        </div>
      )}

      {/* FOREGROUND CONTENT */}
      <div
        ref={contentWrapperRef}
        className={`v2-container relative z-10 shrink-0 text-center ${isGridVariant ? "pointer-events-none" : ""}`}
      >
        <div ref={textContainerRef}>
          <AnimatedHeading
            as="h1"
            sizeClass="text-h1"
            className="hero-headline mx-auto max-w-[22ch] font-medium text-balance"
            trigger="pageEnter"
          >
            {t(headline === "client" ? "home-v3.hero.headlineClient" : "home-v3.hero.headline")}
          </AnimatedHeading>
          
          <AnimatedText
            tag="p"
            className={`text-body-lg mx-auto mt-24 max-w-[46rem] ${isGridVariant ? "text-foreground-reading" : "text-foreground-muted"}`}
            {...ANIMATED_TEXT_PROPS}
            delay={0.4}
          >
            {t("home-v3.hero.sub")}
          </AnimatedText>

          <StaggerContainer
            className={`mt-32 flex flex-wrap items-center justify-center gap-12 ${isGridVariant ? "pointer-events-auto" : ""}`}
            delay={0.55}
          >
            <AnimatedButton href="/checkout?plan=solo&cycle=quarterly" theme="brand" onClick={handleCtaClick("get_access")}>
              {t("home-v3.hero.cta")}
            </AnimatedButton>
            <AnimatedButton href="/starter-pack" theme="surface" onClick={handleCtaClick("free_components")}>
              {t("home-v3.hero.ctaFree", { count: freeCount })}
            </AnimatedButton>
          </StaggerContainer>
        </div>

        <div className="mt-32 flex flex-wrap items-center justify-center gap-x-24 gap-y-12 lg:mt-40">
          <StaggerContainer as="p" className={`text-body-sm ${isGridVariant ? "text-foreground-reading" : "text-foreground-muted"}`} delay={0.7}>
            {t("home-v3.hero.logosLabel")}
          </StaggerContainer>
          <ClientLogos className="justify-center" trigger="pageEnter" delay={0.73} tone={isGridVariant ? "light" : "muted"} />
        </div>
      </div>

      {/* SLIDER VARIANT BACKGROUND */}
      {!isGridVariant && (
        <div ref={backgroundWrapperRef} className="invisible mt-16 min-h-0 flex-1 lg:mt-24">
          <GlassCarousel items={items} onIntro={handleIntroReady} />
        </div>
      )}
    </section>
  );
}
