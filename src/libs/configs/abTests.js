'use client';

// NOTE: module id: 499046
// Variable Mapping: t -> TEST_VARIANTS, a -> EXPOSURE_KEY
// exposureProps args: e -> currentExposure, a -> testsEnabled (default true), r -> props

export const AB_TESTS_ON = true;
export const EXPOSURE_KEY = 'anm_exp';

const TEST_VARIANTS = {
  hero: ['grid', 'slider'],
  headline: ['award', 'client'],
};

export function exposureProps(currentExposure, testsEnabled = true) {
  const props = {};

  if (!testsEnabled || !currentExposure || typeof currentExposure !== 'object') {
    return props;
  }

  for (const [testName, validVariants] of Object.entries(TEST_VARIANTS)) {
    if (validVariants.includes(currentExposure[testName])) {
      // e.g., props['exp_hero'] = 'grid'
      props[`exp_${testName}`] = currentExposure[testName];
    }
  }

  return props;
}

export function readHomepageExposure() {
  try {
    const stored = window.sessionStorage.getItem(EXPOSURE_KEY);
    return JSON.parse(stored) || null;
  } catch (error) {
    return null;
  }
}
