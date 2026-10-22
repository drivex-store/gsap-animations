// NOTE: module id: 943348
// Variable Mapping: t -> eventQueue, r -> flushIntervalId, n -> queueExpirationTime, a -> flushQueue, o -> trackEvent, i -> analytics

let eventQueue = [];
let flushIntervalId = null;
let queueExpirationTime = 0;

const flushQueue = () => {
  const posthog = window.posthog;

  if (!posthog || typeof posthog.capture !== 'function') {
    if (Date.now() > queueExpirationTime) {
      eventQueue = [];
      clearInterval(flushIntervalId);
      flushIntervalId = null;
    }
    return;
  }

  const currentQueue = eventQueue;
  eventQueue = [];
  clearInterval(flushIntervalId);
  flushIntervalId = null;

  for (const { eventName, properties, options, at } of currentQueue) {
    try {
      posthog.capture(eventName, properties, {
        ...(options || {}),
        timestamp: at
      });
    } catch (error) {
      // Ignore exception
    }
  }
};

const trackEvent = (eventName, properties = {}, options) => {
  const posthog = window.posthog;

  if (posthog && typeof posthog.capture === 'function') {
    if (eventQueue.length) {
      flushQueue();
    }
    try {
      posthog.capture(eventName, properties, options);
    } catch (error) {
      // Ignore exception
    }
    return;
  }

  if (eventQueue.length < 30) {
    eventQueue.push({
      eventName,
      properties,
      options,
      at: new Date()
    });

    if (!flushIntervalId) {
      queueExpirationTime = Date.now() + 20000; // 20 seconds
      flushIntervalId = setInterval(flushQueue, 200);
    }
  }
};

