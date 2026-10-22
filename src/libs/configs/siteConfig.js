// Variable Mapping:
// r (module scope) -> STUDIO_CYCLE_MONTHS
// o (module scope) -> STUDIO_DISCOUNT_TIERS
// a (function) -> calculateStudioTotalCents
// e (calculateStudioTotalCents param) -> seats
// t (calculateStudioTotalCents param) -> pricePerMonth
// r (calculateStudioTotalCents param) -> monthsInCycle
// l (module scope) -> STUDIO_SOLO_CENTS
// n (function) -> getStudioTotalBaseCycleTotal
// i (module scope) -> siteConfig
// e (effectiveCyclePrice param) -> plan
// r (effectiveCyclePrice param) -> now
// e (effectiveCycleTotal param) -> plan
// r (effectiveCycleTotal param) -> now

import { prices, landingPrices, quarterlyPrices, studioSeatsPrices, isOfferActive } from '@/features/pricing/utils/packSlugs'; // NOTE: module id: 825740

export const STUDIO_CYCLE_MONTHS = {
  quarterly: 3,
  yearly: 12
};

export const STUDIO_MAX_SEATS = 20;
export const STUDIO_MIN_SEATS = 2;

const STUDIO_DISCOUNT_TIERS = {
  T2: 30,
  T3: 50
};

export function studioTotalCents(seats, pricePerMonth, monthsInCycle = 1) {
  return function(seats, pricePerMonth, monthsInCycle = 1) {
    return 100 * Math.floor(pricePerMonth / monthsInCycle * (10 - Math.min(+Math.max(0, seats - 1), 4)) / 10 / 100 + 1e-9) * monthsInCycle;
  }(seats, pricePerMonth, monthsInCycle) * seats;
}

export function studioPppTotalCents(seats, pricePerMonth, tier, monthsInCycle = 1) {
  const discount = STUDIO_DISCOUNT_TIERS[tier];
  const totalCents = studioTotalCents(seats, pricePerMonth, monthsInCycle);
  return discount ? Math.round(totalCents * (100 - discount) / 100) : totalCents;
}

export const STUDIO_SOLO_CENTS = {
  quarterly: 8700,
  yearly: 24000
};

const getStudioTotalBaseCycleTotal = (cycle) => studioTotalCents(2, STUDIO_SOLO_CENTS[cycle], STUDIO_CYCLE_MONTHS[cycle]) / 100;

// NOTE: module id: 516799
const siteConfig = {
  appName: "Annnimate",
  appDescription: "Production GSAP motion components for React and Vue. Every component shipped on a real brand site before it reached the library. By Good Fella.",
  domainName: "annnimate.com",
  crisp: {
    id: "",
    onlyShowOnRoutes: ["/"]
  },
  stripe: {
    plans: [{
      isFeatured: true,
      priceId: prices.pro,
      name: "Pro",
      description: "Perfect for individual designers and developers.",
      price: 199,
      priceAnchor: null,
      userAmount: 1,
      isBillingCycle: "yearly",
      features: [{
        name: "Full access to animation library"
      }, {
        name: "All code formats (HTML, React, Webflow)"
      }, {
        name: "GSAP integration"
      }, {
        name: "Save & organize favorites"
      }, {
        name: "New animations monthly"
      }, {
        name: "Documentation & support"
      }, {
        name: "All future updates"
      }]
    }, {
      priceId: prices.team,
      name: "Team",
      description: "For agencies and teams collaborating on projects.",
      price: 300,
      priceAnchor: null,
      isBillingCycle: "yearly",
      userAmount: 3,
      additionalInfo: "Includes 3 seats, +€159/year per additional seat",
      features: [{
        name: "Everything in Pro"
      }, {
        name: "Minimum 3 team members included"
      }, {
        name: "Shared team workspace"
      }, {
        name: "Team collaboration tools"
      }, {
        name: "Priority support"
      }, {
        name: "Additional seats: €159/year each"
      }]
    }],
    landingPlans: [{
      key: "solo",
      name: "Solo",
      cta: "Get Solo",
      surface: "dark",
      isPopular: true,
      seatTag: "1 seat",
      pitch: "For one developer working solo or on freelance work.",
      yearly: {
        price: 199,
        listPrice: 240,
        priceId: landingPrices.soloYearly,
        cycleLabel: "/year"
      },
      quarterly: {
        price: 20,
        listPrice: 29,
        cycleTotal: 60,
        listCycleTotal: 87,
        priceId: quarterlyPrices.soloQuarterly,
        cycleLabel: "/month"
      },
      features: [{
        componentCount: true
      }, {
        shippedRecently: true
      }, "React, Vue and HTML", "MCP server for Cursor and Claude Code", "New components as they ship", "Documentation and support"]
    }, {
      key: "studio-seats",
      name: "Studio",
      cta: "Get Studio",
      surface: "surface",
      perSeat: true,
      minSeats: 2,
      maxSeats: 20,
      soloCents: STUDIO_SOLO_CENTS,
      seatTag: "2 to 20 seats",
      pitch: "For a studio or team shipping client work. Every seat after the first costs less.",
      yearly: {
        price: getStudioTotalBaseCycleTotal("yearly"),
        listPrice: getStudioTotalBaseCycleTotal("yearly"),
        priceId: studioSeatsPrices.studioSeatsYearly,
        cycleLabel: "/year"
      },
      quarterly: {
        price: getStudioTotalBaseCycleTotal("quarterly") / 3,
        listPrice: getStudioTotalBaseCycleTotal("quarterly") / 3,
        cycleTotal: getStudioTotalBaseCycleTotal("quarterly"),
        listCycleTotal: getStudioTotalBaseCycleTotal("quarterly"),
        priceId: studioSeatsPrices.studioSeatsQuarterly,
        cycleLabel: "/month"
      },
      features: ["Everything in Solo, for every seat", "10% off every seat after the first, up to 40%", "Add or remove seats any time", "MCP server for the whole team", "Priority support"]
    }],
    addons: []
  },
  aws: {
    bucket: "bucket-name",
    bucketUrl: "https://bucket-name.s3.amazonaws.com/",
    cdn: "https://cdn-id.cloudfront.net/"
  },
  resend: {
    fromNoReply: "Annnimate <noreply@annnimate.com>",
    fromAdmin: "Team at Annnimate <team@annnimate.com>",
    supportEmail: "support@annnimate.com",
    contactEmail: "contact@annnimate.com"
  },
  colors: {
    main: "#b3fca0"
  },
  auth: {
    loginUrl: "/login",
    callbackUrl: "/animations"
  },
  animationStats: {
    totalCount: 123,
    displayCount: "120+"
  },
  featureFlags: {
    earlyAccessFeatures: ["ai_code_generation_v2", "animation_composer", "team_workspaces", "advanced_customization"],
    adminOnlyFeatures: [],
    disabledFeatures: []
  },
  adminMetrics: {
    monthlyInfraCostEur: 20
  }
};

export default siteConfig;

export function effectiveCyclePrice(plan, now = Date.now()) {
  if (!plan) return null;
  return isOfferActive(now) ? plan.price : (plan.listPrice ?? plan.price);
}

export function effectiveCycleTotal(plan, now = Date.now()) {
  if (!plan) return null;
  if (!plan.cycleTotal) return null;
  return isOfferActive(now) ? plan.cycleTotal : (plan.listCycleTotal ?? plan.cycleTotal);
}
