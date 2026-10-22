'use client';

// NOTE: module id: 42242
// Variable Mapping: 
// d -> EMAIL_REGEX, m -> PACK_SOURCES
// NewsletterEyebrow: e -> primary, t -> secondary, D -> listSize, a -> secondaryText
// NewsletterForm Props: e -> source, l -> eyebrow, s -> buttonLabel, o -> buttonSize, p -> inputSize, F -> emailPlaceholder, h -> idPrefix, C -> className, E -> wantedComponent, f -> onSuccess, g -> compact, A -> buttonFullWidth, x -> consent, v -> consentCopy, b -> askName, w -> successPanel, y -> fieldStyle, B -> fieldLabel
// NewsletterForm State: Z -> email, M -> acceptedPolicy, T -> isSubmitting, V -> isSuccessStep, S -> errors, L -> submittedEmail, I -> firstName, O -> isSubmittingName, z -> isFullyComplete
// NewsletterForm Refs: K -> emailInputRef, U -> policyCheckboxRef, Y -> formRef, G -> honeypotRef, J -> hasTrackedViewRef, W -> hasTrackedStartRef

import React, { useState, useRef, useEffect, Fragment } from 'react'; // NOTE: module id: 271645
import Link from 'next/link'; // NOTE: module id: 520237
import { toast } from 'sonner'; // NOTE: module id: 846696
import AnimatedButton from '@/components/animations/AnimatedButton'; // NOTE: module id: 687989
import { analytics } from '@/libs/auth/analytics'; // NOTE: module id: 943348
import { useListSize } from '@/providers/ListSizeProvider'; // NOTE: module id: 637161
import SuccessPanel from '@/components/ui/SuccessPanel'; // NOTE: module id: 987025
import { suppressStarterPrompt } from '@/libs/utils/starterPromptUtils'; // NOTE: module id: 927627

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PACK_SOURCES = new Set([
  'starter-pack', 'animations-library', 'animations-detail', 'animations-list-modal',
  'mobile-detail', 'paywall-block', 'kit-reveal-ad', 'kit-reveal-page', 'homepage',
  'pricing', 'alternatives', 'alternatives-top', 'compare', 'compare-top', 'reference-rail'
]);

export function NewsletterEyebrow({
  primary = 'Weekly drop',
  secondary
}) {
  const listSize = useListSize();
  const secondaryText = secondary ?? (listSize ? `Join ${listSize} developers and designers` : null);

  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <span className="text-foreground">{primary}</span>
      {secondaryText ? (
        <Fragment>
          <span aria-hidden="true" className="inline-block size-8 bg-brand" />
          <span>{secondaryText}</span>
        </Fragment>
      ) : null}
    </div>
  );
}