export const analytics = {
  identify: (userId, properties = {}) => {
    const posthog = window.posthog;
    if (posthog && typeof posthog.identify === 'function') {
      try {
        posthog.identify(userId, {
          ...properties,
          identified_at: new Date().toISOString()
        });
      } catch (error) {
        // Ignore exception
      }
    }
  },

  reset: () => {
    const posthog = window.posthog;
    if (posthog && typeof posthog.reset === 'function') {
      try {
        posthog.reset();
      } catch (error) {
        // Ignore exception
      }
    }
  },

  animation: {
    viewed: (animationId, animationName, category, tags = []) => {
      trackEvent('animation_viewed', {
        animation_id: animationId,
        animation_name: animationName,
        category,
        tags,
        timestamp: new Date().toISOString()
      });
    },
    copied: (animationId, animationName, platform, category) => {
      trackEvent('animation_copied', {
        animation_id: animationId,
        animation_name: animationName,
        platform,
        category,
        timestamp: new Date().toISOString()
      });
    },
    saved: (animationId, animationName, category) => {
      trackEvent('animation_saved', {
        animation_id: animationId,
        animation_name: animationName,
        category,
        timestamp: new Date().toISOString()
      });
    },
    unsaved: (animationId, animationName, category) => {
      trackEvent('animation_unsaved', {
        animation_id: animationId,
        animation_name: animationName,
        category,
        timestamp: new Date().toISOString()
      });
    }
  },

  features: {
    voted: (featureId, featureTitle, voteAction, featureCategory) => {
      trackEvent('feature_voted', {
        feature_id: featureId,
        feature_title: featureTitle,
        vote_action: voteAction,
        feature_category: featureCategory,
        timestamp: new Date().toISOString()
      });
    },
    submitted: (featureId, featureTitle, featureCategory) => {
      trackEvent('feature_submitted', {
        feature_id: featureId,
        feature_title: featureTitle,
        feature_category: featureCategory,
        timestamp: new Date().toISOString()
      });
    }
  },

  search: {
    performed: (query, resultsCount, filters = {}) => {
      trackEvent('search_performed', {
        query,
        results_count: resultsCount,
        filters,
        timestamp: new Date().toISOString()
      });
    },
    filtered: (filters, resultsCount) => {
      trackEvent('filters_applied', {
        filters,
        results_count: resultsCount,
        timestamp: new Date().toISOString()
      });
    }
  },

  askAi: {
    clicked: (platform) => {
      trackEvent('ask_ai_clicked', {
        platform,
        timestamp: new Date().toISOString()
      });
    }
  },

  user: {
    signedIn: (method = 'email') => {
      trackEvent('user_signed_in', {
        method,
        timestamp: new Date().toISOString()
      });
    },
    signedOut: () => {
      trackEvent('user_signed_out', {
        timestamp: new Date().toISOString()
      });
    },
    profileUpdated: (updatedFields = []) => {
      trackEvent('profile_updated', {
        updated_fields: updatedFields,
        timestamp: new Date().toISOString()
      });
    },
    themeChanged: (theme) => {
      trackEvent('theme_changed', {
        theme,
        timestamp: new Date().toISOString()
      });
    }
  },

  activation: {
    onboardingCompleted: (totalTimeMs, stepsCompleted) => {
      trackEvent('onboarding_completed', {
        total_time_ms: totalTimeMs,
        steps_completed: stepsCompleted,
        timestamp: new Date().toISOString()
      });
    }
  },

  revenue: {
    checkoutStarted: (plan, price, billingCycle, additionalData = {}) => {
      trackEvent('checkout_started', {
        plan,
        price,
        billing_cycle: billingCycle,
        ...additionalData,
        timestamp: new Date().toISOString()
      });
    },
    checkoutAbandoned: (reason = 'user_canceled') => {
      trackEvent('checkout_abandoned', {
        reason,
        timestamp: new Date().toISOString()
      });
    }
  },

  feature: {
    codeViewerOpened: (animationId, platform) => {
      trackEvent('code_viewer_opened', {
        animation_id: animationId,
        platform,
        timestamp: new Date().toISOString()
      });
    },
    supportContacted: (method) => {
      trackEvent('support_contacted', {
        method,
        timestamp: new Date().toISOString()
      });
    }
  },

  error: {
    occurred: (errorType, errorMessage, context = {}) => {
      trackEvent('error_occurred', {
        error_type: errorType,
        error_message: errorMessage,
        context,
        timestamp: new Date().toISOString()
      });
    },
    exception: (error, context = {}) => {
      const posthog = window.posthog;
      if (posthog && typeof posthog.captureException === 'function') {
        try {
          posthog.captureException(error, {
            $exception_level: 'error',
            $exception_type: error?.name || 'Error',
            $exception_message: error?.message || String(error),
            ...context
          });
        } catch (captureError) {
          // Ignore exception
        }
      }
      trackEvent('error_occurred', {
        error_type: error?.name || 'Error',
        error_message: error?.message || String(error),
        context,
        timestamp: new Date().toISOString()
      });
    }
  },

  track: (eventName, properties = {}, options) => {
    trackEvent(eventName, {
      ...properties,
      timestamp: new Date().toISOString()
    }, options);
  },

  isFeatureEnabled: (featureFlagName) => {
    const posthog = window.posthog;
    if (posthog && typeof posthog.isFeatureEnabled === 'function') {
      try {
        return posthog.isFeatureEnabled(featureFlagName);
      } catch (error) {
        // Ignore exception
      }
    }
    return false;
  },

  getFeatureFlag: (featureFlagName) => {
    const posthog = window.posthog;
    if (posthog && typeof posthog.getFeatureFlag === 'function') {
      try {
        return posthog.getFeatureFlag(featureFlagName);
      } catch (error) {
        // Ignore exception
      }
    }
    return null;
  }
};

export const trackRetention = (userId, signupDateString) => {
  const daysSinceSignup = Math.floor((new Date() - new Date(signupDateString)) / 86400000); // 864e5 ms = 1 day

  if (daysSinceSignup === 7) {
    analytics.track('week_1_retention', {
      user_id: userId,
      days_since_signup: daysSinceSignup
    });
  } else if (daysSinceSignup === 14) {
    analytics.track('week_2_retention', {
      user_id: userId,
      days_since_signup: daysSinceSignup
    });
  } else if (daysSinceSignup === 30) {
    analytics.track('month_1_retention', {
      user_id: userId,
      days_since_signup: daysSinceSignup
    });
  }
};

export default analytics;
