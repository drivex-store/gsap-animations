'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Info } from 'lucide-react';

import { t } from '@/libs/utils/i18n';
import { getPppDiscountPercent } from '@/features/pricing/utils/pppKitPricing';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip'; // module id: 672706

import { usePppGeo } from '@/hooks/usePppGeo'; // module id: 12895

function getCountryName(countryCode) {
  if (!countryCode) {
    return null;
  }

  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) || null;
  } catch {
    return null;
  }
}

function CountryFlag({ code, size = 20, className = '' }) {
  const normalizedCode = typeof code === 'string' && /^[A-Za-z]{2}$/.test(code) ? code.toLowerCase() : null;

  if (!normalizedCode) {
    return null;
  }

  const height = Math.round(0.75 * size);
  const upperCode = normalizedCode.toUpperCase();

  return (
    <img
      src={`https://flagcdn.com/w40/${normalizedCode}.png`}
      srcSet={`https://flagcdn.com/w80/${normalizedCode}.png 2x`}
      width={size}
      height={height}
      alt={getCountryName(upperCode) || upperCode}
      loading="lazy"
      decoding="async"
      style={{ width: size, height }}
      className={`inline-block shrink-0 border border-foreground/10 object-cover align-middle ${className}`}
    />
  );
}

function usePppNotice() {
  const geo = usePppGeo();

  if (!geo?.tier) {
    return null;
  }

  const countryName = getCountryName(geo.country);

  return countryName ? t('pricing.tiers.pppNotice', { country: countryName }) : t('pricing.tiers.pppNoticeGeneric');
}

function scrollToPricing(pathname) {
  const targetElement = document.querySelector(pathname === '/pricing' ? '#pricing-tiers' : '#pricing');

  if (!targetElement) {
    return;
  }

  const scrollOffset = -(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--v2-header-h')) || 72) - 24;

  if (window.lenis?.scrollTo) {
    window.lenis.scrollTo(targetElement, { offset: scrollOffset });
  } else {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}

export function PppLabel({ className = '', tone = 'dark' }) {
  const noticeText = usePppNotice();
  const geo = usePppGeo();

  if (!noticeText) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={`text-mono-sm inline-flex items-center gap-6 text-brand ${className}`}>
            <CountryFlag code={geo?.country} size={16} />
            {t('pricing.tiers.pppName')}
            <Info size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={10}
          className={
            tone === 'light'
              ? 'w-[320px] max-w-[90vw] border border-foreground/10 bg-background p-16 text-foreground'
              : 'w-[320px] max-w-[90vw] border-0 bg-foreground p-16 text-background'
          }>
          <p className={`text-mono-sm m-0 flex items-center gap-8 ${tone === 'light' ? 'text-foreground' : 'text-background'}`}>
            <CountryFlag code={geo?.country} size={16} />
            {getCountryName(geo?.country)
              ? t('pricing.tiers.pppTipTitle', {
                  country: getCountryName(geo.country),
                })
              : t('pricing.tiers.pppName')}
            <span className="ml-auto whitespace-nowrap text-brand">
              {t('pricing.tiers.pppTipPct', {
                pct: getPppDiscountPercent(geo?.tier),
              })}
            </span>
          </p>
          <p
            className={`text-body-sm mt-8 font-sans normal-case leading-relaxed ${
              tone === 'light' ? 'text-foreground-muted' : 'text-background/75'
            }`}>
            {noticeText}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PppStrip() {
  const geo = usePppGeo();
  const pathname = usePathname();
  const bannerRef = useRef(null);
  const [theme, setTheme] = useState('dark');
  const isVisible = (pathname === '/' || pathname === '/pricing') && !!geo?.tier;

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const themedElement = document.querySelector('main [data-theme]');
    setTheme(themedElement?.dataset.theme === 'dark' ? 'light' : 'dark');
  }, [isVisible, pathname]);

  useEffect(() => {
    const rootElement = document.documentElement;
    const bannerElement = bannerRef.current;

    if (!isVisible || !bannerElement) {
      rootElement.style.removeProperty('--anm-ppp-offset');
      return;
    }

    let rafId = 0;
    let bannerHeight = bannerElement.offsetHeight;
    let scrollY = window.scrollY || 0;
    let lastOffset = null;

    const updateOffset = () => {
      rafId = 0;
      const nextOffset = Math.max(0, bannerHeight - scrollY);
      if (nextOffset !== lastOffset) {
        lastOffset = nextOffset;
        rootElement.style.setProperty('--anm-ppp-offset', `${nextOffset}px`);
      }
    };

    const handleScrollOrResize = () => {
      scrollY = window.scrollY || 0;
      if (!rafId) {
        rafId = requestAnimationFrame(updateOffset);
      }
    };

    updateOffset();
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            bannerHeight = bannerElement.offsetHeight;
            handleScrollOrResize();
          })
        : null;

    resizeObserver?.observe(bannerElement);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
      resizeObserver?.disconnect();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rootElement.style.removeProperty('--anm-ppp-offset');
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const countryName = getCountryName(geo.country);
  const discountPercent = getPppDiscountPercent(geo.tier);

  return (
    <div ref={bannerRef} data-testid="ppp-banner" data-theme={theme} className="relative z-[301] w-full bg-background text-foreground">
      <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-4 px-16 py-10 text-center">
        <p className="text-mono-sm m-0 inline-flex items-center gap-10">
          <CountryFlag code={geo.country} size={20} />
          {countryName ? t('pricing.tiers.pppBanner', { country: countryName }) : t('pricing.tiers.pppName')}
        </p>
        <p className="text-body-sm m-0 text-foreground-muted">{t('pricing.tiers.pppBannerBody', { pct: discountPercent })}</p>
        <button
          type="button"
          onClick={() => scrollToPricing(pathname)}
          className="text-mono-sm text-foreground underline underline-offset-4 transition-colors duration-(--duration-quick) hover:text-brand">
          {t('pricing.tiers.pppBannerCta')}
        </button>
      </div>
    </div>
  );
}

export default function PppNotice({ className = '', align = 'center' }) {
  const noticeText = usePppNotice();
  const geo = usePppGeo();

  if (!noticeText) {
    return null;
  }

  return (
    <aside className={`flex ${align === 'start' ? 'justify-start' : 'justify-center'} ${className}`}>
      <div className="flex max-w-[560px] flex-col gap-8 border border-foreground/10 bg-surface px-20 py-16">
        <p className="text-mono-sm flex items-center gap-8 text-brand">
          <span aria-hidden="true" className="inline-block size-8 bg-brand" />
          {t('pricing.tiers.pppName')}
          <CountryFlag code={geo?.country} size={16} />
        </p>
        <p className="text-body-sm text-foreground-muted">{noticeText}</p>
      </div>
    </aside>
  );
}
