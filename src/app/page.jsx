import HomeHero from '@/features/marketing/components/HomeHero';

const FREE_COUNT = 12;

const heroItems = [
  { slug: 'sample-1', title: 'Sample One', image: '/images/sample-1.jpg' },
  { slug: 'sample-2', title: 'Sample Two', image: '/images/sample-2.jpg' },
  { slug: 'sample-3', title: 'Sample Three', image: '/images/sample-3.jpg' },
  { slug: 'sample-4', title: 'Sample Four', image: '/images/sample-4.jpg' },
];

export default function HomePage() {
  return <HomeHero items={heroItems} freeCount={FREE_COUNT} />;
}
