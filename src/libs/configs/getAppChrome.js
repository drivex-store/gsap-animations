// NOTE: module id: 107255
// Variable Mapping: e -> LAYOUT_ROUTE_MAP, t -> APP_CHROME_CONFIG, u (arg) -> pathname, D -> config/routes

const LAYOUT_ROUTE_MAP = {
  marketing: [
    '/', '/pricing', '/faq', '/blog', '/privacy-policy', '/tos', '/built-with', 
    '/platform', '/starter-pack', '/vue', '/learn', '/patterns', '/tools', 
    '/compare', '/alternatives', '/docs', '/developers', '/affiliate', '/packs/landing'
  ],
  auth: [
    '/login', '/auth', '/welcome', '/checkout', '/checkout-success', '/checkout-canceled', 
    '/forgot-password', '/oauth/consent', '/confirmed', '/unsubscribe'
  ],
  app: [
    '/animations', '/roadmap', '/settings', '/help', '/onboarding', 
    '/discord', '/changelog', '/account/kits'
  ],
  admin: ['/admin'],
  standalone: ['/newsletter']
};

const APP_CHROME_CONFIG = {
  '/animations': {
    public: true,
    edgeToEdge: (subpath) => subpath === null || subpath.split('/').length === 1,
    movesTransitionContent: (subpath) => subpath !== null && subpath !== 'saved' && subpath.split('/').length === 1
  },
  '/roadmap': {
    public: true,
    edgeToEdge: 'exact'
  },
  '/changelog': {
    public: true,
    edgeToEdge: 'exact',
    sidebar: true
  },
  '/help': {
    edgeToEdge: 'exact'
  },
  '/account/kits': {
    edgeToEdge: 'subtree'
  }
};

export function getAppChrome(pathname) {
  for (const [routePrefix, config] of Object.entries(APP_CHROME_CONFIG)) {
    if (pathname !== routePrefix && !pathname.startsWith(`${routePrefix}/`)) {
      continue;
    }

    const subpath = pathname === routePrefix 
      ? null 
      : pathname.slice(routePrefix.length + 1).replace(/\/$/, '');

    let isEdgeToEdge = false;
    if (typeof config.edgeToEdge === 'function') {
      isEdgeToEdge = !!config.edgeToEdge(subpath);
    } else {
      isEdgeToEdge = config.edgeToEdge === 'subtree' || (config.edgeToEdge === 'exact' && subpath === null);
    }

    return {
      public: !!config.public,
      edgeToEdge: isEdgeToEdge,
      sidebar: !!config.sidebar && subpath === null,
      movesTransitionContent: typeof config.movesTransitionContent === 'function' && !!config.movesTransitionContent(subpath)
    };
  }

  return {
    public: false,
    edgeToEdge: false,
    sidebar: false,
    movesTransitionContent: false
  };
}

export function getLayoutType(pathname) {
  for (const [layoutType, routes] of Object.entries(LAYOUT_ROUTE_MAP)) {
    for (const route of routes) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return layoutType;
      }
    }
  }
  return 'marketing';
}
