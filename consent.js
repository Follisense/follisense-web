/* ---------------------------------------------------------------
   FolliSense cookie consent
   Plain HTML sites. Add to every page, just before </body>:

     <script src="/consent.js"></script>

   To let people change their mind later, put this anywhere
   in your footer:

     <a href="#" onclick="FolliSenseConsent.open(); return false;">
       Cookie settings
     </a>

   PostHog does not load at all unless consent is granted.
   --------------------------------------------------------------- */

(function () {
  'use strict';

  var CONFIG = {
    posthogKey:  'phc_vNGwcZMGf4FJidumXZ9khJ5fJrL5StDhYmydp9iFDWFc',
    posthogHost: 'https://eu.i.posthog.com',
    privacyUrl:  '/privacy.html',
    // Bump this when the privacy notice changes.
    // Everyone gets asked again.
    // v2 = privacy notice of 1 September 2026.
    policyVersion: 'v2'
  };

  var STORE = {
    choice:  'fs_consent_analytics',
    at:      'fs_consent_at',
    version: 'fs_consent_version'
  };

  // ---- state -----------------------------------------------------

  function saved() {
    try {
      if (localStorage.getItem(STORE.version) !== CONFIG.policyVersion) return null;
      return localStorage.getItem(STORE.choice);
    } catch (e) {
      return null;
    }
  }

  function remember(choice) {
    try {
      localStorage.setItem(STORE.choice, choice);
      localStorage.setItem(STORE.at, new Date().toISOString());
      localStorage.setItem(STORE.version, CONFIG.policyVersion);
    } catch (e) {
      // Private browsing. The banner will simply ask again next visit.
    }
  }

  // ---- posthog ---------------------------------------------------

  var loaded = false;

  function loadPostHog() {
    if (loaded || !CONFIG.posthogKey || CONFIG.posthogKey === 'phc_REPLACE_ME') return;
    loaded = true;

    var script = document.createElement('script');
    script.src = CONFIG.posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
    script.async = true;

    script.onload = function () {
      if (!window.posthog) return;
      window.posthog.init(CONFIG.posthogKey, {
        api_host: CONFIG.posthogHost,
        autocapture: false,
        disable_session_recording: true,
        capture_pageview: true,
        person_profiles: 'identified_only'
      });
    };

    document.head.appendChild(script);
  }

  function stopPostHog() {
    if (window.posthog && window.posthog.opt_out_capturing) {
      window.posthog.opt_out_capturing();
      window.posthog.reset();
    }
  }

  // ---- styles ----------------------------------------------------
  /* Colours are the site's own tokens: --deep #1A2820, --accent-lite
     #6E9E82, text #F5F7F2. The banner inherits Instrument Sans from
     the page rather than loading a font of its own.

     Layout: a stacked card on phones, a single wide bar from 860px up,
     capped at the same 1200px as the page container so it lines up with
     the content rather than floating in the middle of a large screen. */

  var CSS = [
    '.fs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;',
    'max-width:1200px;margin:0 auto;background:#1A2820;color:#F5F7F2;',
    'box-shadow:inset 0 0 0 1px rgba(245,247,242,0.16),0 18px 44px -20px rgba(0,0,0,0.55);',
    'border-radius:18px;padding:22px 24px;font-family:inherit;',
    '-webkit-font-smoothing:antialiased;}',

    '.fs-consent h2{font-size:15.5px;font-weight:600;letter-spacing:-0.015em;',
    'margin:0 0 7px;color:#F5F7F2;line-height:1.3;}',

    '.fs-consent p{font-size:14px;line-height:1.6;margin:0 0 16px;',
    'color:rgba(245,247,242,0.72);}',

    '.fs-consent p.fs-consent-state{font-size:12.5px;margin:10px 0 16px;',
    'color:rgba(245,247,242,0.55);}',

    '.fs-consent a{color:#6E9E82;text-underline-offset:3px;}',
    '.fs-consent a:hover{color:#8FBAA1;}',

    '.fs-consent-actions{display:flex;gap:10px;}',

    '.fs-consent button{flex:1;height:42px;padding:0 22px;border-radius:100px;',
    'font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;',
    'white-space:nowrap;border:none;transition:background 0.18s,box-shadow 0.18s;}',

    '.fs-consent button.fs-yes{background:#F5F7F2;color:#1A2820;}',
    '.fs-consent button.fs-yes:hover{background:#FFFFFF;}',

    '.fs-consent button.fs-no{background:transparent;color:#F5F7F2;',
    'box-shadow:inset 0 0 0 1px rgba(245,247,242,0.34);}',
    '.fs-consent button.fs-no:hover{box-shadow:inset 0 0 0 1px rgba(245,247,242,0.62);',
    'background:rgba(245,247,242,0.08);}',

    '.fs-consent button:focus-visible{outline:2px solid #6E9E82;outline-offset:2px;}',

    /* Wide bar from 860px up: text left, buttons right, one line. */
    '@media (min-width:860px){',
    '.fs-consent{left:24px;right:24px;bottom:24px;padding:20px 26px;',
    'display:flex;align-items:center;gap:36px;}',
    '.fs-consent-text{flex:1;min-width:0;}',
    '.fs-consent p{margin-bottom:0;max-width:78ch;}',
    '.fs-consent p.fs-consent-state{margin:6px 0 0;}',
    '.fs-consent-actions{flex:0 0 auto;}',
    '.fs-consent button{flex:0 0 auto;min-width:132px;}',
    '}',

    /* Stack the buttons on the narrowest phones. */
    '@media (max-width:400px){.fs-consent-actions{flex-direction:column;}}',

    '@media (prefers-reduced-motion:reduce){',
    '.fs-consent button{transition:none;}}'
  ].join('');

  function injectStyles() {
    if (document.getElementById('fs-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'fs-consent-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  // ---- banner ----------------------------------------------------

  var banner = null;

  function close() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function show() {
    if (banner) return;
    injectStyles();

    var current = saved();

    banner = document.createElement('div');
    banner.className = 'fs-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Cookie settings');

    var text = document.createElement('div');
    text.className = 'fs-consent-text';

    var heading = document.createElement('h2');
    heading.textContent = 'Cookies on FolliSense';

    var body = document.createElement('p');
    body.appendChild(document.createTextNode(
      'We use a small number of cookies that are necessary for this site to work. ' +
      'With your permission we would also like to use analytics cookies, so we can see ' +
      'which parts of the site are useful and which are not. Analytics is off unless you ' +
      'turn it on, and nothing you record in FolliSense is ever sent to it. Read our '
    ));

    var link = document.createElement('a');
    link.href = CONFIG.privacyUrl;
    link.textContent = 'privacy policy';
    body.appendChild(link);
    body.appendChild(document.createTextNode('.'));

    text.appendChild(heading);
    text.appendChild(body);

    // When someone reopens this from the footer, tell them where they stand
    // rather than showing the same first-visit banner again.
    if (current === 'granted' || current === 'denied') {
      var state = document.createElement('p');
      state.className = 'fs-consent-state';
      state.textContent = current === 'granted'
        ? 'Analytics cookies are currently on. You can turn them off below.'
        : 'Analytics cookies are currently off. You can turn them on below.';
      text.appendChild(state);
    }

    var actions = document.createElement('div');
    actions.className = 'fs-consent-actions';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'fs-yes';
    accept.textContent = 'Allow analytics';
    accept.onclick = function () {
      remember('granted');
      loadPostHog();
      close();
    };

    var reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'fs-no';
    reject.textContent = 'Necessary only';
    reject.onclick = function () {
      remember('denied');
      stopPostHog();
      close();
    };

    actions.appendChild(reject);
    actions.appendChild(accept);

    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  // ---- boot ------------------------------------------------------

  function start() {
    var choice = saved();
    if (choice === 'granted') {
      loadPostHog();
    } else if (choice !== 'denied') {
      show();
    }
  }

  window.FolliSenseConsent = {
    open: show,
    status: saved
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();