export default function NewsletterForm({
  source = 'footer',
  eyebrow,
  buttonLabel = 'Join',
  buttonSize = 'sm',
  inputSize = 'sm',
  emailPlaceholder = 'you@studio.com',
  idPrefix,
  className = '',
  wantedComponent,
  onSuccess,
  compact = false,
  buttonFullWidth = false,
  consent = 'checkbox',
  consentCopy = null,
  askName = true,
  successPanel = null,
  fieldStyle = 'underline',
  fieldLabel = 'Your email address'
}) {
  const [email, setEmail] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [isFullyComplete, setIsFullyComplete] = useState(false);

  const emailInputRef = useRef(null);
  const policyCheckboxRef = useRef(null);
  const formRef = useRef(null);
  const honeypotRef = useRef(null);
  const hasTrackedViewRef = useRef(false);
  const hasTrackedStartRef = useRef(false);

  const getTrackingData = () => ({
    source: source || 'unknown',
    page_url: window.location.href
  });

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement || hasTrackedViewRef.current || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasTrackedViewRef.current) {
          hasTrackedViewRef.current = true;
          analytics.track('newsletter_form_viewed', getTrackingData());
          observer.disconnect();
        }
      }
    }, { threshold: 0.4 });

    observer.observe(formElement);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const validateForm = (currentEmail, policyChecked, consentType) => {
    const validationErrors = {};
    const trimmedEmail = currentEmail.trim();

    if (!trimmedEmail) {
      validationErrors.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      validationErrors.email = 'Enter a valid email address.';
    }

    if (consentType === 'checkbox' && !policyChecked) {
      validationErrors.policy = 'Please accept the privacy policy to continue.';
    }

    return validationErrors;
  };

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (isSubmitting || isSuccessStep) return;

    const validationErrors = validateForm(email, acceptedPolicy, consent);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      analytics.track('newsletter_form_validation_failed', {
        ...getTrackingData(),
        errors: Object.keys(validationErrors)
      });
      
      if (validationErrors.email) {
        emailInputRef.current?.focus();
      } else if (validationErrors.policy) {
        policyCheckboxRef.current?.focus();
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          source: source,
          wantedComponent: wantedComponent || undefined,
          website: honeypotRef.current?.value || undefined,
          metadata: {
            page_url: window.location.href,
            referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : null
          }
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Could not subscribe');
      }

      analytics.track('newsletter_subscribed', {
        source: source || 'unknown',
        page_url: window.location.href
      });

      toast.success(
        PACK_SOURCES.has(source) 
          ? 'Almost there. Open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.' 
          : 'Almost there. Open the email from julian@annnimate.com and click confirm.'
      );

      suppressStarterPrompt();
      onSuccess?.(email.trim());
      setSubmittedEmail(email.trim());

      if (askName) {
        analytics.track('newsletter_profile_shown', getTrackingData());
      } else {
        setIsFullyComplete(true);
      }

      setIsSuccessStep(true);
      setEmail('');
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Try again?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitName = async (event) => {
    event.preventDefault();
    if (isSubmittingName) return;

    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) {
      handleSkipName();
      return;
    }

    setIsSubmittingName(true);

    try {
      await fetch('/api/newsletter/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: submittedEmail,
          firstName: trimmedFirstName
        })
      });

      analytics.track('newsletter_profile_completed', getTrackingData());
    } catch (error) {
      // Ignore error
    } finally {
      setIsSubmittingName(false);
      setIsFullyComplete(true);
    }
  };

  const handleSkipName = () => {
    if (!isSubmittingName) {
      analytics.track('newsletter_profile_skipped', getTrackingData());
      setIsFullyComplete(true);
    }
  };

  const resolvedIdPrefix = idPrefix || source;
  const firstNameId = `${resolvedIdPrefix}-newsletter-firstname`;
  const emailId = `${resolvedIdPrefix}-newsletter-email`;
  const policyId = `${resolvedIdPrefix}-newsletter-policy`;
  const emailErrorId = `${emailId}-error`;
  const policyErrorId = `${policyId}-error`;

  const isBoxed = fieldStyle === 'boxed';
  
  const inputBaseClasses = `${
    inputSize === 'lg' 
      ? (isBoxed ? 'text-body-lg py-14' : 'text-body-lg pt-10 pb-20') 
      : (isBoxed ? 'text-body-sm py-10' : 'text-body-sm pt-8 pb-16')
  } flex-1 min-w-0 rounded-none bg-transparent px-0 text-foreground placeholder:text-foreground-muted/60 focus:outline-none disabled:opacity-50 transition-colors duration-(--duration-quick) ease-(--ease-expo-out)`;

  const inputStateClasses = isBoxed 
    ? (errors.email ? 'border border-brand bg-surface px-16' : 'border border-foreground/25 bg-surface px-16 focus:border-foreground') 
    : (errors.email ? 'border-b border-brand' : 'border-b border-foreground/20 focus:border-foreground');

  return (
    <form
      ref={formRef}
      onSubmit={isSuccessStep ? handleSubmitName : handleSubscribe}
      noValidate
      className={`flex flex-col gap-16 ${className}`}
    >
      {eyebrow || null}

      {isSuccessStep ? (
        isFullyComplete ? (
          successPanel || (
            <SuccessPanel
              email={submittedEmail}
              wantsPack={PACK_SOURCES.has(source)}
              source={source || 'unknown'}
              onChangeAddress={() => {
                setEmail(submittedEmail);
                setIsSuccessStep(false);
                setIsFullyComplete(false);
              }}
            />
          )
        ) : (
          <Fragment>
            <div className="flex flex-col gap-6">
              <p className="text-body-sm text-foreground">
                {PACK_SOURCES.has(source) 
                  ? 'Almost there - open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.' 
                  : 'Almost there - open the email from julian@annnimate.com and click confirm.'}
              </p>
              <p className="text-body-sm text-foreground/70">
                One quick thing: what should we call you?
              </p>
            </div>
            <div className="relative flex flex-col">
              <label htmlFor={firstNameId} className="sr-only">
                First name
              </label>
              <input
                id={firstNameId}
                type="text"
                autoComplete="given-name"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmittingName}
                autoFocus
                className={`${inputBaseClasses} border-b border-foreground/20 focus:border-foreground`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-16">
              <button
                type="button"
                onClick={handleSkipName}
                disabled={isSubmittingName}
                className="text-mono-sm text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                Skip
              </button>
              <AnimatedButton
                type="submit"
                theme="brand"
                size={buttonSize}
                loading={isSubmittingName}
                disabled={!firstName.trim()}
              >
                Save
              </AnimatedButton>
            </div>
          </Fragment>
        )
      ) : (
        <Fragment>
          <div className="relative flex flex-col">
            <label
              htmlFor={emailId}
              className={isBoxed ? 'text-mono-sm mb-8 text-foreground' : 'sr-only'}
            >
              {isBoxed ? fieldLabel : 'Your email'}
            </label>
            {errors.email ? (
              <p
                id={emailErrorId}
                role="alert"
                className={isBoxed ? 'text-mono-sm order-last mt-6 text-brand' : 'text-mono-sm absolute bottom-full left-0 right-0 mb-6 text-brand'}
              >
                {errors.email}
              </p>
            ) : null}
            <input
              ref={emailInputRef}
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!hasTrackedStartRef.current) {
                  hasTrackedStartRef.current = true;
                  analytics.track('newsletter_form_started', getTrackingData());
                }
                if (errors.email) {
                  setErrors((prev) => {
                    const { email: _emailErr, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              disabled={isSubmitting}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? emailErrorId : undefined}
              className={`${inputBaseClasses} ${inputStateClasses}`}
            />
          </div>

          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={`${resolvedIdPrefix}-newsletter-website`}>Website</label>
            <input
              ref={honeypotRef}
              id={`${resolvedIdPrefix}-newsletter-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="relative">
            <div className={compact ? 'flex flex-col gap-12' : 'flex flex-wrap items-start justify-between gap-16'}>
              {consent === 'notice' ? (
                <p className="text-mono-sm m-0 max-w-[36ch] self-center text-foreground-muted">
                  {consentCopy?.before || 'By signing up you agree to the'} {' '}
                  <Link href="/privacy" className="text-foreground">
                    {consentCopy?.link || 'privacy policy'}
                  </Link>
                  {consentCopy?.after || '.'}
                </p>
              ) : (
                <label
                  htmlFor={policyId}
                  className={`flex cursor-pointer items-center gap-8 self-start text-foreground-muted ${compact ? 'text-body-sm' : 'text-mono-sm'}`}
                >
                  <input
                    ref={policyCheckboxRef}
                    id={policyId}
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={(e) => {
                      setAcceptedPolicy(e.target.checked);
                      if (errors.policy && e.target.checked) {
                        setErrors((prev) => {
                          const { policy: _policyErr, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    disabled={isSubmitting}
                    aria-invalid={errors.policy ? 'true' : 'false'}
                    aria-describedby={errors.policy ? policyErrorId : undefined}
                    className={`size-18 cursor-pointer appearance-none bg-transparent transition-colors checked:border-brand checked:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${errors.policy ? 'border border-brand' : 'border border-foreground/30'}`}
                  />
                  <span className="inline-flex flex-wrap items-center gap-x-6">
                    <span>I agree to the</span>
                    <Link href="/privacy" className="text-foreground">
                      privacy policy
                    </Link>
                  </span>
                </label>
              )}

              <AnimatedButton
                type="submit"
                theme="brand"
                size={buttonSize}
                loading={isSubmitting}
                className={buttonFullWidth ? 'w-full' : (compact ? 'self-end' : undefined)}
              >
                {buttonLabel}
              </AnimatedButton>
            </div>
            
            {errors.policy ? (
              <p
                id={policyErrorId}
                role="alert"
                className="text-mono-sm absolute left-0 right-0 top-full mt-8 text-brand"
              >
                {errors.policy}
              </p>
            ) : null}
          </div>
        </Fragment>
      )}
    </form>
  );
}
