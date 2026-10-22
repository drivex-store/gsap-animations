'use client';

// Variable Mapping: e -> latestAnimation / category / column / link, i -> categories / Icon, n -> columns, r -> colIndex / href

import { useMemo } from 'react'; // NOTE: module id: 271645
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682
import LogoGraphic from '@/assets/logos/LogoGraphic'; // NOTE: module id: 843028
import AnimatedWordmark from '@/components/animations/AnimatedWordmark'; // NOTE: module id: 503433
import NavLink from '@/components/navigation/NavLink'; // NOTE: module id: 520237
import TransitionLink from '@/components/navigation/TransitionLink'; // NOTE: module id: 101836
import NewsletterForm, { NewsletterEyebrow } from '@/components/ui/NewsletterForm'; // NOTE: module id: 42242
import { useCategories } from '@/providers/CategoryProvider'; // NOTE: module id: 87207
import LandingDivider from '@/components/layout/utils/LandingDivider';
import FooterAskAi from '@/components/layout/Footer/FooterAskAi';
import FooterMobileAccordion from '@/components/layout/Footer/FooterMobileAccordion';
import StudioClock from '@/components/layout/Footer/StudioClock';
import FooterStatus from '@/components/layout/Footer/FooterStatus';
import {
  PLATFORM_COLUMN,
  KITS_COLUMN,
  SOCIAL_LINKS,
  LEGAL_LINKS,
} from '@/libs/configs/footerConfig';

// NOTE: module id: 297428
export default function Footer({ latestAnimation }) {
  const categories = useCategories();

  const columns = useMemo(
    () => [
      PLATFORM_COLUMN,
      {
        label: t('common.footer.columns.library'),
        links: [
          {
            label: t('common.footer.libraryLinks.allComponents'),
            href: '/animations',
          },
          ...categories.map((category) => ({
            label: category.name,
            href: `/animations?category=${category.slug}`,
          })),
          {
            label: t('common.footer.libraryLinks.showcase'),
            href: '/showcase',
          },
        ],
      },
      KITS_COLUMN,
    ],
    [categories]
  );

  return (
    <footer
      data-theme="dark"
      className="annnimate-footer relative bg-background px-8 pb-8 lg:px-32 lg:pb-32"
    >
      <div
        data-theme="light"
        className="relative z-[20] px-16 py-24 lg:p-48 overflow-hidden bg-background text-foreground"
      >
        <div className="w-full max-w-[calc(var(--v2-max,1920px)-64px)] mx-auto py-24">
          <div className="grid grid-cols-12 items-center gap-16">
            <div className="col-span-12 md:col-span-7">
              <FooterStatus latest={latestAnimation} />
            </div>
            <div className="col-span-12 md:col-span-5 md:justify-self-end">
              <div className="flex flex-wrap items-center gap-x-24 gap-y-12">
                <FooterAskAi />
                <span className="hidden md:inline">
                  <StudioClock />
                </span>
              </div>
            </div>
          </div>
        </div>

        <LandingDivider />

        <div className="w-full max-w-[calc(var(--v2-max,1920px)-64px)] mx-auto py-32 lg:py-64">
          <div className="grid grid-cols-12 gap-16 gap-y-64">
            <div className="col-span-12 flex flex-col gap-32 lg:col-span-5">
              <TransitionLink
                href="/"
                aria-label="Annnimate home"
                className="inline-block w-fit"
              >
                <LogoGraphic height={20} className="text-foreground" />
              </TransitionLink>

              <NewsletterForm
                source="footer"
                idPrefix="footer"
                eyebrow={<NewsletterEyebrow />}
                inputSize="lg"
              />

              <div className="flex flex-wrap items-center gap-x-12 gap-y-16">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-40 items-center justify-center text-foreground transition-colors lg:size-32 duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground-muted"
                  >
                    <Icon className="size-20" aria-hidden="true" />
                  </a>
                ))}
                <NavLink
                  href="/contact"
                  variant="nav"
                  className="text-mono-sm text-foreground"
                >
                  {t('common.footer.contact')}
                </NavLink>
              </div>

              <AnimatedWordmark
                fit="width"
                tone="muted"
                playOnView={true}
                aria-hidden="true"
                className="mt-auto w-1/2 pt-32 lg:w-full"
              />
            </div>

            <div className="col-span-12 flex flex-col lg:hidden">
              {columns.map((column) => (
                <FooterMobileAccordion
                  key={column.label}
                  label={column.label}
                  links={column.links}
                />
              ))}
            </div>

            {columns.map((column, colIndex) => (
              <nav
                key={column.label}
                aria-label={column.label}
                className={`hidden lg:col-span-2 lg:block ${
                  colIndex === 0 ? 'lg:col-start-7' : ''
                }`}
              >
                <p className="text-mono-sm mb-24 text-foreground-muted">
                  {column.label}
                </p>
                <ul className="flex flex-col">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <NavLink
                        href={link.href}
                        variant="nav"
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-body-sm -mx-12 text-foreground"
                      >
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <LandingDivider />

        <div className="w-full max-w-[calc(var(--v2-max,1920px)-64px)] mx-auto pt-24">
          <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-center">
            <div className="text-mono-sm flex flex-wrap items-center gap-x-8 gap-y-4 text-foreground-muted">
              <span>
                {t('common.footer.copyright', {
                  year: new Date().getFullYear(),
                })}
              </span>
              <span className="opacity-40">·</span>
              <span>{t('common.footer.builtBy')}</span>
              <NavLink
                href="https://good-fella.com"
                variant="nav"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono-sm -mx-12 -my-6 text-foreground"
              >
                {t('common.footer.builtByName')}
              </NavLink>
            </div>

            <div className="flex flex-wrap items-center gap-x-32 gap-y-12">
              {LEGAL_LINKS.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  variant="nav"
                  className="text-mono-sm -mx-12 -my-6 text-foreground"
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('annnimate:open-cookie-preferences')
                  )
                }
                className="text-mono-sm inline-flex items-center text-foreground-muted transition-colors duration-300 ease-out hover:text-foreground"
              >
                {t('common.footer.cookiePreferences')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
