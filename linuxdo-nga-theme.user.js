// ==UserScript==
// @name         LINUX.DO NGA Theme
// @namespace    https://linux.do/
// @version      2.3.7
// @description  为 LINUX.DO 增加 NGA 与 NGA Plus 主题，并提供独立的 NGA Logo 开关。
// @author       Codex
// @match        https://linux.do/*
// @match        https://www.linux.do/*
// @updateURL    https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/linuxdo-nga-theme.user.js
// @downloadURL  https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/linuxdo-nga-theme.user.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const THEME_CLASS = 'linuxdo-nga-theme';
  const PLUS_CLASS = 'linuxdo-nga-plus-theme';
  const LOGO_CLASS = 'linuxdo-nga-logo-enabled';
  const THEME_STORAGE_KEY = 'linuxdo-nga-theme-enabled';
  const PLUS_STORAGE_KEY = 'linuxdo-nga-plus-theme-enabled';
  const LOGO_STORAGE_KEY = 'linuxdo-nga-logo-enabled';
  const THEME_ROW_ID = 'linuxdo-nga-theme-row';
  const PLUS_THEME_ROW_ID = 'linuxdo-nga-plus-theme-row';
  const LOGO_ROW_ID = 'linuxdo-nga-logo-row';

  // NGA 顶栏标识的原始矢量路径，避免额外网络请求。
  const NGA_LOGO_PATH = 'm1192.5 335-26.9-115.2-8.6-3 7.7 118.2h-59V82.7l5.7-5.8 46.8-5.5 30.4 118.2 8.8 2.6-7.5-109.2 3.4-5.9 56.5-5.4V335h-57.3zm-234.7-.5-10.3-8.7-9.2-58v-11l9.3-167.2 9.7-9.9 92.1-13.7 28.5 34.5 5.5 40v30.3h-53.2l-11.5-55.5-17.9 3.2-5 149.4 5 23 22.1-3.6 6.7-52.3h53.8v73l-19.4 26.5zm-59.3-45.8h34V335h-34v-46.3zm-75.2-.4h-25.5l-4.2 46.7h-62.7l30.2-248.4 10.4-9.7 81.1-9.3L889 335H827zm-10.3-159-5.9 3.7L797 242.3h24.5zM669.4 316.5l-16.1 18-64.5.1-10.3-8.7-9.2-58v-11l9.3-167.2 9.7-9.9L680.4 66l28.5 34.5 5.5 40v30.3h-53.2l-11.5-55.5-17.8 3.2-5.1 149.4 5 23 22.1-3.6 3-21.4 3.7-30.9h-19.4V195.5h73.2V335h-39.3zm-123 18.6h-57.3l-26.8-115.2-8.7-3 7.7 118.2h-59V82.7l5.8-5.8 46.7-5.5 30.5 118.2 8.8 2.6L486.6 83l3.3-5.9 62.2-7.5-5.6 31.4v234zM404 366h-13.7v6.6h-11.5V366h-19.4v6.6h-11.3V366h-14v-8.1h14V351h11.3v6.8h19.4V351H404v8zM169.2 286l-40-2.9v-253h225L351 75.4l27.8 2v257.7H165.7zm29.6-207.8-11.5 3-11 19.1 17.8 12.3 18.8-5.6.7-2.1-2.7-23.8 3.6-26.8zm44 3.4-10.3 17.6 5.9 20 8.5-4.2 8.8-3 4.8-23.2 4.2-37.1zm41.6 6.8-15.3 23.8 4 15.2 18.9-4 4-16.3 2.8-14 3.7-26.7zm32.2 19.8-15.8 23.5 4.1 11.7 15.7-4.2 9-21.6 5.4-28zm37.3 34-.9-9.2 2-15-13.1 19.8-13.6 3.7 5.8 16.8 14.2.1zM261.5 303l27.3 10.6L308 278l-12.3-31.3-51-7.7-2.6 34.3zM203 165.5l31.5 2 68.3 52.4 12.6 3.6 20.9-11.2-2.2-24.4-76.6-50.4-71.3-8.1-34.9 33.5-3 27.8s12 24.2 20.5 36.5l40.1 1-11.2-54.5zm-31 190.2 2.5 18.4-6.2-.3-2.2-17.4zm17.5 18.4 3-18.4 4.4.7-3.3 17.7h-4zm-22.2 16.5v-8.9h9.5V351h9.8v30.7h8.3v9h-8.4l11.6 24.4-4.5 6.8-3-8-3.6-8.1-.4 36.2H177l.2-36.2-4.2 11.2-4.2 10.2-5.7-8.5 13.7-28h-9.3zm48.1-12.7H203v-5.7h12.6v-8h-13.4v-6.5h13.4V351h11.3v6.7h13.4v6.4h-13.4v8h12.5v5.8h-12.5v8.2h15.3v7.3h-40.9v-7.3h14.3V378zm23.8 64h-9.7l1-2V429h-19V442H203v-41.6h36.4V442zm-20.7-34.2h-7v14.6h7v-14.6zm12 0h-6.7v14.6h6.7v-14.6zm-1 34.3zm112.9-58.6h20.4V375h12.4v8.4h20.4v20.4h7.4v9.3h-22.7l3.2 3.7a83 83 0 0 0 19.5 16.2l-7.2 9a102.8 102.8 0 0 1-24.7-23.5l-1.6-2-1.9 1.7a115.6 115.6 0 0 1-25 23.8l-7.4-9a88.5 88.5 0 0 0 19.4-16.2l3.3-3.7h-23v-9.3h7.5v-20.4zm32.8 20.4h10.8V391h-10.8v12.7zm-23.2 0H363V391h-10.8v12.7zm154.8-10h-6v-11.5h6v-18.5H500v-11.7h25.4V364h-6.2v18.4h5.2v11.5h-5.2v22l7.8-.5v12l-28.8 2v-12l8.6-.6v-22.9zm65.6-42.8v11.2h-37.2V351h37.2zm5 36.7h-7.4v42.8h8.3l.9-.8V441h-21v-53.3H550l-3.7 54.3-11.7-.7 3.5-53.6h-7v-10.9h46.5v11zM697.7 351H712v7.5h28.6v20H730V367h-50.5v11.5H669v-20h28.6V351zm4.8 57-.3-3.4-28 16.1-4.3-6.2 31-17-1.7-7-24.3 13.2-4.2-6.8 23.5-11.8-1-4h-6v-6.8h35.3v6.8h-14l1.3 3a79.4 79.4 0 0 1 3.4 9.2l1 2.9 16.2-11.2 5.9 7.6-17 11.1 21.8 24.8-8.2 7.1-16.7-20.5-.5 5.4a64.2 64.2 0 0 1-6.3 21.5l-13.5-2.8.4-.2.3-.7a77 77 0 0 0 4-11.3l1.2-5.1-26.9 16-4.7-6.7 32.4-18.3v-1.3a34.2 34.2 0 0 0-.1-3.6zm158.1-54.2-5.2 11.6V441h-10.4l.1-54-4 9.4-2.5 5.4-6.8-8 20-42.7zm6.2 1.4h36.8v56.6h6.1v9.1h-48.1v-9.1h5.2v-56.6zm10.1 56.6h16.5v-8h-16.5v8zm0-13.8h16.5v-8.1h-16.5v8zm0-13.3h16.5v-8h-16.5v8zm0-13.7h16.5v-8h-16.5v8zm4.4 59.8L869.3 442l-6.7-7.5 12-11zm29.5 3.7-6.5 7.5-12-11.2 6.4-7.3zm113.7-18.6-15.6 21.9-7.5-7.3 15.6-21zm7-13.7h-28.6v-10.3h5.9v-35.5l53-5.4 1.1 9-42.6 4.5V392h11.1v-20.6h13.8V392h26.3v10.3h-26.3V442h-16.4l2.6-3.3v-36.5zm44.1 28.2-7.6 7.4-15.5-21.8 7.5-6.5zm98.5-61h-3.9v-8.7h13.5V351h11.3v9.7h14.2v8.7h-4.7V387h5.7v9.6H1168V387h6v-17.6zm9.8 17.6h11v-17.6h-11V387zm23.7 55H1172v-35.2h35.6V442zm-10.2-25.3h-14.9v15.7h14.9v-15.7zm42.3-26.9.4.8a46.8 46.8 0 0 1 6.6 23.5c0 10.3-4 21.3-12.9 21.3h-7.2v6.5h-10.3V353h30.8zm-13.2-26.6V388l4.3.4 4.6-25.2h-8.9zm4 29-4 1v30.6h3c4 0 6.5-4.6 6.5-11.7a47 47 0 0 0-5.5-20z';
  const NGA_LOGO_DATA_URL =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="129.2 30.2 1120.6 411.8"><path d="${NGA_LOGO_PATH}" fill="#591804" fill-rule="evenodd"/></svg>`
    );

  const CSS = `
    html.${THEME_CLASS} {
      color-scheme: light;
      --primary: #10273f !important;
      --primary-rgb: 16, 39, 63 !important;
      --primary-very-high: #1d354d !important;
      --primary-high: #344c63 !important;
      --primary-medium: #58697b !important;
      --primary-low-mid: #b8ad94 !important;
      --primary-low: #e5d5ad !important;
      --primary-very-low: #fff6df !important;
      --secondary: #fff8e7 !important;
      --secondary-rgb: 255, 248, 231 !important;
      --secondary-low: #59200e !important;
      --secondary-medium: #c79d5e !important;
      --secondary-high: #f0ddad !important;
      --tertiary: #591804 !important;
      --tertiary-rgb: 89, 24, 4 !important;
      --tertiary-hover: #7b2a10 !important;
      --tertiary-low: #f0d5a7 !important;
      --tertiary-medium: #ae7045 !important;
      --quaternary: #8b2b16 !important;
      --header_background: #f7e7bf !important;
      --header_primary: #2b180f !important;
      --highlight: #ffedc3 !important;
      --highlight-low: #fff6df !important;
      --danger: #b11f16 !important;
      --success: #39734c !important;
      --love: #a82118 !important;
      --d-hover: #ffedc3 !important;
      --d-selected: #efd59e !important;
      --d-border: #d9c391 !important;
      --d-nav-color--active: #591804 !important;
      --d-nav-bg-color--active: #efd59e !important;
      --d-input-bg-color: #fff8e7 !important;
    }

    html.${THEME_CLASS} body,
    html.${THEME_CLASS} .d-header,
    html.${THEME_CLASS} .sidebar-wrapper,
    html.${THEME_CLASS} .sidebar-footer-wrapper,
    html.${THEME_CLASS} .sidebar-hamburger-dropdown,
    html.${THEME_CLASS} .full-page-background {
      background: #f5e8c8 !important;
      color: #10273f !important;
    }

    html.${THEME_CLASS} .d-header {
      border-bottom: 2px solid #591804 !important;
      box-shadow: 0 2px 6px rgb(70 34 10 / 14%) !important;
    }

    html.${THEME_CLASS} #main-outlet {
      background: #fff8e7 !important;
      border: 1px solid #d8c391 !important;
      border-radius: 2px !important;
      box-shadow: 0 2px 9px rgb(71 42 14 / 10%) !important;
    }

    html.${THEME_CLASS} body.archetype-regular #main-outlet > .regular.ember-view {
      background: #fff8e7 !important;
    }

    html.${THEME_CLASS} #list-area,
    html.${THEME_CLASS} .list-controls {
      background: #fff8e7 !important;
    }

    html.${THEME_CLASS} .list-controls {
      border-radius: 0 !important;
    }

    html.${THEME_CLASS} .welcome-banner,
    html.${THEME_CLASS} .welcome-banner__wrap,
    html.${THEME_CLASS} .custom-search-banner-wrap {
      border-color: #d8c391 !important;
      border-radius: 0 !important;
    }

    html.${THEME_CLASS} .welcome-banner__title,
    html.${THEME_CLASS} .fancy-title,
    html.${THEME_CLASS} .topic-title,
    html.${THEME_CLASS} h1,
    html.${THEME_CLASS} h2 {
      color: #591804 !important;
    }

    html.${THEME_CLASS} .alert.alert-info,
    html.${THEME_CLASS} .alert.alert-global-notice {
      background: #f0dfb5 !important;
      border-color: #d2b878 !important;
      color: #10273f !important;
    }

    html.${THEME_CLASS} .search-menu .search-input,
    html.${THEME_CLASS} .search-menu input,
    html.${THEME_CLASS} input,
    html.${THEME_CLASS} textarea,
    html.${THEME_CLASS} select {
      background: #fff8e7 !important;
      border-color: #cdb37a !important;
      border-radius: 2px !important;
      color: #10273f !important;
    }

    html.${THEME_CLASS} a,
    html.${THEME_CLASS} .topic-list .main-link a.title,
    html.${THEME_CLASS} .topic-list .main-link a.title:visited {
      color: #51200f;
    }

    html.${THEME_CLASS} a:hover,
    html.${THEME_CLASS} .topic-list .main-link a.title:hover {
      color: #9b2216 !important;
    }

    html.${THEME_CLASS} .btn,
    html.${THEME_CLASS} .select-kit-header,
    html.${THEME_CLASS} .d-editor-button-bar .btn {
      border-radius: 2px !important;
    }

    html.${THEME_CLASS} .btn-primary,
    html.${THEME_CLASS} .nav-pills > li.active > a,
    html.${THEME_CLASS} .nav-pills > li > a.active {
      background: #591804 !important;
      color: #fff6df !important;
    }

    html.${THEME_CLASS} .btn-primary:hover,
    html.${THEME_CLASS} .btn-primary:focus-visible {
      background: #7b2a10 !important;
      color: #fff !important;
    }

    html.${THEME_CLASS} .sidebar-section-link-wrapper .sidebar-section-link.active,
    html.${THEME_CLASS} .sidebar-section-link-wrapper .sidebar-section-link:hover,
    html.${THEME_CLASS} .sidebar-section-link-wrapper .sidebar-section-link:focus-visible {
      background: #efd59e !important;
      color: #591804 !important;
    }

    html.${THEME_CLASS} .sidebar-section-header-text,
    html.${THEME_CLASS} .sidebar-section-link-prefix.icon,
    html.${THEME_CLASS} .sidebar-footer-actions-button .d-icon {
      color: #591804 !important;
    }

    html.${THEME_CLASS} .sidebar-footer-container::before {
      background: linear-gradient(rgb(245 232 200 / 0%), #f5e8c8) !important;
    }

    html.${THEME_CLASS} .topic-list.--d-topic-cards {
      border: 1px solid #d8c391 !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
    }

    html.${THEME_CLASS} .topic-list.--d-topic-cards .topic-list-body {
      background: #fff6df !important;
      gap: 0 !important;
    }

    html.${THEME_CLASS} .topic-list.--d-topic-cards .topic-list-item,
    html.${THEME_CLASS} .topic-list .topic-list-item {
      background: #fff6df !important;
      border: 0 !important;
      border-bottom: 1px solid #ead9b2 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    html.${THEME_CLASS} .topic-list.--d-topic-cards .topic-list-item:nth-child(even),
    html.${THEME_CLASS} .topic-list .topic-list-item:nth-child(even) {
      background: #ffedc3 !important;
    }

    html.${THEME_CLASS} .topic-list .topic-list-item:hover {
      background: #f6dca3 !important;
    }

    html.${THEME_CLASS} .topic-list .topic-list-item td,
    html.${THEME_CLASS} .topic-list .topic-list-item th {
      border-color: #ead9b2 !important;
    }

    html.${THEME_CLASS} .topic-list-header,
    html.${THEME_CLASS} .topic-list-header th {
      background: #e9d29c !important;
      border-color: #c9ac70 !important;
      color: #591804 !important;
    }

    html.${THEME_CLASS} .badge-category-bg,
    html.${THEME_CLASS} .badge-category__wrapper {
      filter: saturate(.78) brightness(.92);
    }

    html.${THEME_CLASS} .topic-body,
    html.${THEME_CLASS} .topic-avatar,
    html.${THEME_CLASS} .topic-map,
    html.${THEME_CLASS} .small-action,
    html.${THEME_CLASS} .post-links-container,
    html.${THEME_CLASS} .embedded-posts {
      background: #fff8e7 !important;
      border-color: #d8c391 !important;
    }

    html.${THEME_CLASS} .topic-post:nth-of-type(even) .topic-body,
    html.${THEME_CLASS} .topic-post:nth-of-type(even) .topic-avatar {
      background: #fff6df !important;
    }

    html.${THEME_CLASS} blockquote,
    html.${THEME_CLASS} aside.quote,
    html.${THEME_CLASS} .onebox,
    html.${THEME_CLASS} pre,
    html.${THEME_CLASS} code {
      background: #f3e4c2 !important;
      border-color: #cfb679 !important;
    }

    html.${THEME_CLASS} aside.quote > .title,
    html.${THEME_CLASS} aside.quote > .title .quote-controls {
      background: #e9d29c !important;
      border-color: #c9ac70 !important;
      color: #591804 !important;
    }

    html.${THEME_CLASS} aside.quote > .title .quote-controls .btn,
    html.${THEME_CLASS} aside.quote > .title .quote-controls .btn .d-icon {
      color: #80644d !important;
    }

    html.${THEME_CLASS} aside.quote > .title .quote-controls .btn:hover,
    html.${THEME_CLASS} aside.quote > .title .quote-controls .btn:focus-visible {
      background: #f0d39a !important;
      color: #591804 !important;
    }

    html.${THEME_CLASS} .fk-d-menu__inner-content,
    html.${THEME_CLASS} .select-kit-body,
    html.${THEME_CLASS} .menu-panel,
    html.${THEME_CLASS} .modal-inner-container,
    html.${THEME_CLASS} .composer-popup,
    html.${THEME_CLASS} #reply-control {
      background: #fff8e7 !important;
      border-color: #cdb37a !important;
      border-radius: 2px !important;
      color: #10273f !important;
    }

    html.${THEME_CLASS} .select-kit-row.is-highlighted,
    html.${THEME_CLASS} .select-kit-row:hover,
    html.${THEME_CLASS} .menu-panel li:hover {
      background: #ffedc3 !important;
    }

    html.${THEME_CLASS} .discourse-tag,
    html.${THEME_CLASS} .badge-category,
    html.${THEME_CLASS} .topic-statuses .d-icon,
    html.${THEME_CLASS} .posts-map,
    html.${THEME_CLASS} .post-activity {
      color: #6d452e !important;
    }

    html.${THEME_CLASS} .timeline-container .timeline-scrollarea {
      border-color: #591804 !important;
    }

    html.${THEME_CLASS} .timeline-container .timeline-handle,
    html.${THEME_CLASS} .topic-progress {
      background: #591804 !important;
      color: #fff6df !important;
    }

    html.${THEME_CLASS} .user-main,
    html.${THEME_CLASS} .user-main .details,
    html.${THEME_CLASS} .user-main .new-user-wrapper,
    html.${THEME_CLASS} .user-main .new-user-content-wrapper,
    html.${THEME_CLASS} .user-main .user-content,
    html.${THEME_CLASS} .user-main .user-profile {
      background: #fff8e7 !important;
    }

    html.${THEME_CLASS} .user-main .user-navigation {
      background: #f1dfb7 !important;
      border-color: #d8c391 !important;
    }

    html.${THEME_CLASS} .user-main .post-list-item.user-stream-item {
      background: #fff8e7 !important;
      border-color: #ead9b2 !important;
    }

    html.${THEME_CLASS} .user-main .post-list-item.user-stream-item:nth-child(even) {
      background: #fff6df !important;
    }

    html.${THEME_CLASS} .user-main .post-list-item.user-stream-item:hover {
      background: #ffedc3 !important;
    }

    #${THEME_ROW_ID},
    #${PLUS_THEME_ROW_ID},
    #${LOGO_ROW_ID} {
      font: inherit;
    }

    .linuxdo-nga-theme-row {
      align-items: center;
      color: var(--primary);
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      min-height: 2.5em;
      padding: .5em .75em;
    }

    .linuxdo-nga-theme-row:hover,
    .linuxdo-nga-theme-row.is-selected {
      background: var(--d-selected, #ffedc3);
    }

    .linuxdo-nga-theme-row .linuxdo-nga-check {
      color: #591804;
      font-weight: 700;
      margin-left: 1em;
    }

    #${LOGO_ROW_ID} {
      border-top: 1px solid var(--primary-low, #e5d5ad);
      list-style: none;
      padding: .35em .5em;
    }

    #${LOGO_ROW_ID} button {
      align-items: center;
      background: transparent;
      border: 0;
      color: var(--primary);
      cursor: pointer;
      display: flex;
      font: inherit;
      gap: .65em;
      justify-content: space-between;
      min-height: 2.35em;
      padding: .35em .25em;
      text-align: left;
      width: 100%;
    }

    #${LOGO_ROW_ID} button:focus-visible,
    .linuxdo-nga-theme-row:focus-visible {
      outline: 2px solid #591804;
      outline-offset: -2px;
    }

    #${LOGO_ROW_ID} .linuxdo-nga-switch {
      background: #b8ad94;
      border-radius: 999px;
      display: inline-flex;
      flex: 0 0 auto;
      height: 1.25em;
      padding: .15em;
      transition: background-color 120ms ease;
      width: 2.2em;
    }

    #${LOGO_ROW_ID} .linuxdo-nga-switch::after {
      background: #fff8e7;
      border-radius: 50%;
      content: '';
      height: .95em;
      transform: translateX(0);
      transition: transform 120ms ease;
      width: .95em;
    }

    #${LOGO_ROW_ID} button[aria-checked='true'] .linuxdo-nga-switch {
      background: #591804;
    }

    #${LOGO_ROW_ID} button[aria-checked='true'] .linuxdo-nga-switch::after {
      transform: translateX(.95em);
    }

    html.${LOGO_CLASS} #site-logo,
    html.${LOGO_CLASS} img.logo-big,
    html.${LOGO_CLASS} img.logo-small,
    html.${LOGO_CLASS} img.logo-mobile {
      object-fit: contain !important;
      object-position: left center !important;
    }

    .nga-plus-floor-count,
    .nga-plus-user-info {
      display: none;
    }

    @media (min-width: 1100px) {
      html.${PLUS_CLASS} .list-controls,
      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > .container.list-container.--topic-list,
      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > #main-container,
      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > .regular.ember-view,
      html.${PLUS_CLASS} body.archetype-regular #main-outlet > .regular.ember-view {
        box-sizing: border-box !important;
        margin-left: 0 !important;
        margin-right: 16px !important;
        max-width: none !important;
        width: auto !important;
      }

      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > .container.list-container.--topic-list,
      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > #main-container,
      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > .regular.ember-view,
      html.${PLUS_CLASS} body.archetype-regular #main-outlet > .regular.ember-view {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > #main-container,
      html.${PLUS_CLASS} body #main-outlet-wrapper #main-outlet > .regular.ember-view {
        margin-left: 0 !important;
        margin-right: 16px !important;
      }

      html.${PLUS_CLASS} #main-container .global-notice {
        background: #e9c981 !important;
        border-bottom: 1px solid #d2b878 !important;
        border-radius: 0 !important;
        box-sizing: border-box;
        margin-bottom: 0 !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} #main-container .global-notice > .row {
        align-items: center;
        background: #e9c981 !important;
        box-sizing: border-box;
        display: flex !important;
        min-height: 64px;
        width: 100% !important;
      }

      html.${PLUS_CLASS} #main-container .alert-global-notice {
        align-items: center;
        align-self: stretch;
        background: #e9c981 !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-sizing: border-box;
        display: flex !important;
        margin: 0 !important;
        min-height: 64px;
        padding: 14px 12px !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} .topic-list.--d-topic-cards .topic-list-item {
        align-items: stretch !important;
        column-gap: 0 !important;
        display: grid !important;
        grid-template-areas: 'likes-replies creator title category activity' !important;
        grid-template-columns: 68px 46px minmax(220px, 1fr) minmax(120px, 170px) minmax(150px, 190px) !important;
        min-height: 58px !important;
        padding: 0 !important;
        row-gap: 0 !important;
      }

      html.${PLUS_CLASS} .topic-list-item .main-link.topic-list-data {
        display: contents !important;
      }

      html.${PLUS_CLASS} .topic-list-item .link-top-line {
        align-items: center;
        display: flex !important;
        grid-area: title;
        min-width: 0;
        padding: 9px 12px;
      }

      html.${PLUS_CLASS} .topic-list-item .link-top-line > a.title {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      html.${PLUS_CLASS} .topic-list-item .link-bottom-line,
      html.${PLUS_CLASS} .topic-list-item .topic-status-data {
        display: none !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-likes-replies-data,
      html.${PLUS_CLASS} .topic-list-item .topic-creator-data,
      html.${PLUS_CLASS} .topic-list-item .topic-category-data,
      html.${PLUS_CLASS} .topic-list-item .topic-activity-data {
        align-items: center !important;
        align-self: stretch !important;
        border-left: 1px solid #ead9b2 !important;
        box-sizing: border-box;
        display: flex !important;
        justify-content: center !important;
        min-width: 0;
        padding: 7px 9px !important;
        width: auto !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-likes-replies-data {
        border-left: 0 !important;
        flex-direction: column;
        grid-area: likes-replies;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-likes-replies-data .d-icon {
        display: none !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-likes-replies-data .topic-replies {
        display: none !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-likes-replies-data .nga-plus-floor-count {
        color: #8b4e45;
        display: block;
        font-size: 16px;
        font-weight: 700;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-creator-data {
        grid-area: creator;
        padding-left: 6px !important;
        padding-right: 6px !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-creator-data .avatar {
        height: 30px;
        width: 30px;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-category-data {
        align-items: flex-start !important;
        flex-direction: column;
        grid-area: category;
        justify-content: center !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-category-data .badge-category__name {
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-activity-data {
        align-items: flex-start !important;
        grid-area: activity;
        justify-content: center !important;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-activity {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        min-width: 0;
        width: 100%;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-activity__username {
        color: #4f3022;
        display: block;
        font-weight: 650;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-activity .dot-separator {
        display: none;
      }

      html.${PLUS_CLASS} .topic-list-item .topic-activity__time {
        color: #8b7562;
        font-size: 11px;
        margin-top: 2px;
      }

      html.${PLUS_CLASS} body.archetype-regular #topic-title,
      html.${PLUS_CLASS} body.archetype-regular .container.posts,
      html.${PLUS_CLASS} body.archetype-regular .more-topics__container {
        max-width: none !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular #main-outlet {
        background: #f3d9a4 !important;
        padding-top: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular #main-container {
        margin-bottom: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .regular.ember-view,
      html.${PLUS_CLASS} body.archetype-regular .post-stream,
      html.${PLUS_CLASS} body.archetype-regular .container.posts {
        background: #f3d9a4 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular #topic-title {
        background: #f3d9a4 !important;
        border-bottom: 1px solid #d8c391;
        box-sizing: border-box;
        margin-bottom: 0 !important;
        margin-top: 0 !important;
        padding: 0 16px 8px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .container.posts {
        margin-top: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .container.posts {
        column-gap: 14px !important;
        grid-template-columns: minmax(0, 1fr) 142px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .posts-wrapper,
      html.${PLUS_CLASS} body.archetype-regular .topic-post,
      html.${PLUS_CLASS} body.archetype-regular .topic-post article.boxed {
        box-sizing: border-box;
        max-width: none !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post article.boxed {
        border-top: 1px solid #d8c391;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .post__row {
        align-items: stretch;
        display: grid !important;
        grid-template-columns: 184px minmax(0, 1fr);
        width: 100%;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .post__row:has(> .post-notice) {
        grid-template-columns: minmax(0, 1fr) !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .post__row > .post-notice {
        box-sizing: border-box;
        grid-column: 1 / -1 !important;
        margin: 0 !important;
        max-width: none !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .topic-avatar {
        align-items: center;
        align-self: stretch;
        border-right: 1px solid #d8c391;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: auto !important;
        min-height: 100%;
        padding: 14px 12px;
        position: relative !important;
        top: auto !important;
        width: auto !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .topic-avatar .post-avatar {
        margin-bottom: 9px;
        position: relative !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .topic-avatar .avatar {
        height: 72px;
        width: 72px;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .topic-avatar .avatar-flair {
        bottom: -3px !important;
        box-shadow: 0 0 0 2px #f0d39a;
        left: auto !important;
        right: -6px !important;
        top: auto !important;
        z-index: 2;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='soft'] .topic-avatar .avatar-flair {
        box-shadow: 0 0 0 2px #f7e4b8;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-post .topic-body {
        box-sizing: border-box;
        margin: 0 !important;
        max-width: none !important;
        min-width: 0;
        padding: 0 14px 14px !important;
        position: relative;
        width: auto !important;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='strong'] .post__row,
      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='strong'] .topic-avatar,
      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='strong'] .topic-body {
        background: #f0d39a !important;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='soft'] .post__row,
      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='soft'] .topic-avatar,
      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-tone='soft'] .topic-body {
        background: #f7e4b8 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .nga-plus-user-info {
        align-items: center;
        color: #6d4a34;
        display: flex;
        flex-direction: column;
        font-size: 12px;
        gap: 4px;
        line-height: 1.35;
        max-width: 100%;
        text-align: center;
      }

      html.${PLUS_CLASS} body.archetype-regular .nga-plus-floor-index {
        align-self: stretch;
        border-bottom: 1px solid #ddc690;
        color: #8b2b16;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 5px;
        padding-bottom: 5px;
      }

      html.${PLUS_CLASS} body.archetype-regular .nga-plus-user-link {
        color: #51200f !important;
        font-size: 14px;
        font-weight: 700;
        max-width: 100%;
        overflow-wrap: anywhere;
      }

      html.${PLUS_CLASS} body.archetype-regular .nga-plus-forum-id,
      html.${PLUS_CLASS} body.archetype-regular .nga-plus-user-title {
        max-width: 100%;
        overflow-wrap: anywhere;
      }

      html.${PLUS_CLASS} body.archetype-regular .nga-plus-forum-id {
        color: #92775f;
        font-size: 10px;
      }

      html.${PLUS_CLASS} body.archetype-regular .nga-plus-user-title {
        background: #f1d8a1;
        border: 1px solid #d5b978;
        padding: 1px 5px;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-meta-data {
        border-bottom: 1px solid #ead9b2;
        box-sizing: border-box;
        justify-content: flex-start;
        min-height: 44px;
        padding: 9px 0 8px;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-enhanced] .topic-meta-data .names {
        display: none !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-meta-data .post-infos {
        margin-left: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__topic-map.topic-map,
      html.${PLUS_CLASS} body.archetype-regular .container.posts > .topic-map.--bottom {
        align-items: center;
        background: #e4c17f !important;
        border: 1px solid #d5b978 !important;
        border-radius: 0 !important;
        box-sizing: border-box;
        display: flex;
        gap: 10px;
        justify-content: space-between;
        margin: 0 !important;
        max-width: none !important;
        min-height: 64px;
        padding: 7px 10px !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__contents {
        align-items: center;
        display: flex;
        flex: 1 1 auto;
        min-width: 0;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__stats {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        min-width: 0;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__stats > .btn {
        align-items: center;
        background: rgb(247 228 184 / 72%) !important;
        border: 1px solid rgb(197 165 102 / 48%) !important;
        border-radius: 1px !important;
        display: inline-flex;
        flex-direction: column;
        justify-content: center;
        min-height: 42px;
        min-width: 58px;
        padding: 4px 8px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__stats > .btn:hover,
      html.${PLUS_CLASS} body.archetype-regular .topic-map__stats > .btn:focus-visible {
        background: #f7e4b8 !important;
        border-color: #b78f4f !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__stats .number {
        color: #591804;
        font-size: 16px;
        font-weight: 700;
        line-height: 1.1;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__stat-label {
        color: #80644d;
        font-size: 10px;
        line-height: 1.2;
        margin-top: 2px;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__users-list {
        align-items: center;
        display: flex;
        gap: 3px;
        margin-left: 5px;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__users-list .avatar {
        border: 1px solid #c6a566;
        height: 30px;
        width: 30px;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__additional-contents {
        flex: 0 0 auto;
        margin-left: auto;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-map__additional-contents .btn {
        background: #f7e4b8 !important;
        border: 1px solid #c5a566 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__topic-map.topic-map {
        border-bottom: 2px solid #bc934e !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post-menu-area {
        border-top: 1px solid #bc934e !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post-action-menu__show-replies {
        align-self: center;
        background: #e5c98c !important;
        border: 1px solid #c5a566 !important;
        border-radius: 2px !important;
        color: #63301c !important;
        font-size: 12px;
        font-weight: 700;
        height: 28px;
        min-height: 28px;
        padding: 3px 8px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post-action-menu__show-replies:hover,
      html.${PLUS_CLASS} body.archetype-regular .post-action-menu__show-replies:focus-visible {
        background: #f0d39a !important;
        border-color: #a97937 !important;
        color: #591804 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post-action-menu__show-replies[aria-expanded='true'] {
        background: #d6b56f !important;
        border-color: #a97937 !important;
        box-shadow: inset 0 1px 2px rgb(89 24 4 / 14%);
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom.embedded-posts {
        background: #edce8f !important;
        border: 1px solid #bc934e !important;
        border-top-width: 2px !important;
        box-sizing: border-box;
        margin: 8px 0 0 !important;
        max-width: none !important;
        overflow: hidden;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply {
        background: transparent !important;
        box-sizing: border-box;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply + .reply {
        border-top: 1px solid #bc934e;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply > .row {
        align-items: stretch;
        display: grid !important;
        grid-template-columns: 72px minmax(0, 1fr) !important;
        padding: 0 !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply:nth-of-type(odd) > .row,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply:nth-of-type(odd) .topic-avatar,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply:nth-of-type(odd) .topic-body {
        background: #edce8f !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply:nth-of-type(even) > .row,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply:nth-of-type(even) .topic-avatar,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom > .reply:nth-of-type(even) .topic-body {
        background: #f5dda9 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-avatar {
        border-right: 1px solid #c9ac70;
        box-sizing: border-box;
        display: flex;
        height: auto !important;
        min-height: 100%;
        padding: 10px !important;
        width: auto !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-avatar .post-avatar {
        margin: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-avatar .avatar {
        height: 48px !important;
        width: 48px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-avatar .avatar-flair {
        bottom: -3px !important;
        right: -4px !important;
        transform: scale(.78);
        transform-origin: bottom right;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-body {
        box-sizing: border-box;
        margin: 0 !important;
        max-width: none !important;
        min-width: 0;
        padding: 0 12px 8px !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-enhanced] .post__embedded-posts--bottom .topic-meta-data.embedded-reply {
        align-items: center;
        border-bottom: 1px solid rgb(188 147 78 / 55%);
        display: flex;
        gap: 10px;
        justify-content: space-between;
        min-height: 36px;
        padding: 6px 0 !important;
        width: 100%;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-enhanced] .post__embedded-posts--bottom .topic-meta-data .names {
        align-items: baseline;
        display: flex !important;
        flex-wrap: wrap;
        gap: 3px 7px;
        min-width: 0;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-meta-data .names a {
        color: #591804 !important;
        font-weight: 700;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-meta-data .second a,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .topic-meta-data .user-title {
        color: #80644d !important;
        font-size: 11px;
        font-weight: 400;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .post-link-arrow {
        margin-left: auto;
        position: static !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .post-link-arrow .post-info {
        color: #754b2f !important;
        font-size: 11px;
        white-space: nowrap;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .cooked {
        margin: 0 !important;
        max-width: none !important;
        padding: 8px 0 2px !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .post__collapse-button {
        background: #e2c27e !important;
        border: 1px solid #b78f4f !important;
        border-radius: 2px !important;
        bottom: 7px !important;
        color: #591804 !important;
        height: 28px;
        left: auto !important;
        min-height: 28px;
        padding: 4px !important;
        right: 7px !important;
        top: auto !important;
        width: 28px;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .post__collapse-button:hover,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--bottom .post__collapse-button:focus-visible {
        background: #f0d39a !important;
        border-color: #8b5b25 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post--has-replies-above > .post__row:first-child {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post--has-replies-above > .post__row:first-child > .post__embedded-posts--top {
        background: #edce8f !important;
        border-bottom: 1px solid #bc934e !important;
        box-sizing: border-box;
        grid-column: 1 !important;
        margin: 0 !important;
        max-width: none !important;
        padding: 0 !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top > .reply {
        box-sizing: border-box;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top > .reply + .reply {
        border-top: 1px solid #bc934e;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top > .reply > .row {
        align-items: stretch;
        display: grid !important;
        grid-template-columns: 72px minmax(0, 1fr) !important;
        padding: 0 !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-avatar {
        background: #edce8f !important;
        border-right: 1px solid #c9ac70;
        box-sizing: border-box;
        display: flex;
        height: auto !important;
        min-height: 100%;
        padding: 10px !important;
        width: auto !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-avatar .post-avatar {
        margin: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-avatar .avatar {
        height: 48px !important;
        width: 48px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-avatar .avatar-flair {
        bottom: -3px !important;
        right: -4px !important;
        transform: scale(.78);
        transform-origin: bottom right;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-body {
        background: #edce8f !important;
        box-sizing: border-box;
        margin: 0 !important;
        max-width: none !important;
        min-width: 0;
        padding: 0 12px 8px !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-enhanced] .post__embedded-posts--top .topic-meta-data.embedded-reply {
        align-items: center;
        border-bottom: 1px solid rgb(188 147 78 / 55%);
        display: flex;
        gap: 10px;
        justify-content: space-between;
        min-height: 36px;
        padding: 6px 0 !important;
        width: 100%;
      }

      html.${PLUS_CLASS} body.archetype-regular article[data-nga-plus-enhanced] .post__embedded-posts--top .topic-meta-data .names {
        align-items: baseline;
        display: flex !important;
        flex-wrap: wrap;
        gap: 3px 7px;
        min-width: 0;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-meta-data .names a {
        color: #591804 !important;
        font-weight: 700;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-meta-data .second a,
      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .topic-meta-data .user-title {
        color: #80644d !important;
        font-size: 11px;
        font-weight: 400;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .post-link-arrow {
        margin-left: auto;
        position: static !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .post-link-arrow .post-info {
        color: #754b2f !important;
        font-size: 11px;
        white-space: nowrap;
      }

      html.${PLUS_CLASS} body.archetype-regular .post__embedded-posts--top .cooked {
        margin: 0 !important;
        max-width: none !important;
        padding: 8px 0 2px !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-navigation {
        align-self: start;
        background: #f0d39a !important;
        border-left: 1px solid #d8c391;
        border-right: 1px solid #ead9b2;
        box-sizing: border-box;
        filter: saturate(.55);
        margin-left: 0 !important;
        min-height: 420px;
        opacity: .68;
        padding: 8px 7px;
        width: 142px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-navigation:hover,
      html.${PLUS_CLASS} body.archetype-regular .topic-navigation:focus-within {
        filter: none;
        opacity: .9;
      }

      html.${PLUS_CLASS} body.archetype-regular .topic-navigation > *,
      html.${PLUS_CLASS} body.archetype-regular .timeline-container,
      html.${PLUS_CLASS} body.archetype-regular .topic-timeline,
      html.${PLUS_CLASS} body.archetype-regular .timeline-scrollarea-wrapper,
      html.${PLUS_CLASS} body.archetype-regular .timeline-scrollarea,
      html.${PLUS_CLASS} body.archetype-regular .timeline-controls {
        background: #f0d39a !important;
        box-sizing: border-box;
        max-width: 100% !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-container {
        min-height: 390px;
        position: sticky;
        top: 72px;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-scrollarea {
        border-left: 0 !important;
        margin: 8px 0 0 !important;
        position: relative;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-scrollarea::before {
        background: #c3a47a;
        bottom: 0;
        content: '';
        left: 10px;
        opacity: .72;
        position: absolute;
        top: 0;
        width: 2px;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-scroller {
        margin-left: 5px !important;
        width: calc(100% - 5px) !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-handle {
        border-radius: 1px !important;
        flex: 0 0 6px;
        width: 6px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-scroller-content {
        box-sizing: border-box;
        left: 0;
        min-width: 90px;
        padding-left: 24px !important;
        right: 0;
        width: auto !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .timeline-replies,
      html.${PLUS_CLASS} body.archetype-regular .timeline-ago,
      html.${PLUS_CLASS} body.archetype-regular .timeline-date-wrapper,
      html.${PLUS_CLASS} body.archetype-regular .timeline-last-read {
        color: #856c58 !important;
        font-size: 11px !important;
        white-space: nowrap;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__container {
        background: #f3d9a4 !important;
        border: 1px solid #d8c391;
        box-sizing: border-box;
        margin: 18px 0 0 !important;
        padding: 0 0 16px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__list-title {
        background: #e9d29c !important;
        border-bottom: 1px solid #c9ac70;
        color: #591804 !important;
        display: block !important;
        font-size: 13px;
        margin: 0 !important;
        padding: 9px 12px !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__lists,
      html.${PLUS_CLASS} body.archetype-regular .more-topics__list,
      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topics,
      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .loading-container,
      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topic-list {
        box-sizing: border-box;
        max-width: none !important;
        width: 100% !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topic-list {
        border: 0 !important;
        margin: 0 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topic-list-header,
      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topic-list-header th {
        background: #e9d29c !important;
        border-color: #c9ac70 !important;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topic-list-header-tab {
        border-radius: 0 !important;
        color: #591804 !important;
        min-height: 34px;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__list .topic-list-header-tab.active {
        border-bottom: 2px solid #591804;
      }

      html.${PLUS_CLASS} body.archetype-regular .more-topics__browse-more {
        color: #8b6f58;
        margin: 10px 12px 0;
      }
    }

    @media (max-width: 700px) {
      html.${THEME_CLASS} #main-outlet {
        border-left: 0 !important;
        border-right: 0 !important;
        box-shadow: none !important;
      }

      html.${THEME_CLASS} .topic-list.--d-topic-cards {
        border-left: 0 !important;
        border-right: 0 !important;
      }

    }

    @media (prefers-reduced-motion: reduce) {
      #${LOGO_ROW_ID} .linuxdo-nga-switch,
      #${LOGO_ROW_ID} .linuxdo-nga-switch::after {
        transition: none;
      }
    }
  `;

  let syncScheduled = false;

  function readFlag(key) {
    try {
      return localStorage.getItem(key) === 'true';
    } catch (_error) {
      return false;
    }
  }

  function writeFlag(key, enabled) {
    try {
      localStorage.setItem(key, String(enabled));
    } catch (_error) {
      // 受限浏览模式下仍允许本次会话切换，只是不持久化。
    }
  }

  function setTheme(enabled) {
    document.documentElement.classList.toggle(THEME_CLASS, enabled);
    writeFlag(THEME_STORAGE_KEY, enabled);
    if (!enabled) {
      document.documentElement.classList.remove(PLUS_CLASS);
      writeFlag(PLUS_STORAGE_KEY, false);
    }
    scheduleSync();
  }

  function setPlus(enabled) {
    document.documentElement.classList.toggle(PLUS_CLASS, enabled);
    writeFlag(PLUS_STORAGE_KEY, enabled);
    if (enabled) {
      document.documentElement.classList.add(THEME_CLASS);
      writeFlag(THEME_STORAGE_KEY, true);
    }
    scheduleSync();
  }

  function setLogo(enabled) {
    document.documentElement.classList.toggle(LOGO_CLASS, enabled);
    writeFlag(LOGO_STORAGE_KEY, enabled);
    scheduleSync();
  }

  function createStyle() {
    if (document.getElementById('linuxdo-nga-theme-style')) return;

    const style = document.createElement('style');
    style.id = 'linuxdo-nga-theme-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function updateLogoAttribute(element, attribute, enabled) {
    const suffix = attribute === 'srcset' ? 'Srcset' : 'Src';
    const dataAttribute = `data-linuxdo-nga-original-${attribute}`;
    const datasetKey = `linuxdoNgaOriginal${suffix}`;

    if (enabled) {
      if (!element.hasAttribute(dataAttribute)) {
        element.dataset[datasetKey] = element.getAttribute(attribute) || '';
      }
      if (element.getAttribute(attribute) !== NGA_LOGO_DATA_URL) {
        element.setAttribute(attribute, NGA_LOGO_DATA_URL);
      }
      return;
    }

    if (!element.hasAttribute(dataAttribute)) return;
    const original = element.dataset[datasetKey] || '';
    if (original) {
      element.setAttribute(attribute, original);
    } else {
      element.removeAttribute(attribute);
    }
    delete element.dataset[datasetKey];
  }

  function syncLogo() {
    const enabled = document.documentElement.classList.contains(LOGO_CLASS);
    document
      .querySelectorAll('#site-logo, img.logo-big, img.logo-small')
      .forEach((logo) => {
        updateLogoAttribute(logo, 'src', enabled);
        updateLogoAttribute(logo, 'srcset', enabled);
        logo.closest('picture')?.querySelectorAll('source').forEach((source) => {
          updateLogoAttribute(source, 'srcset', enabled);
        });
      });
  }

  function createThemeRow(id, nameText, value) {
    const row = document.createElement('li');
    row.id = id;
    row.className = 'select-kit-row linuxdo-nga-theme-row';
    row.dataset.name = nameText;
    row.dataset.value = value;
    row.setAttribute('role', 'menuitemradio');
    row.setAttribute('tabindex', '0');

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = nameText;

    const check = document.createElement('span');
    check.className = 'linuxdo-nga-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '✓';

    row.append(name, check);
    return row;
  }

  function createLogoRow() {
    const row = document.createElement('li');
    row.id = LOGO_ROW_ID;
    row.setAttribute('role', 'none');

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-label', '使用 NGA 标识');

    const label = document.createElement('span');
    label.textContent = 'NGA 标识';

    const switchTrack = document.createElement('span');
    switchTrack.className = 'linuxdo-nga-switch';
    switchTrack.setAttribute('aria-hidden', 'true');

    button.append(label, switchTrack);
    row.appendChild(button);
    return row;
  }

  function updateThemeMenu() {
    const collection = document.querySelector(
      '.sidebar-theme-toggle-dropdown .select-kit-collection'
    );
    if (!collection) return;

    if (!document.getElementById(THEME_ROW_ID)) {
      collection.appendChild(createThemeRow(THEME_ROW_ID, 'nga', 'linuxdo-nga'));
    }
    if (!document.getElementById(PLUS_THEME_ROW_ID)) {
      collection.appendChild(
        createThemeRow(PLUS_THEME_ROW_ID, 'nga plus', 'linuxdo-nga-plus')
      );
    }
    if (!document.getElementById(LOGO_ROW_ID)) {
      collection.appendChild(createLogoRow());
    }

    const themeEnabled = document.documentElement.classList.contains(THEME_CLASS);
    const plusEnabled = document.documentElement.classList.contains(PLUS_CLASS);
    const themeRow = document.getElementById(THEME_ROW_ID);
    const plusThemeRow = document.getElementById(PLUS_THEME_ROW_ID);
    const ngaEnabled = themeEnabled && !plusEnabled;
    themeRow?.classList.toggle('is-selected', ngaEnabled);
    themeRow?.setAttribute('aria-checked', String(ngaEnabled));
    plusThemeRow?.classList.toggle('is-selected', plusEnabled);
    plusThemeRow?.setAttribute('aria-checked', String(plusEnabled));

    if (themeEnabled || plusEnabled) {
      collection
        .querySelectorAll('.select-kit-row:not(.linuxdo-nga-theme-row)')
        .forEach((row) => {
          row.classList.remove('is-selected', 'is-highlighted');
          row.setAttribute('aria-checked', 'false');
        });
    }

    const check = themeRow?.querySelector('.linuxdo-nga-check');
    if (check) check.hidden = !ngaEnabled;
    const plusCheck = plusThemeRow?.querySelector('.linuxdo-nga-check');
    if (plusCheck) plusCheck.hidden = !plusEnabled;

    const logoEnabled = document.documentElement.classList.contains(LOGO_CLASS);
    document
      .querySelector(`#${LOGO_ROW_ID} button`)
      ?.setAttribute('aria-checked', String(logoEnabled));
  }

  function updateThemeSummary() {
    const summary = document.querySelector('.sidebar-theme-toggle-dropdown > summary');
    if (!summary) return;

    const selected = summary.querySelector('.select-kit-selected-name');
    const selectedName = selected?.querySelector('.name');
    const themeEnabled = document.documentElement.classList.contains(THEME_CLASS);
    const plusEnabled = document.documentElement.classList.contains(PLUS_CLASS);
    const activeName = plusEnabled ? 'nga plus' : 'nga';

    if (themeEnabled) {
      if (!summary.dataset.ngaOriginalLabel) {
        summary.dataset.ngaOriginalLabel = summary.getAttribute('aria-label') || '';
        summary.dataset.ngaOriginalName = selectedName?.textContent?.trim() || '';
      }
      if (selectedName && selectedName.textContent.trim() !== activeName) {
        selectedName.textContent = activeName;
      }
      selected?.setAttribute('title', activeName);
      selected?.setAttribute('data-name', activeName);
      summary.setAttribute('aria-label', `筛选条件：${activeName}`);
      return;
    }

    if (!summary.dataset.ngaOriginalLabel) return;
    if (selectedName && summary.dataset.ngaOriginalName) {
      selectedName.textContent = summary.dataset.ngaOriginalName;
    }
    selected?.setAttribute('title', summary.dataset.ngaOriginalName || '');
    selected?.setAttribute('data-name', summary.dataset.ngaOriginalName || '');
    summary.setAttribute('aria-label', summary.dataset.ngaOriginalLabel);
    delete summary.dataset.ngaOriginalLabel;
    delete summary.dataset.ngaOriginalName;
  }

  function closeThemeMenu() {
    const dropdown = document.querySelector('.sidebar-theme-toggle-dropdown[open]');
    const summary = dropdown?.querySelector(':scope > summary');
    if (summary instanceof HTMLElement) {
      requestAnimationFrame(() => summary.click());
    }
  }

  function parseReplyCount(element) {
    const ariaLabel = element.closest('[aria-label]')?.getAttribute('aria-label') || '';
    const normalized = `${ariaLabel} ${element.textContent || ''}`.replaceAll(',', '');
    const match = normalized.match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function enhanceTopicRows() {
    document.querySelectorAll('.topic-list-item').forEach((row) => {
      const cell = row.querySelector('.topic-likes-replies-data');
      const source = cell?.querySelector('.topic-replies .number');
      if (!cell || !source) return;

      let output = cell.querySelector('.nga-plus-floor-count');
      if (!output) {
        output = document.createElement('span');
        output.className = 'nga-plus-floor-count';
        output.setAttribute('aria-label', '总楼层数');
        cell.appendChild(output);
      }

      const replies = parseReplyCount(source);
      output.textContent =
        replies === null ? source.textContent.trim() : String(replies === 0 ? 0 : replies + 1);
    });
  }

  function appendUserDetail(container, className, text) {
    if (!text) return;
    const detail = document.createElement('span');
    detail.className = className;
    detail.textContent = text;
    container.appendChild(detail);
  }

  function enhanceTopicPosts() {
    document
      .querySelectorAll('.topic-post article.boxed')
      .forEach((article) => {
        const postNumber = Number(article.id.match(/^post_(\d+)$/)?.[1]);
        const floorNumber = Number.isFinite(postNumber) ? Math.max(0, postNumber - 1) : 0;
        article.dataset.ngaPlusTone = floorNumber % 2 === 0 ? 'strong' : 'soft';
        if (article.dataset.ngaPlusEnhanced === 'true') return;

        const avatarColumn = article.querySelector('.topic-avatar');
        const displayNameLink =
          article.querySelector('.names .full-name a[data-user-card]') ||
          article.querySelector('.names .first a[data-user-card]') ||
          article.querySelector('.names a[data-user-card]');
        if (!avatarColumn || !displayNameLink) return;

        const info = document.createElement('div');
        info.className = 'nga-plus-user-info';

        appendUserDetail(
          info,
          'nga-plus-floor-index',
          floorNumber === 0 ? '#0 主楼' : `#${floorNumber}`
        );

        const userLink = displayNameLink.cloneNode(true);
        userLink.classList.add('nga-plus-user-link');
        userLink.removeAttribute('id');
        info.appendChild(userLink);

        const displayName = displayNameLink.textContent?.trim() || '';
        const forumId = displayNameLink.getAttribute('data-user-card')?.trim();
        const userTitle = article.querySelector('.user-title')?.textContent?.trim();
        const distinctForumId =
          forumId && forumId.toLocaleLowerCase() !== displayName.toLocaleLowerCase()
            ? forumId
            : '';
        appendUserDetail(info, 'nga-plus-forum-id', distinctForumId);
        appendUserDetail(info, 'nga-plus-user-title', userTitle);

        avatarColumn.appendChild(info);
        article.dataset.ngaPlusEnhanced = 'true';
      });
  }

  function syncDom() {
    syncScheduled = false;
    createStyle();
    syncLogo();
    updateThemeMenu();
    updateThemeSummary();
    if (document.documentElement.classList.contains(PLUS_CLASS)) {
      enhanceTopicRows();
      enhanceTopicPosts();
    }
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(syncDom);
  }

  function handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest(`#${THEME_ROW_ID}`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setPlus(false);
      setTheme(true);
      closeThemeMenu();
      return;
    }

    if (target.closest(`#${PLUS_THEME_ROW_ID}`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setPlus(true);
      closeThemeMenu();
      return;
    }

    if (target.closest(`#${LOGO_ROW_ID} button`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setLogo(!document.documentElement.classList.contains(LOGO_CLASS));
      return;
    }

    const nativeThemeRow = target.closest(
      '.sidebar-theme-toggle-dropdown .select-kit-row:not(.linuxdo-nga-theme-row)'
    );
    if (nativeThemeRow && document.documentElement.classList.contains(THEME_CLASS)) {
      setTheme(false);
    }
  }

  function handleKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (
      target.closest(
        `#${THEME_ROW_ID}, #${PLUS_THEME_ROW_ID}, #${LOGO_ROW_ID} button`
      )
    ) {
      event.preventDefault();
      target.click();
    }
  }

  const plusEnabled = readFlag(PLUS_STORAGE_KEY);
  document.documentElement.classList.toggle(
    THEME_CLASS,
    readFlag(THEME_STORAGE_KEY) || plusEnabled
  );
  document.documentElement.classList.toggle(PLUS_CLASS, plusEnabled);
  document.documentElement.classList.toggle(LOGO_CLASS, readFlag(LOGO_STORAGE_KEY));
  createStyle();

  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeydown, true);
  new MutationObserver(scheduleSync).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['src', 'srcset'],
    childList: true,
    subtree: true,
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleSync, { once: true });
  } else {
    scheduleSync();
  }
})();
