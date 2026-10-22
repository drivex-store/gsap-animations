import localFont from 'next/font/local';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Provider from '@/app/providers';
import TransitionLayout from '@/components/layout/TransitionLayout';
import MarketingLayout from '@/components/layout/MarketingLayout';
import '@/styles/clipboard.css';

const shadowsIntoLight = localFont({
  src: '../../public/fonts/ShadowsIntoLight_Regular.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-handwritten',
  display: 'swap',
});

const aktivGrotesk = localFont({
  src: [
    { path: '../../public/fonts/AktivGroteskCorp-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-Italic.woff2', weight: '400', style: 'italic' },
    { path: '../../public/fonts/AktivGroteskCorp-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-MediumItalic.woff2', weight: '500', style: 'italic' },
    { path: '../../public/fonts/AktivGroteskCorp-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/AktivGroteskCorp-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-aktiv',
  display: 'swap',
});

export const metadata = {
  title: 'gsap-animations',
  description: 'Project building...',
};

const categories = [];
const latestAnimation = null;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={[
        aktivGrotesk.variable,
        GeistSans.variable,
        GeistMono.variable,
        shadowsIntoLight.variable,
      ].join(' ')}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        className="bg-background text-foreground font-sans"
        data-preloader-ready="true"
      >
        <Provider categories={categories}>
          <TransitionLayout>
            <MarketingLayout latestAnimation={latestAnimation}>
              {children}
            </MarketingLayout>
          </TransitionLayout>
        </Provider>
      </body>
    </html>
  );
}