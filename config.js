/**
 * Viral Content Accelerator — runtime configuration.
 *
 * These defaults point at the official One Peak Creative pages. Change them
 * here if this landing page is deployed with different enrollment, contact,
 * or analytics infrastructure. Nothing in this file is secret.
 */
window.VCA_CONFIG = {
  enrollment: {
    // Both plans currently finish on the official VCA page. If the business
    // wants plan-specific checkout, replace these with the approved URLs.
    full: "https://get.onepeakcreative.com/coaching#pricing",
    monthly: "https://get.onepeakcreative.com/coaching#pricing",
  },
  analytics: {
    // Analytics is intentionally off until a data layer / GTM container is
    // configured. When enabled, events are pushed to the configured dataLayer
    // and also dispatched as `vca:conversion` CustomEvents.
    enabled: false,
    dataLayerName: "dataLayer",
    debug: false,
  },
};
