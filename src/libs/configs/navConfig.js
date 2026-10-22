// Variable Mapping: k -> HEADER_NAV_ITEMS

import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

// NOTE: module id: 76624
export const HEADER_NAV_ITEMS = [
  {
    key: 'library',
    label: t('common.header.nav.library.label'),
    triggerHref: '/animations',
    mega: {
      intro: {
        heading: t('common.header.nav.library.intro.heading'),
        text: t('common.header.nav.library.intro.text'),
        cta: {
          label: t('common.header.nav.library.intro.ctaLabel'),
          href: '/animations',
        },
      },
      columns: [
        {
          label: t('common.header.nav.library.columns.byCategory'),
          dynamic: 'categories',
          links: [],
        },
        {
          label: t('common.header.nav.library.columns.collections'),
          links: [
            {
              label: t('common.header.nav.library.links.allComponents'),
              href: '/animations',
            },
            {
              label: t('common.header.nav.library.links.mostPopular'),
              href: '/animations?sort=hot',
            },
            {
              label: t('common.header.nav.library.links.saved'),
              href: '/animations/saved',
            },
            {
              label: t('common.header.nav.library.links.showcase'),
              href: '/showcase',
            },
          ],
        },
      ],
    },
  },
  {
    key: 'kits',
    label: t('common.header.nav.kits.label'),
    triggerHref: '/kits',
    badge: t('common.header.nav.kits.badge'),
    mega: {
      intro: {
        heading: t('common.header.nav.kits.intro.heading'),
        text: t('common.header.nav.kits.intro.text'),
        cta: {
          label: t('common.header.nav.kits.intro.ctaLabel'),
          href: '/kits/menu',
        },
      },
      columns: [
        {
          label: t('common.header.nav.kits.columns.theKits'),
          links: [
            {
              label: t('common.header.nav.kits.links.revealKit'),
              href: '/kits/reveal',
            },
            {
              label: t('common.header.nav.kits.links.menuKit'),
              href: '/kits/menu',
              badge: 'New',
            },
          ],
        },
        {
          label: t('common.header.nav.kits.columns.learn'),
          links: [
            {
              label: t('common.header.nav.kits.links.whatAKitIs'),
              href: '/kits',
            },
          ],
        },
        {
          label: t('common.header.nav.kits.columns.stayClose'),
          links: [
            {
              label: t('common.header.nav.kits.links.roadmap'),
              href: '/roadmap',
            },
            {
              label: t('common.header.nav.kits.links.pricing'),
              href: '/pricing',
            },
          ],
        },
      ],
      featured: {
        title: t('common.header.nav.kits.featured.title'),
        href: '/kits/menu',
        image: {
          jpg: 'https://annnimate.b-cdn.net/video-thumbnails/kits/menu/preview-index/preview-index.gif',
          alt: t('common.header.nav.kits.featured.imageAlt'),
        },
      },
    },
  },
  {
    key: 'learn',
    label: t('common.header.nav.learn.label'),
    triggerHref: '/learn',
    mega: {
      intro: {
        heading: t('common.header.nav.learn.intro.heading'),
        text: t('common.header.nav.learn.intro.text'),
        cta: {
          label: t('common.header.nav.learn.intro.ctaLabel'),
          href: '/learn',
        },
      },
      columns: [
        {
          label: t('common.header.nav.learn.columns.concepts'),
          links: [
            {
              label: t('common.header.nav.learn.links.easing'),
              href: '/learn/easing',
            },
            {
              label: t('common.header.nav.learn.links.scroll'),
              href: '/learn/scroll',
            },
            {
              label: t('common.header.nav.learn.links.timeline'),
              href: '/learn/timeline',
            },
            {
              label: t('common.header.nav.learn.links.text'),
              href: '/learn/text',
            },
            {
              label: t('common.header.nav.learn.links.react'),
              href: '/learn/react',
            },
            {
              label: t('common.header.nav.learn.links.performance'),
              href: '/learn/performance',
            },
            {
              label: t('common.header.nav.learn.links.plugins'),
              href: '/learn/plugins',
            },
          ],
        },
        {
          label: t('common.header.nav.learn.columns.explore'),
          links: [
            {
              label: t('common.header.nav.learn.links.patterns'),
              href: '/patterns',
            },
            {
              label: t('common.header.nav.learn.links.freeTools'),
              href: '/tools',
            },
            {
              label: t('common.header.nav.learn.links.comparisons'),
              href: '/compare',
            },
          ],
        },
      ],
    },
  },
  {
    key: 'docs',
    label: t('common.header.nav.docs.label'),
    href: '/docs',
  },
  {
    key: 'pricing',
    label: t('common.header.nav.pricing.label'),
    href: '/pricing',
  },
];
