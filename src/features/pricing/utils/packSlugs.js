// NOTE: module id: 825740
// Variable Mapping: 
// t -> FORCE_PRODUCTION, r -> IS_PROD_ENV, o -> isProd
// a -> TEST_PRICES, l -> PROD_PRICES, c -> prices (export)
// n -> TEST_LANDING_PRICES, i -> PROD_LANDING_PRICES, d -> landingPrices (export)
// s -> TEST_LAUNCH_OFFERS, u -> PROD_LAUNCH_OFFERS, m -> activeLaunchOffers
// p -> TEST_QUARTERLY_PRICES, y -> PROD_QUARTERLY_PRICES, f -> quarterlyPrices (export)
// h -> TEST_STUDIO_SEATS, g -> PROD_STUDIO_SEATS, K -> studioSeatsPrices (export)
// v -> TEST_DISCOUNTS, R -> PROD_DISCOUNTS
// b -> TEST_KIT_PRICES, _ -> PROD_KIT_PRICES

const FORCE_PRODUCTION = process.env.NEXT_PUBLIC_FORCE_PRODUCTION === 'true';
const IS_PROD_ENV = process.env.NODE_ENV === 'production'; // Minified as !0
const isProd = IS_PROD_ENV || FORCE_PRODUCTION;

const TEST_PRICES = {
  pro: 'price_1SmdgaRvKRKuKXmGKUEtcEIW',
  team: 'price_1Sme0wRvKRKuKXmGxvFcJSSH',
  lifetimePro: 'price_1So4YrRvKRKuKXmGGv53ZBWU'
};

const PROD_PRICES = {
  pro: 'price_1SgkfFRvKRKuKXmGBrzPYauv',
  team: 'price_1SgkfDRvKRKuKXmGDhPp0Iex',
  lifetimePro: 'price_1So4WaRvKRKuKXmGYkYZt35Z'
};

const TEST_LANDING_PRICES = {
  soloYearly: 'price_1UOGTcRvKRKuKXmGggrvYhSG',
  soloYearly249: 'price_1TdFEoRvKRKuKXmGEiYeo97J',
  soloMonthly: 'price_1TdFEoRvKRKuKXmGV7jD9iQh',
  studioYearly: 'price_1TdFEpRvKRKuKXmGRymGG43K',
  studioMonthly: 'price_1TdFEqRvKRKuKXmGB65QEdGD',
  studioPlusYearly: 'price_1TdFErRvKRKuKXmGK0DYsOMB',
  studioPlusMonthly: 'price_1TdFErRvKRKuKXmGxGTqkdgI'
};

const PROD_LANDING_PRICES = {
  soloYearly: 'price_1UOGTpRvKRKuKXmGKNOYxyHk',
  soloYearly249: 'price_1TdFH5RvKRKuKXmGDXlyHBFY',
  soloMonthly: 'price_1TdFH5RvKRKuKXmGV7QKmzVy',
  studioYearly: 'price_1TdFH6RvKRKuKXmGo7qkBvqi',
  studioMonthly: 'price_1TdFH7RvKRKuKXmGyVfG3wrm',
  studioPlusYearly: 'price_1TdFH8RvKRKuKXmGJOKCdxYD',
  studioPlusMonthly: 'price_1TdFH8RvKRKuKXmGss4l59Cn'
};

const TEST_LAUNCH_OFFERS = {
  soloYearly: null,
  soloMonthly: null,
  studioYearly: null,
  studioMonthly: null,
  studioPlusYearly: null,
  studioPlusMonthly: null
};

const PROD_LAUNCH_OFFERS = {
  soloYearly: 'price_1TfRAbRvKRKuKXmGrVbCZJxA',
  soloMonthly: 'price_1TfRKuRvKRKuKXmGFpW9zSaJ',
  studioYearly: 'price_1TfRAcRvKRKuKXmG0pFVPJWM',
  studioMonthly: 'price_1TfRKvRvKRKuKXmG8QnoNbJw',
  studioPlusYearly: 'price_1TfRAcRvKRKuKXmG7hO4XkFp',
  studioPlusMonthly: 'price_1TfRKxRvKRKuKXmGR4qWpnDv'
};

export const prices = isProd ? PROD_PRICES : TEST_PRICES;
export const landingPrices = isProd ? PROD_LANDING_PRICES : TEST_LANDING_PRICES;
const activeLaunchOffers = isProd ? PROD_LAUNCH_OFFERS : TEST_LAUNCH_OFFERS;

const TEST_QUARTERLY_PRICES = {
  soloQuarterly: 'price_1U1UGJRvKRKuKXmGM8VegBXN',
  studioQuarterly: 'price_1U1UGKRvKRKuKXmGRpBeCyzG',
  studioPlusQuarterly: 'price_1U1UGMRvKRKuKXmGBf0wcs7Y'
};

const PROD_QUARTERLY_PRICES = {
  soloQuarterly: 'price_1U1UHGRvKRKuKXmGFm3YYFT2',
  studioQuarterly: 'price_1U1UHHRvKRKuKXmGQjtP5l3d',
  studioPlusQuarterly: 'price_1U1UHJRvKRKuKXmG3vkO8i8k'
};

export const quarterlyPrices = isProd ? PROD_QUARTERLY_PRICES : TEST_QUARTERLY_PRICES;

const TEST_STUDIO_SEATS = {
  studioSeatsQuarterly: 'price_1UOGYARvKRKuKXmGElIa5dg4',
  studioSeatsYearly: 'price_1UOGYARvKRKuKXmG8nxsS6Eh'
};

const PROD_STUDIO_SEATS = {
  studioSeatsQuarterly: 'price_1UQ4ynRvKRKuKXmGt2iM71AC',
  studioSeatsYearly: 'price_1UQ4ynRvKRKuKXmG4NBjw67v'
};

export const studioSeatsPrices = isProd ? PROD_STUDIO_SEATS : TEST_STUDIO_SEATS;

const TEST_DISCOUNTS = {
  T2: '7hAlupjR',
  T3: 'aSe5S8ch'
};

const PROD_DISCOUNTS = {
  T2: '0L8QOlX4',
  T3: 'FFbRaEuc'
};

const TEST_KIT_PRICES = {
  reveal: 'price_1TlTU4RvKRKuKXmGzj8ym0l2',
  menu: 'price_1U8HC9RvKRKuKXmGSeaIMCbI',
  'landing-pack': 'price_1UBAN6RvKRKuKXmGsqHMpbEY'
};

const PROD_KIT_PRICES = {
  reveal: 'price_1TlTXHRvKRKuKXmGl62rlPoa',
  menu: 'price_1U8HFfRvKRKuKXmGVBlPxC8O',
  'landing-pack': 'price_1UBANXRvKRKuKXmG8FC9WzzA'
};

// NOTE: Unused expression sequences evaluating combinations of prices and discounts 
// (e.g. `p.soloQuarterly, p.studioQuarterly ... T(h, v, "T2")`) were removed as they 
// are bundler/minifier side-effect checks that do nothing in a clean module context.
// Similarly, an IIFE traversing these objects to eagerly load them into a local `Set` 
// has been omitted for clarity.

export const PACK_SLUGS = ['landing-pack'];

export function isOfferActive(currentTime = Date.now()) {
  return currentTime < Date.parse('2026-09-18T22:00:00Z');
}
