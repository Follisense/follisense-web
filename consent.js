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
    policyVersion: 'v1'
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

  var CSS = [
    '.fs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;',
    'max-width:520px;margin:0 auto;background:#101A14;color:#EAF0E9;',
    'border:1px solid rgba(110,158,130,0.22);border-radius:14px;padding:20px;',
    'font-family:inherit;box-shadow:0 8px 32px rgba(0,0,0,0.4);}',
    '.fs-consent h2{font-size:16px;font-weight:600;margin:0 0 8px;color:#EAF0E9;}',
    '.fs-consent p{font-size:14px;line-height:1.5;margin:0 0 16px;',
    'color:rgba(234,240,233,0.72);}',
    '.fs-consent a{color:#6E9E82;}',
    '.fs-consent-actions{display:flex;gap:10px;}',
    '.fs-consent button{flex:1;padding:10px 16px;border-radius:100px;font-size:14px;',
    'font-family:inherit;cursor:pointer;border:1px solid rgba(110,158,130,0.35);',
    'background:transparent;color:#EAF0E9;}',
    '.fs-consent button:hover{border-color:#6E9E82;}',
    '@media (max-width:520px){.fs-consent-actions{flex-direction:column;}}'
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

    banner = document.createElement('div');
    banner.className = 'fs-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie choices');

    var heading = document.createElement('h2');
    heading.textContent = 'Help us improve FolliSense';

    var body = document.createElement('p');
    body.appendChild(document.createTextNode(
      "We'd like to use analytics cookies to see which parts of the site people use. " +
      'Nothing you enter is sent. '
    ));

    var link = document.createElement('a');
    link.href = CONFIG.privacyUrl;
    link.textContent = 'Privacy policy';
    body.appendChild(link);

    var actions = document.createElement('div');
    actions.className = 'fs-consent-actions';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'Accept';
    accept.onclick = function () {
      remember('granted');
      loadPostHog();
      close();
    };

    var reject = document.createElement('button');
    reject.type = 'button';
    reject.textContent = 'Reject';
    reject.onclick = function () {
      remember('denied');
      stopPostHog();
      close();
    };

    actions.appendChild(accept);
    actions.appendChild(reject);

    banner.appendChild(heading);
    banner.appendChild(body);
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