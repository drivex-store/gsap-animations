'use client';

// Variable Mapping: N -> isPathActive, e -> latestAnimation, c -> pathname, h -> isStarterPackPage, u -> isV3Page, p -> hasAccess, b -> isAuthenticated, w -> loading, E -> headerRef, L -> barRef, T -> barContainerRef, R -> navRef, z -> dropdownRef, C -> dropdownInnerRef, A -> scrimRef, M -> groupRefs, _ -> intentTimeoutRef, O -> closeTimeoutRef, q -> lastScrollYRef, H -> activeMegaKey, I -> setActiveMegaKey, W -> activeMegaKeyRef, V -> isMobileMenuOpen, F -> setIsMobileMenuOpen, P -> expandedMobileKey, D -> setExpandedMobileKey, $ -> isDropdownOpen, B -> setIsDropdownOpen, U -> dropdownHeight, Y -> setDropdownHeight, X -> headerTheme, K -> scrollState, G -> padState, J -> hasSolidSurface, Q -> categories, Z -> navItems, ee -> megaNavItems, et -> prevMegaKeyRef, er -> clearTimers, ei -> scheduleClose, en -> pointerStateRef, es -> runWhenPointerSlows, eo -> handleNavItemEnter, el -> hasOpenedMega, ea -> setHasOpenedMega, ec -> alignMegaColumns

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from 'react'; // NOTE: module id: 271645
import { usePathname } from 'next/navigation'; // NOTE: module id: 618566
import { gsap } from 'gsap'; // NOTE: module id: 989970
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl'; // NOTE: module id: 632021
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import Logo from '@/components/layout/utils/HeaderLogo'; // NOTE: module id: 635566
import NavLink from '@/components/navigation/NavLink'; // NOTE: module id: 520237
import TransitionLink from '@/components/navigation/TransitionLink'; // NOTE: module id: 101836
import AnimatedButton from '@/components/animations/AnimatedButton'; // NOTE: module id: 687989
import { useCategories } from '@/providers/CategoryProvider'; // NOTE: module id: 87207
import { useUser } from '@/hooks/useUser';
import { useHeaderState } from '@/hooks/useHeaderState';
import HeaderNavTrigger from '@/components/layout/Header/HeaderNavTrigger';
import MobileNavAccordion from '@/components/layout/Header/MobileNavAccordion';
import HeaderMarquee from '@/components/layout/Header/HeaderMarquee';
import { HEADER_NAV_ITEMS } from '@/libs/configs/navConfig';

