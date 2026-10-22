'use client';

// Variable Mapping:
// c, u -> isVisible, setIsVisible
// d -> bannerRef
// p -> closeBanner
// e (closeBanner param) -> callback
// e (effect 1) -> consent
// t (effect 1) -> timer
// e (effect 2) -> handleConsentChanged

import { useState, useRef, useEffect } from 'react'; // NOTE: module id: 271645
import Link from 'next/link'; // NOTE: module id: 522016
import gsap from 'gsap'; // NOTE: module id: 989970
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import AnimatedButton from '@/components/animations/AnimatedButton'; // NOTE: module id: 687989
import { getConsent, acceptAll } from '@/libs/configs/acceptAll'; // NOTE: module id: 160725

// NOTE: module id: 632120
export default function CookieBanner({ onOpenPreferences }) {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    const consent = getConsent();
    if (consent && consent.method !== null) return;
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleConsentChanged = () => closeBanner();
    window.addEventListener("annnimate:consent-changed", handleConsentChanged);
    return () => window.removeEventListener("annnimate:consent-changed", handleConsentChanged);
  }, []);

  useGSAP(() => {
    if (isVisible && bannerRef.current) {
      gsap.fromTo(
        bannerRef.current,
        { y: 32, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out" }
      );
    }
  }, { dependencies: [isVisible] });

  const closeBanner = (callback) => {
    if (!bannerRef.current) {
      setIsVisible(false);
      callback?.();
      return;
    }
    
    gsap.to(bannerRef.current, {
      y: 32,
      autoAlpha: 0,
      duration: 0.4,
      ease: "expo.in",
      onComplete: () => {
        setIsVisible(false);
        callback?.();
      }
    });
  };

  return isVisible ? (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie preferences"
      aria-describedby="cookie-banner-body"
      className="fixed bottom-16 left-16 z-40 w-[calc(100vw-32px)] max-w-[320px] opacity-0"
      data-theme="dark"
    >
      <div className="flex flex-col gap-16 border border-foreground/15 bg-background p-16 text-foreground lg:p-20">
        <p id="cookie-banner-body" className="text-body-sm text-foreground-muted">
          Anonymous pageviews by default. Accept all for session recording and live chat.{" "}
          <Link
            href="/cookies"
            className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:decoration-foreground"
          >
            Learn more
          </Link>
        </p>
        <div className="flex gap-8">
          <AnimatedButton
            type="button"
            theme="light"
            size="xs"
            onClick={() => closeBanner(acceptAll)}
            className="flex-1"
          >
            Accept all
          </AnimatedButton>
          <AnimatedButton
            type="button"
            theme="surface"
            size="xs"
            onClick={() => closeBanner(onOpenPreferences)}
            className="flex-1"
          >
            Preferences
          </AnimatedButton>
        </div>
      </div>
    </div>
  ) : null;
}
