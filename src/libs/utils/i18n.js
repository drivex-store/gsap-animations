import common from '@/libs/locales/common';
import landing from '@/libs/locales/landing';
import pricing from '@/libs/locales/pricing';
import kits from '@/libs/locales/kits';
import platform from '@/libs/locales/platform';
import builtWith from '@/libs/locales/built-with';
import faq from '@/libs/locales/faq';
import starterPack from '@/libs/locales/starter-pack';
import contact from '@/libs/locales/contact';
import seo from '@/libs/locales/seo';
import affiliate from '@/libs/locales/affiliate';
import packs from '@/libs/locales/packs';
import students from '@/libs/locales/students';
import homeV3 from '@/libs/locales/home-v3';
import pricingV3 from '@/libs/locales/pricing-v3';
import packsV3 from '@/libs/locales/packs-v3';
import platformV3 from '@/libs/locales/platform-v3';
import studentsV3 from '@/libs/locales/students-v3';
import kitsV3 from '@/libs/locales/kits-v3';
import affiliateV3 from '@/libs/locales/affiliate-v3';
import frameworksV3 from '@/libs/locales/frameworks-v3';

const dictionary = {
  common,
  landing,
  pricing,
  kits,
  platform,
  'built-with': builtWith,
  faq,
  'starter-pack': starterPack,
  contact,
  seo,
  affiliate,
  packs,
  students,
  'home-v3': homeV3,
  'pricing-v3': pricingV3,
  'packs-v3': packsV3,
  'platform-v3': platformV3,
  'students-v3': studentsV3,
  'kits-v3': kitsV3,
  'affiliate-v3': affiliateV3,
  'frameworks-v3': frameworksV3,
};

export function t(key, variables) {
  const translation = key.split('.').reduce((acc, part) => {
    return acc == null ? acc : acc[part];
  }, dictionary);

  if (translation == null) {
    return key;
  }

  if (variables) {
    return String(translation).replace(/\{(\w+)\}/g, (match, variableName) => {
      return variables[variableName] != null ? String(variables[variableName]) : match;
    });
  }

  return translation;
}
