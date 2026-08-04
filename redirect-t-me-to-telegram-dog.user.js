// ==UserScript==
// @name         Redirect t.me to telegram.dog
// @namespace    https://github.com/ifsherlock/My-Moviepilot-Script
// @version      1.0.1
// @description  Redirect broken t.me links to a working Telegram deep-link entrance.
// @author       jaysherlock
// @match        http://t.me/*
// @match        https://t.me/*
// @match        http://*.t.me/*
// @match        https://*.t.me/*
// @match        http://*/*
// @match        https://*/*
// @updateURL    https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/redirect-t-me-to-telegram-dog.user.js
// @downloadURL  https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/redirect-t-me-to-telegram-dog.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const TARGET_HOST = "telegram.dog";
  const ROOT_HOST = "t.me";

  function rewriteUrl(url) {
    let parsed;
    try {
      parsed = new URL(url, location.href);
    } catch {
      return null;
    }

    if (parsed.hostname === ROOT_HOST) {
      parsed.hostname = TARGET_HOST;
      return parsed.toString();
    }

    if (parsed.hostname.endsWith("." + ROOT_HOST)) {
      const username = parsed.hostname.slice(0, -("." + ROOT_HOST).length);
      if (!username || username === "www") {
        parsed.hostname = TARGET_HOST;
        return parsed.toString();
      }

      parsed.hostname = TARGET_HOST;
      parsed.pathname = "/" + username + parsed.pathname;
      return parsed.toString();
    }

    return null;
  }

  function redirectCurrentPage() {
    const next = rewriteUrl(location.href);
    if (next && next !== location.href) {
      location.replace(next);
    }
  }

  function rewriteAnchor(anchor) {
    const href = anchor.getAttribute("href");
    if (!href) return;

    const next = rewriteUrl(href);
    if (next) {
      anchor.setAttribute("href", next);
    }
  }

  function rewriteAnchors(root) {
    if (!root) return;

    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.("a[href]")) {
      rewriteAnchor(root);
    }

    root.querySelectorAll?.("a[href]").forEach(rewriteAnchor);
  }

  redirectCurrentPage();

  document.addEventListener(
    "click",
    (event) => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;

      const next = rewriteUrl(anchor.href);
      if (!next) return;

      event.preventDefault();
      location.href = next;
    },
    true
  );

  if (document.documentElement) {
    rewriteAnchors(document.documentElement);
  }

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        rewriteAnchors(node);
      }

      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "href" &&
        mutation.target?.matches?.("a[href]")
      ) {
        rewriteAnchor(mutation.target);
      }
    }
  }).observe(document.documentElement || document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
})();