function isPathActive(pathname, targetHref) {
  if (!pathname || !targetHref) return false;
  const basePath = targetHref.split(/[?#]/)[0];
  if (!basePath.startsWith('/')) return false;
  return basePath === '/'
    ? pathname === '/'
    : pathname === basePath || pathname.startsWith(`${basePath}/`);
}

// NOTE: module id: 76624
export default function Header({ latestAnimation }) {
  const pathname = usePathname();
  const isStarterPackPage =
    pathname === '/starter-pack' || pathname === '/v3/starter-pack';
  const isV3Page = pathname === '/v3';

  const { hasAccess, isAuthenticated, loading } = useUser();

  const headerRef = useRef(null);
  const barRef = useRef(null);
  const barContainerRef = useRef(null);
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownInnerRef = useRef(null);
  const scrimRef = useRef(null);
  const groupRefs = useRef({});
  const intentTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const lastScrollYRef = useRef(0);

  const [activeMegaKey, setActiveMegaKey] = useState(null);
  const activeMegaKeyRef = useRef(null);
  activeMegaKeyRef.current = activeMegaKey;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileKey, setExpandedMobileKey] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownHeight, setDropdownHeight] = useState(0);

  const { headerTheme, scrollState } = useHeaderState(barRef);

  const padState =
    isDropdownOpen || isMobileMenuOpen
      ? 'open'
      : scrollState === 'scrolled'
        ? 'scrolled'
        : 'top';

  const hasSolidSurface =
    scrollState === 'scrolled' || isMobileMenuOpen || isDropdownOpen;

  const categories = useCategories();

  const navItems = useMemo(() => {
    const categoryLinks = categories.map((category) => ({
      label: category.name,
      href: `/animations?category=${category.slug}`,
    }));

    return HEADER_NAV_ITEMS.map((item) =>
      item.mega?.columns
        ? {
            ...item,
            mega: {
              ...item.mega,
              columns: item.mega.columns.map((column) => {
                const resolvedColumn =
                  column.dynamic === 'categories'
                    ? { ...column, links: categoryLinks }
                    : column;

                return isAuthenticated
                  ? resolvedColumn
                  : {
                      ...resolvedColumn,
                      links: resolvedColumn.links.filter(
                        (link) => link.href !== '/animations/saved'
                      ),
                    };
              }),
            },
          }
        : item
    );
  }, [categories, isAuthenticated]);

  const megaNavItems = useMemo(
    () => navItems.filter((item) => item.mega),
    [navItems]
  );

  const prevMegaKeyRef = useRef(null);

  useLayoutEffect(() => {
    const prevKey = prevMegaKeyRef.current;
    if (prevKey === activeMegaKey) return;
    prevMegaKeyRef.current = activeMegaKey;

    const dropdownInner = dropdownInnerRef.current;
    const dropdown = dropdownRef.current;
    const scrim = scrimRef.current;
    if (!dropdownInner || !dropdown) return;

    const allRevealTargets = [];
    megaNavItems.forEach((item) => {
      const groupEl = groupRefs.current[item.key];
      if (groupEl) {
        gsap.killTweensOf(groupEl);
        allRevealTargets.push(...groupEl.querySelectorAll('[data-mm-reveal]'));
      }
    });

    gsap.killTweensOf([dropdownInner, scrim, ...allRevealTargets]);

    if (activeMegaKey === null) {
      let didCloseEarly = false;
      const prevGroup = prevKey ? groupRefs.current[prevKey] : null;

      if (prevGroup) {
        gsap.to(prevGroup, {
          autoAlpha: 0,
          duration: 0.15,
          ease: 'power2.out',
        });
      }

      gsap.to(dropdownInner, {
        height: 0,
        duration: 0.3,
        ease: 'expo.out',
        onUpdate: function () {
          if (!didCloseEarly && this.ratio >= 0.9) {
            didCloseEarly = true;
            setIsDropdownOpen(false);
          }
        },
        onComplete: () => {
          gsap.set(dropdown, {
            visibility: 'hidden',
            pointerEvents: 'none',
          });
          megaNavItems.forEach((item) => {
            const groupEl = groupRefs.current[item.key];
            if (groupEl) {
              gsap.set(groupEl, {
                visibility: 'hidden',
                opacity: 0,
                x: 0,
                pointerEvents: 'none',
              });
            }
          });
          if (!didCloseEarly) {
            setIsDropdownOpen(false);
          }
        },
      });

      gsap.to(scrim, {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'expo.out',
      });
      return;
    }

    const activeGroup = groupRefs.current[activeMegaKey];
    if (!activeGroup) return;

    const isInitialOpen = prevKey === null;
    const prevGroup = isInitialOpen ? null : groupRefs.current[prevKey];
    const direction =
      megaNavItems.findIndex((item) => item.key === activeMegaKey) >=
      megaNavItems.findIndex((item) => item.key === prevKey)
        ? 1
        : -1;

    setIsDropdownOpen(true);

    megaNavItems.forEach((item) => {
      const groupEl = groupRefs.current[item.key];
      if (!groupEl || groupEl === prevGroup) return;
      const isCurrent = item.key === activeMegaKey;
      gsap.set(groupEl, {
        visibility: isCurrent ? 'visible' : 'hidden',
        opacity: +!!isCurrent,
        x: 0,
        pointerEvents: isCurrent ? 'auto' : 'none',
      });
    });

    gsap.set(dropdown, {
      visibility: 'visible',
      pointerEvents: 'auto',
    });

    gsap.to(dropdownInner, {
      height: activeGroup.offsetHeight,
      duration: isInitialOpen ? 0.45 : 0.4,
      ease: 'expo.out',
    });

    gsap.to(scrim, {
      autoAlpha: 1,
      duration: 0.4,
      ease: 'expo.out',
    });

    const revealItems = activeGroup.querySelectorAll('[data-mm-reveal]');

    if (isInitialOpen) {
      gsap.fromTo(
        revealItems,
        { y: 16, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.45,
          ease: 'expo.out',
          stagger: 0.04,
          delay: 0.04,
        }
      );
    } else {
      if (prevGroup) {
        gsap.set(prevGroup, { pointerEvents: 'none' });
        gsap.to(prevGroup, {
          autoAlpha: 0,
          x: -(16 * direction),
          duration: 0.2,
          ease: 'power2.out',
        });
      }

      gsap.fromTo(
        revealItems,
        { x: 24 * direction, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.4,
          ease: 'expo.out',
          stagger: 0.03,
          delay: 0.06,
        }
      );
    }
  }, [activeMegaKey, megaNavItems]);

  useEffect(() => {
    if (!activeMegaKey) {
      setDropdownHeight(0);
      return;
    }

    const rafId = requestAnimationFrame(() => {
      const activeGroup = groupRefs.current[activeMegaKey];
      setDropdownHeight(activeGroup ? activeGroup.offsetHeight : 0);
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeMegaKey]);

  const clearTimers = () => {
    clearTimeout(intentTimeoutRef.current);
    clearTimeout(closeTimeoutRef.current);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimeoutRef.current = setTimeout(() => setActiveMegaKey(null), 100);
  };

  const pointerStateRef = useRef({
    x: 0,
    y: 0,
    t: 0,
    v: 0,
  });

  useEffect(() => {
    const handlePointerMove = (event) => {
      const state = pointerStateRef.current;
      const now = performance.now();
      const dt = now - state.t;
      const instantaneousVelocity =
        dt > 0 && dt < 100
          ? Math.hypot(event.clientX - state.x, event.clientY - state.y) / dt
          : 0;

      state.v = 0.5 * state.v + 0.5 * instantaneousVelocity;
      state.x = event.clientX;
      state.y = event.clientY;
      state.t = now;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const runWhenPointerSlows = (callback, startTime = performance.now()) => {
    const state = pointerStateRef.current;
    const now = performance.now();

    if (now - state.t >= 45 || state.v < 0.35 || now - startTime >= 150) {
      callback();
    } else {
      intentTimeoutRef.current = setTimeout(
        () => runWhenPointerSlows(callback, startTime),
        45
      );
    }
  };

  const handleNavItemEnter = (item) => {
    clearTimers();
    if (item.mega) {
      if (activeMegaKey !== item.key) {
        runWhenPointerSlows(() => setActiveMegaKey(item.key));
      }
    } else if (activeMegaKey) {
      runWhenPointerSlows(() => setActiveMegaKey(null));
    }
  };

  const [hasOpenedMega, setHasOpenedMega] = useState(false);

  useEffect(() => {
    if (activeMegaKey) {
      setHasOpenedMega(true);
    }
  }, [activeMegaKey]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMegaKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setActiveMegaKey(null);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handlePageTransition = () => {
      clearTimeout(intentTimeoutRef.current);
      clearTimeout(closeTimeoutRef.current);
      setActiveMegaKey(null);
      setIsMobileMenuOpen(false);
      headerRef.current?.classList.remove('is-hidden');
      document.documentElement.classList.remove('v2-header-hidden');
      lastScrollYRef.current = 0;
    };

    window.addEventListener('anm:transition', handlePageTransition);
    return () => window.removeEventListener('anm:transition', handlePageTransition);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const headerEl = headerRef.current;
      if (!headerEl) return;

      const currentScrollY = window.scrollY;
      if (activeMegaKey) {
        setActiveMegaKey(null);
      }

      let shouldHide = false;
      if (!isMobileMenuOpen && currentScrollY > 120) {
        shouldHide = currentScrollY > lastScrollYRef.current;
        headerEl.classList.toggle('is-hidden', shouldHide);
      } else {
        headerEl.classList.remove('is-hidden');
      }

      document.documentElement.classList.toggle('v2-header-hidden', shouldHide);
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeMegaKey, isMobileMenuOpen]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('v2-header-hidden');
    };
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const alignMegaColumns = useCallback(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    const navChildren = Array.from(navEl.children).filter(
      (child) => child.tagName !== 'SPAN'
    );

    Object.values(groupRefs.current).forEach((groupEl) => {
      const columns = groupEl
        ? Array.from(groupEl.querySelectorAll('[data-mm-col]'))
        : [];
      if (!columns.length) return;

      const targetNavIndices = columns.length === 2 ? [0, 3] : [0, 2, 4];
      columns.forEach((col) => {
        col.style.marginLeft = '0px';
      });

      let currentLeft = columns[0].parentElement.getBoundingClientRect().left;

      columns.forEach((col, colIndex) => {
        const targetNavItem = navChildren[targetNavIndices[colIndex]];
        const targetLeft = targetNavItem
          ? ((element) => {
              const textNode = document
                .createTreeWalker(element, NodeFilter.SHOW_TEXT, {
                  acceptNode: (node) =>
                    node.textContent.trim()
                      ? NodeFilter.FILTER_ACCEPT
                      : NodeFilter.FILTER_SKIP,
                })
                .nextNode();

              if (!textNode) return element.getBoundingClientRect().left;
              const range = document.createRange();
              range.selectNodeContents(textNode);
              return range.getBoundingClientRect().left;
            })(targetNavItem)
          : currentLeft + 48;

        const marginLeft = Math.max(24 * !!colIndex, targetLeft - currentLeft);
        col.style.marginLeft = `${marginLeft}px`;
        currentLeft += marginLeft + col.getBoundingClientRect().width;
      });
    });
  }, []);

  useEffect(() => {
    alignMegaColumns();
    document.fonts?.ready.then(alignMegaColumns);
    window.addEventListener('resize', alignMegaColumns);

    const observer = new ResizeObserver(() => {
      if (activeMegaKeyRef.current) {
        alignMegaColumns();
      }
    });

    document.querySelectorAll('[data-mm-col]').forEach((col) => {
      observer.observe(col.parentElement);
    });

    return () => {
      window.removeEventListener('resize', alignMegaColumns);
      observer.disconnect();
    };
  }, [alignMegaColumns]);

  useEffect(() => {
    if (!activeMegaKey) return;
    alignMegaColumns();

    let rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(alignMegaColumns);
    });

    return () => cancelAnimationFrame(rafId);
  }, [activeMegaKey, alignMegaColumns]);

  useEffect(() => {
    document.documentElement.classList.toggle('v2-scroll-locked', isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        ref={headerRef}
        data-v2={true}
        data-theme={headerTheme}
        data-pad-state={isStarterPackPage ? 'top' : padState}
        style={{ top: 'var(--anm-ppp-offset, 0px)' }}
        className={cn(
          'v2-header inset-x-0 top-0 z-[300] pt-[var(--v2-header-gap)]',
          isStarterPackPage ? 'absolute' : 'fixed'
        )}
      >
        <div ref={barRef} className="v2-mm-bar">
          <div
            ref={barContainerRef}
            className={cn(
              'v2-bar-padx v2-container flex h-full items-center justify-between transition-colors duration-300 ease-power3-out lg:grid lg:grid-cols-12 lg:gap-16',
              hasSolidSurface
                ? !isV3Page || isMobileMenuOpen || isDropdownOpen
                  ? 'bg-surface'
                  : 'bg-background-muted'
                : 'bg-transparent'
            )}
          >
            <Logo className="lg:col-span-3" />

            {isStarterPackPage ? null : (
              <nav
                ref={navRef}
                onMouseEnter={() => {
                  clearTimers();
                  setHasOpenedMega(true);
                }}
                onMouseLeave={scheduleClose}
                className="relative hidden h-full items-center justify-center lg:col-span-4 lg:col-start-5 lg:flex"
              >
                {navItems.map((item) =>
                  item.mega ? (
                    <HeaderNavTrigger
                      key={item.key}
                      item={item}
                      href={item.triggerHref}
                      badge={item.badge}
                      active={
                        activeMegaKey === item.key ||
                        (item.triggerHref &&
                          isPathActive(pathname, item.triggerHref))
                      }
                      expanded={activeMegaKey === item.key}
                      onMouseEnter={() => handleNavItemEnter(item)}
                      onClick={() => {
                        clearTimers();
                        setActiveMegaKey(null);
                      }}
                    />
                  ) : (
                    <NavLink
                      key={item.key}
                      href={item.href}
                      variant="nav"
                      onMouseEnter={() => handleNavItemEnter(item)}
                      className={cn(
                        'text-mono h-full',
                        isPathActive(pathname, item.href)
                          ? 'text-foreground'
                          : 'text-foreground-muted hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </NavLink>
                  )
                )}
              </nav>
            )}

            {isStarterPackPage ? null : (
              <div className="hidden items-center justify-end gap-20 lg:col-span-3 lg:col-start-10 lg:flex">
                {!loading && (
                  <NavLink
                    href={hasAccess ? '/animations' : '/login'}
                    variant="nav"
                    className="text-mono text-foreground-muted hover:text-foreground"
                  >
                    {hasAccess
                      ? t('common.header.actions.account')
                      : t('common.header.actions.login')}
                  </NavLink>
                )}
                <AnimatedButton
                  href="/checkout?plan=solo&cycle=quarterly"
                  size="sm"
                  theme="brand"
                >
                  {t('common.header.actions.getAccess')}
                </AnimatedButton>
              </div>
            )}

            {isStarterPackPage ? null : (
              <button
                type="button"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="relative -mr-6 size-44 lg:hidden"
              >
                <span
                  className={cn(
                    'absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300',
                    isMobileMenuOpen
                      ? 'top-1/2 -translate-y-1/2 rotate-45'
                      : 'top-[calc(50%-4px)]'
                  )}
                />
                <span
                  className={cn(
                    'absolute left-1/2 h-[1.5px] w-20 -translate-x-1/2 bg-foreground transition-transform duration-300',
                    isMobileMenuOpen
                      ? 'top-1/2 -translate-y-1/2 -rotate-45'
                      : 'top-[calc(50%+4px)]'
                  )}
                />
              </button>
            )}
          </div>
        </div>

        <div
          ref={dropdownRef}
          className="v2-mm-dropdown"
          onMouseEnter={() => clearTimers()}
          onMouseLeave={scheduleClose}
        >
          <div ref={dropdownInnerRef} className="v2-mm-dropdown-inner">
            {megaNavItems.map((item) => (
              <div
                key={item.key}
                ref={(el) => {
                  groupRefs.current[item.key] = el;
                }}
                className="v2-mm-group"
              >
                <div className="grid grid-cols-12 gap-16 py-32">
                  <div
                    data-mm-reveal={true}
                    className="col-span-3 col-start-1 flex flex-col gap-16"
                  >
                    <p className="text-h4 text-foreground">
                      {item.mega.intro.heading}
                    </p>
                    <p className="text-body-sm text-foreground-muted">
                      {item.mega.intro.text}
                    </p>
                    <NavLink
                      href={item.mega.intro.cta.href}
                      onClick={() => setActiveMegaKey(null)}
                      variant="nav"
                      className="text-mono-sm -mx-12 text-foreground"
                    >
                      {item.mega.intro.cta.label}
                    </NavLink>
                  </div>

                  <div className="col-span-5 col-start-4 flex">
                    {item.mega.columns.map((column) => (
                      <div
                        key={column.label}
                        data-mm-reveal={true}
                        data-mm-col={true}
                        className="flex shrink-0 flex-col"
                      >
                        <span className="text-mono-sm mb-8 text-foreground-muted">
                          {column.label}
                        </span>
                        {column.links.map((link) => (
                          <NavLink
                            key={link.label}
                            href={link.href}
                            variant="nav"
                            className="text-body-sm -mx-12 text-foreground"
                          >
                            {link.label}
                            {link.badge ? (
                              <span className="text-accent-2xs ml-8 inline-block bg-brand px-6 py-2 align-middle text-black">
                                {link.badge}
                              </span>
                            ) : null}
                          </NavLink>
                        ))}
                      </div>
                    ))}
                  </div>

                  {item.mega.featured ? (
                    <div data-mm-reveal={true} className="col-span-3 col-start-10">
                      <TransitionLink
                        href={item.mega.featured.href}
                        onClick={() => setActiveMegaKey(null)}
                        className="group flex flex-col gap-12"
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
                          {hasOpenedMega ? (
                            <picture>
                              {item.mega.featured.image.avif ? (
                                <source
                                  srcSet={item.mega.featured.image.avif}
                                  type="image/avif"
                                />
                              ) : null}
                              <img
                                src={item.mega.featured.image.jpg}
                                alt={item.mega.featured.image.alt}
                                className="block object-cover transition-transform duration-300 ease-(--ease-expo-out) group-hover:scale-[1.04] motion-reduce:transition-none"
                                style={{ width: '100%', height: '100%' }}
                              />
                            </picture>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-body-sm text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-200 ease-(--ease-expo-out) group-hover:decoration-foreground/40">
                            {item.mega.featured.title}
                          </p>
                        </div>
                      </TransitionLink>
                    </div>
                  ) : latestAnimation ? (
                    <div data-mm-reveal={true} className="col-span-3 col-start-10">
                      <TransitionLink
                        href={`/animations/${latestAnimation.slug}`}
                        onClick={() => setActiveMegaKey(null)}
                        className="group flex flex-col gap-12"
                      >
                        <div className="aspect-[16/10] w-full overflow-hidden bg-background-muted">
                          {hasOpenedMega ? (
                            latestAnimation.preview_video_url ? (
                              <video
                                src={latestAnimation.preview_video_url}
                                autoPlay={true}
                                loop={true}
                                muted={true}
                                playsInline={true}
                                className="h-full w-full object-cover transition-transform duration-300 ease-(--ease-expo-out) group-hover:scale-[1.04] motion-reduce:transition-none"
                              />
                            ) : latestAnimation.preview_image_url ? (
                              <img
                                src={bunnyImageUrl(
                                  latestAnimation.preview_image_url,
                                  { width: 480 }
                                )}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-300 ease-(--ease-expo-out) group-hover:scale-[1.04] motion-reduce:transition-none"
                              />
                            ) : null
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-4">
                          <p className="text-mono-sm text-foreground-muted">
                            {t('common.header.latestComponentLabel')}
                          </p>
                          <p className="text-body-sm text-foreground underline decoration-transparent underline-offset-4 transition-colors duration-200 ease-(--ease-expo-out) group-hover:decoration-foreground/40">
                            {latestAnimation.title}
                          </p>
                        </div>
                      </TransitionLink>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isStarterPackPage || isV3Page ? null : (
          <HeaderMarquee
            scrolled={scrollState === 'scrolled'}
            shiftY={dropdownHeight}
          />
        )}

        <div
          className="v2-mm-collapse group/panel v2-container absolute inset-x-0 top-full lg:hidden"
          data-open={isMobileMenuOpen}
          inert={!isMobileMenuOpen}
        >
          <div>
            <div
              data-lenis-prevent={true}
              className="h-[calc(100svh-var(--v2-header-h)-2*var(--v2-header-gap))] overflow-y-auto bg-surface"
            >
              <div className="flex min-h-full flex-col px-16 pb-24 pt-8">
                {navItems.map((item, index) => (
                  <div
                    key={item.key}
                    style={{ '--i': index }}
                    className="translate-y-8 opacity-0 transition-[opacity,translate] duration-300 ease-(--ease-expo-out) group-data-[open=true]/panel:translate-y-0 group-data-[open=true]/panel:opacity-100 group-data-[open=true]/panel:delay-[calc(120ms+var(--i)*30ms)] motion-reduce:translate-y-0 motion-reduce:transition-none"
                  >
                    {item.mega ? (
                      <MobileNavAccordion
                        item={item}
                        expanded={expandedMobileKey === item.key}
                        onToggle={() =>
                          setExpandedMobileKey((prev) =>
                            prev === item.key ? null : item.key
                          )
                        }
                      />
                    ) : (
                      <TransitionLink
                        href={item.href}
                        className="text-h4 block border-b border-border-muted py-16 text-foreground"
                      >
                        {item.label}
                      </TransitionLink>
                    )}
                  </div>
                ))}

                <div className="mt-auto flex items-center justify-between gap-20 pt-32">
                  {!loading && (
                    <TransitionLink
                      href={hasAccess ? '/animations' : '/login'}
                      className="text-body py-12 text-foreground-muted"
                    >
                      {hasAccess
                        ? t('common.header.actions.account')
                        : t('common.header.actions.login')}
                    </TransitionLink>
                  )}
                  <AnimatedButton
                    href="/checkout?plan=solo&cycle=quarterly"
                    size="sm"
                    theme="brand"
                  >
                    {t('common.header.actions.getAccess')}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={scrimRef}
        className="v2-mm-scrim"
        onClick={() => setActiveMegaKey(null)}
        aria-hidden="true"
      />

      <div
        data-open={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[290] bg-black/60 opacity-0 transition-opacity duration-300 ease-(--ease-expo-out) data-[open=true]:pointer-events-auto data-[open=true]:opacity-100 lg:hidden"
      />
    </>
  );
}
