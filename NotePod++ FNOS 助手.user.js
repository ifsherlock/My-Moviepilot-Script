// ==UserScript==
// @name        NotePod++ FNOS 助手
// @namespace   https://greasyfork.org/users/local
// @version     1.0.0
// @description 为 FNOS 文件管理器添加 NotePod++ 编辑与新建文件辅助功能。
// @author      local
// @match       http://*/*
// @match       https://*/*
// @run-at      document-start
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @grant       GM_registerMenuCommand
// @downloadURL https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/NotePod%2B%2B%20FNOS%20%E5%8A%A9%E6%89%8B.user.js
// @updateURL   https://raw.githubusercontent.com/ifsherlock/My-Moviepilot-Script/main/NotePod%2B%2B%20FNOS%20%E5%8A%A9%E6%89%8B.user.js
// ==/UserScript==

(function () {
  'use strict';

  const DEFAULT_MATCH_PATTERN = 'fnos.net\n:5666,:5667';
  const STORAGE_KEYS = {
    enabled: 'notepod_fnos_enabled',
    matchPattern: 'notepod_fnos_match_pattern'
  };

  function gmGet(key, fallback) {
    if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  }

  function gmSet(key, value) {
    if (typeof GM_setValue === 'function') GM_setValue(key, value);
    else localStorage.setItem(key, JSON.stringify(value));
  }

  function parseMatchPattern(pattern) {
    return String(pattern || '')
      .split('\n')
      .flatMap((line) => line.split('#')[0].split('//')[0].split(','))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function hostMatchesCurrentPage(pattern) {
    const host = location.host;
    const keywords = parseMatchPattern(pattern);
    return keywords.length > 0 && keywords.some((keyword) => host.includes(keyword));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeHtmlAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  function addStyle(css) {
    if (typeof GM_addStyle === 'function') GM_addStyle(css);
    else {
      const style = document.createElement('style');
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function installSettingsStyles() {
    if (document.getElementById('np-settings-style')) return;
    addStyle(`
      #np-settings-style { display: none; }
      .np-settings-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(15, 23, 42, 0.45);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      .np-settings-panel {
        width: min(560px, 100%);
        max-height: min(720px, calc(100vh - 36px));
        overflow: auto;
        background: #fff;
        color: #1f2937;
        border-radius: 8px;
        box-shadow: 0 18px 60px rgba(15, 23, 42, 0.25);
        border: 1px solid #e5e7eb;
      }
      .np-settings-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px 14px;
        border-bottom: 1px solid #eef0f3;
      }
      .np-settings-title {
        margin: 0;
        font-size: 18px;
        line-height: 1.3;
        font-weight: 700;
        color: #111827;
      }
      .np-settings-close {
        width: 32px;
        height: 32px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #6b7280;
        cursor: pointer;
        font-size: 22px;
        line-height: 1;
      }
      .np-settings-close:hover { background: #f3f4f6; color: #111827; }
      .np-settings-body { padding: 18px 20px 20px; }
      .np-settings-row { margin-bottom: 16px; }
      .np-settings-label {
        display: block;
        margin-bottom: 7px;
        font-size: 14px;
        font-weight: 650;
        color: #374151;
      }
      .np-settings-help {
        margin: 7px 0 0;
        color: #6b7280;
        font-size: 12px;
        line-height: 1.55;
      }
      .np-settings-textarea {
        width: 100%;
        min-height: 150px;
        box-sizing: border-box;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        resize: vertical;
        color: #111827;
        font-size: 13px;
        line-height: 1.55;
        outline: none;
        font-family: Consolas, "Microsoft YaHei Mono", monospace;
      }
      .np-settings-textarea:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14);
      }
      .np-switch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: #f9fafb;
      }
      .np-switch-copy strong {
        display: block;
        color: #111827;
        font-size: 14px;
        margin-bottom: 3px;
      }
      .np-switch-copy span { color: #6b7280; font-size: 12px; }
      .np-switch {
        position: relative;
        display: inline-flex;
        width: 46px;
        height: 26px;
        flex: 0 0 auto;
      }
      .np-switch input { opacity: 0; width: 0; height: 0; }
      .np-slider {
        position: absolute;
        inset: 0;
        cursor: pointer;
        background: #cbd5e1;
        border-radius: 999px;
        transition: .2s;
      }
      .np-slider:before {
        content: "";
        position: absolute;
        width: 20px;
        height: 20px;
        left: 3px;
        top: 3px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,.25);
        transition: .2s;
      }
      .np-switch input:checked + .np-slider { background: #2563eb; }
      .np-switch input:checked + .np-slider:before { transform: translateX(20px); }
      .np-settings-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        min-height: 28px;
        padding: 9px;
        background: #f8fafc;
        border: 1px dashed #d1d5db;
        border-radius: 6px;
      }
      .np-settings-chip {
        display: inline-flex;
        align-items: center;
        max-width: 100%;
        padding: 3px 7px;
        border-radius: 999px;
        background: #e0ecff;
        color: #1d4ed8;
        font-size: 12px;
        line-height: 1.35;
        word-break: break-all;
      }
      .np-settings-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }
      .np-settings-btn {
        height: 34px;
        padding: 0 14px;
        border-radius: 6px;
        border: 1px solid #d1d5db;
        background: #fff;
        color: #374151;
        cursor: pointer;
        font-size: 14px;
        font-weight: 650;
      }
      .np-settings-btn:hover { background: #f3f4f6; }
      .np-settings-btn.primary {
        border-color: #2563eb;
        background: #2563eb;
        color: #fff;
      }
      .np-settings-btn.primary:hover { background: #1d4ed8; }
    `);

    const marker = document.createElement('meta');
    marker.id = 'np-settings-style';
    (document.head || document.documentElement).appendChild(marker);
  }

  function showSettingsModal() {
    const existing = document.getElementById('np-settings-modal');
    if (existing) existing.remove();

    installSettingsStyles();

    const enabled = gmGet(STORAGE_KEYS.enabled, true);
    const pattern = gmGet(STORAGE_KEYS.matchPattern, DEFAULT_MATCH_PATTERN);
    const modal = document.createElement('div');
    modal.id = 'np-settings-modal';
    modal.className = 'np-settings-modal';
    modal.innerHTML = `
      <div class="np-settings-panel" role="dialog" aria-modal="true" aria-labelledby="np-settings-title">
        <div class="np-settings-head">
          <h3 class="np-settings-title" id="np-settings-title">NotePod++ 设置</h3>
          <button class="np-settings-close" id="np-settings-close" title="关闭">×</button>
        </div>
        <div class="np-settings-body">
          <div class="np-settings-row">
            <div class="np-switch-row">
              <div class="np-switch-copy">
                <strong>启用脚本</strong>
                <span>关闭后刷新页面生效。</span>
              </div>
              <label class="np-switch" title="启用或关闭脚本">
                <input type="checkbox" id="np-enabled" ${enabled ? 'checked' : ''}>
                <span class="np-slider"></span>
              </label>
            </div>
          </div>
          <div class="np-settings-row">
            <label class="np-settings-label" for="np-match-pattern">匹配规则</label>
            <textarea class="np-settings-textarea" id="np-match-pattern" spellcheck="false">${escapeHtml(pattern)}</textarea>
            <p class="np-settings-help">每行一个域名、IP 或端口关键字；同一行可用英文逗号分隔。支持用 # 或 // 写备注。脚本只会在当前网址 host 包含任一关键字时运行。</p>
          </div>
          <div class="np-settings-row">
            <label class="np-settings-label">当前会匹配的关键字</label>
            <div class="np-settings-preview" id="np-pattern-preview"></div>
          </div>
          <div class="np-settings-actions">
            <button class="np-settings-btn" id="np-reset-default">恢复默认</button>
            <button class="np-settings-btn" id="np-cancel">取消</button>
            <button class="np-settings-btn primary" id="np-save">保存设置</button>
          </div>
        </div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(modal);

    const enabledInput = modal.querySelector('#np-enabled');
    const patternInput = modal.querySelector('#np-match-pattern');
    const preview = modal.querySelector('#np-pattern-preview');

    const close = () => modal.remove();
    const renderPreview = () => {
      const keywords = parseMatchPattern(patternInput.value);
      preview.innerHTML = keywords.length
        ? keywords.map((keyword) => `<span class="np-settings-chip">${escapeHtml(keyword)}</span>`).join('')
        : '<span class="np-settings-help">暂无有效规则</span>';
    };

    modal.querySelector('#np-settings-close').onclick = close;
    modal.querySelector('#np-cancel').onclick = close;
    modal.querySelector('#np-reset-default').onclick = () => {
      patternInput.value = DEFAULT_MATCH_PATTERN;
      renderPreview();
    };
    modal.querySelector('#np-save').onclick = () => {
      gmSet(STORAGE_KEYS.enabled, enabledInput.checked);
      gmSet(STORAGE_KEYS.matchPattern, patternInput.value.trim() || DEFAULT_MATCH_PATTERN);
      alert('设置已保存，刷新页面后生效。');
      close();
    };
    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });
    patternInput.addEventListener('input', renderPreview);
    renderPreview();
  }

  function registerMenus() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand('NotePod++：设置', showSettingsModal);
  }

  function installNotePod(pageWindow) {
    if (pageWindow.__notepod_fnos_userscript_ready__) return;
    pageWindow.__notepod_fnos_userscript_ready__ = true;

    const CONFIG = {
      WIN_SELECTOR: '[role="tabpanel"]',
      APP_TITLE: '文件管理',
      ROOT_LABELS: ['我的文件', '设备全部文件', '应用文件'],
      MENU_KEYWORDS: ['打开', '重命名', '详细信息', '下载', '压缩', '剪切'],
      REFRESH_ICON_PATH: 'M12 4a8 8 0 108 8',
      API_NEW: '/app/m-text-editor/api/new',
      EDITOR_URL: '/app/m-text-editor/?path='
    };

    let lastActiveWin = null;
    let lastContextMenuTarget = null;

    function installWebSocketInterceptor() {
      const OriginalWS = pageWindow.WebSocket;
      if (!OriginalWS || OriginalWS.__notepodWrapped) return;

      function WrappedWebSocket(url, protocols) {
        const ws = protocols === undefined ? new OriginalWS(url) : new OriginalWS(url, protocols);
        if (typeof url === 'string' && url.includes('type=file')) {
          ws.__is_file_ws = true;
        }
        return ws;
      }

      WrappedWebSocket.prototype = OriginalWS.prototype;
      Object.setPrototypeOf(WrappedWebSocket, OriginalWS);
      WrappedWebSocket.__notepodWrapped = true;
      pageWindow.WebSocket = WrappedWebSocket;

      if (!OriginalWS.prototype.__notepodOriginalSend) {
        OriginalWS.prototype.__notepodOriginalSend = OriginalWS.prototype.send;
        OriginalWS.prototype.send = function (data) {
          try {
            const strData = typeof data === 'string' ? data : new TextDecoder().decode(data);
            const jsonStr = strData.includes('=') ? strData.split('=').slice(1).join('=') : strData;
            const msg = JSON.parse(jsonStr);

            if (msg.req === 'file.ls') {
              const wsPath = msg.path || '/';
              const wsLastPart = wsPath === '/' ? '我的文件' : wsPath.split('/').pop();
              const wins = document.querySelectorAll(CONFIG.WIN_SELECTOR);
              let matchedWin = null;

              for (const win of wins) {
                const domLastPart = getWinLastBreadcrumb(win);
                if (domLastPart === wsLastPart || (wsPath === '/' && domLastPart === '我的文件')) {
                  matchedWin = win;
                  break;
                }
              }

              const target = matchedWin || lastActiveWin || wins[wins.length - 1];
              if (target) {
                target.__notepod_path = wsPath;
                console.log(`[NotePod++] path synced: ${wsPath}`);
              }
            }
          } catch (_) {
            // Ignore non-file-manager websocket frames.
          }

          return OriginalWS.prototype.__notepodOriginalSend.apply(this, arguments);
        };
      }
    }

    function isFileManagerWin(el) {
      if (!el) return false;
      const win = el.closest('.trim-ui__app-layout--window') || el.closest('.trim-ui__app-layout--window-shell') || el.closest(CONFIG.WIN_SELECTOR);
      if (!win) return false;

      const header = win.querySelector('.trim-ui__app-layout--header-title');
      if (header && header.innerText.trim() !== CONFIG.APP_TITLE) return false;

      return getWinLastBreadcrumb(win) !== '';
    }

    function getWinLastBreadcrumb(win) {
      const items = Array.from(win.querySelectorAll('div[title]'));
      const rootItem = items.find((el) => CONFIG.ROOT_LABELS.includes(el.innerText.trim()));
      if (!rootItem) return '';

      const container = rootItem.closest('.flex-1') || rootItem.parentElement;
      const breadItems = container ? container.querySelectorAll('div[title]') : [];
      return breadItems.length > 0 ? breadItems[breadItems.length - 1].getAttribute('title').trim() : '';
    }

    function handleContextMenuEdit() {
      if (!lastContextMenuTarget) return;

      const titleEl = lastContextMenuTarget.querySelector('[title]');
      const filename = titleEl ? titleEl.getAttribute('title') : null;
      const winContainer = lastContextMenuTarget.closest(CONFIG.WIN_SELECTOR);
      const wsPath = winContainer ? winContainer.__notepod_path : null;

      if (wsPath && filename) {
        const fullPath = wsPath.endsWith('/') ? wsPath + filename : `${wsPath}/${filename}`;
        showEditorWindow(fullPath);
      } else {
        console.warn('[NotePod++] Unable to resolve the selected file path.');
      }
    }

    function createBackdrop() {
      const backdrop = document.createElement('div');
      backdrop.className = 'notepod-backdrop';
      backdrop.style.cssText = [
        'position:absolute',
        'inset:0',
        'background:var(--semi-color-overlay-bg, rgba(0,0,0,0.15))',
        'z-index:9999',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'backdrop-filter:blur(2px)',
        'border-radius:inherit'
      ].join(';');
      return backdrop;
    }

    function showCreateFileModal(path, container) {
      return new Promise((resolve) => {
        const backdrop = createBackdrop();
        const modal = document.createElement('div');

        modal.style.cssText = [
          'width:448px',
          'background:var(--semi-color-bg-2, #fff)',
          'border:1px solid var(--semi-color-border, #eef0f1)',
          'border-radius:12px',
          'box-shadow:0 8px 36px rgba(0,0,0,0.12)',
          'display:flex',
          'flex-direction:column',
          'overflow:hidden',
          'font-family:Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        ].join(';');

        modal.innerHTML = `
          <div style="padding:16px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--semi-color-border,#f0f0f0);">
            <h5 style="margin:0;font-size:16px;font-weight:600;color:var(--semi-color-text-0,#1c1f23);">新建文件</h5>
            <button id="np-close" style="background:none;border:none;cursor:pointer;color:var(--semi-color-text-2,#646a73);font-size:20px;width:32px;height:32px;border-radius:6px;">x</button>
          </div>
          <div style="padding:24px;flex:1;">
            <div style="margin-bottom:8px;font-size:14px;font-weight:600;">文件名 <span style="color:var(--semi-color-danger,#f93920);">*</span></div>
            <div id="np-input-wrap" style="border:1px solid var(--semi-color-border,#dcdfe6);border-radius:6px;padding:6px 12px;background:var(--semi-color-fill-0,#f5f6f7);">
              <input id="np-filename" type="text" placeholder="请输入文件名" style="width:100%;border:none;background:none;outline:none;font-size:14px;">
            </div>
            <p style="font-size:12px;color:var(--semi-color-text-2,#646a73);margin-top:12px;">保存到 ${escapeHtml(path)}</p>
          </div>
          <div style="padding:16px 24px;display:flex;justify-content:flex-end;gap:12px;border-top:1px solid var(--semi-color-border,#f0f0f0);">
            <button id="np-btn-cancel" style="padding:0 16px;height:32px;border-radius:6px;border:1px solid var(--semi-color-border,#dcdfe6);background:white;cursor:pointer;font-size:14px;font-weight:600;min-width:88px;">取消</button>
            <button id="np-btn-ok" style="padding:0 16px;height:32px;border-radius:6px;border:none;background:var(--semi-color-primary,#336df4);cursor:pointer;font-size:14px;font-weight:600;color:white;min-width:88px;">确定</button>
          </div>
        `;

        container.appendChild(backdrop);
        backdrop.appendChild(modal);

        const input = modal.querySelector('#np-filename');
        const wrap = modal.querySelector('#np-input-wrap');
        input.focus();

        const finish = (value) => {
          if (value !== null && !value.trim()) {
            wrap.style.borderColor = 'var(--semi-color-danger, #f93920)';
            return;
          }
          backdrop.remove();
          resolve(value);
        };

        modal.querySelector('#np-btn-ok').onclick = () => finish(input.value);
        modal.querySelector('#np-btn-cancel').onclick = () => finish(null);
        modal.querySelector('#np-close').onclick = () => finish(null);
        input.onkeydown = (event) => {
          if (event.key === 'Enter') finish(input.value);
          if (event.key === 'Escape') finish(null);
        };
      });
    }

    function showNotePodAlert(title, content, container) {
      const backdrop = createBackdrop();
      const modal = document.createElement('div');
      modal.style.cssText = [
        'width:448px',
        'background:var(--semi-color-bg-2, #fff)',
        'border:1px solid var(--semi-color-border, #f0f0f0)',
        'border-radius:12px',
        'box-shadow:0 8px 36px rgba(0,0,0,0.12)',
        'display:flex',
        'flex-direction:column',
        'overflow:hidden',
        'font-family:Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ].join(';');
      modal.innerHTML = `
        <div style="padding:16px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--semi-color-border,#f0f0f0);">
          <h5 style="margin:0;font-size:16px;font-weight:600;">${escapeHtml(title)}</h5>
          <button id="np-alert-close" style="background:none;border:none;cursor:pointer;color:var(--semi-color-text-2,#646a73);font-size:20px;width:32px;height:32px;border-radius:6px;">x</button>
        </div>
        <div style="padding:24px;flex:1;color:var(--semi-color-text-1,#1c1f23);line-height:1.6;">${escapeHtml(content)}</div>
        <div style="padding:16px 24px;display:flex;justify-content:flex-end;border-top:1px solid var(--semi-color-border,#f0f0f0);">
          <button id="alert-ok" style="padding:0 16px;height:32px;border-radius:6px;border:none;background:var(--semi-color-primary,#336df4);cursor:pointer;font-size:14px;font-weight:600;color:white;min-width:88px;">知道了</button>
        </div>
      `;

      const target = container || document.body;
      target.appendChild(backdrop);
      backdrop.appendChild(modal);

      const close = () => backdrop.remove();
      modal.querySelector('#np-alert-close').onclick = close;
      modal.querySelector('#alert-ok').onclick = close;
    }

    function showEditorWindow(path) {
      const existing = document.getElementById('notepod-editor-win');
      if (existing) existing.remove();

      const savedState = JSON.parse(pageWindow.localStorage.getItem('notepod-editor-win-state') || '{}');
      const container = document.createElement('div');
      container.id = 'notepod-editor-win';
      container.style.cssText = [
        'position:fixed',
        `top:${savedState.top || '15%'}`,
        `left:${savedState.left || '15%'}`,
        `width:${savedState.width || '70%'}`,
        `height:${savedState.height || '70%'}`,
        'background:var(--semi-color-bg-2, #fff)',
        'border-radius:12px',
        'box-shadow:0 12px 48px rgba(0,0,0,0.25)',
        'z-index:10001',
        'display:flex',
        'flex-direction:column',
        'overflow:hidden',
        'border:1px solid var(--semi-color-border, #f0f0f0)',
        'min-width:400px',
        'min-height:300px',
        'resize:both'
      ].join(';');

      const editorUrl = `${CONFIG.EDITOR_URL}${encodeURIComponent(path)}`;
      container.innerHTML = `
        <div class="np-win-header" style="height:40px;background:var(--semi-color-bg-1,#f5f6f7);display:flex;align-items:center;justify-content:space-between;padding:0 12px;cursor:move;border-bottom:1px solid var(--semi-color-border,#f0f0f0);user-select:none;">
          <div style="display:flex;align-items:center;gap:8px;pointer-events:none;">
            <img src="/app/m-text-editor/images/ICON.PNG" style="width:20px;height:20px;object-fit:contain;">
            <span style="font-size:13px;font-weight:600;color:var(--semi-color-text-0);">NotePod++</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button class="win-btn-external" title="在新标签页打开" style="background:none;border:none;cursor:pointer;color:var(--semi-color-text-2);width:32px;height:32px;border-radius:6px;">↗</button>
            <button class="win-btn-close" title="关闭" style="background:none;border:none;cursor:pointer;color:var(--semi-color-text-2);width:32px;height:32px;border-radius:6px;">x</button>
          </div>
        </div>
        <div style="flex:1;position:relative;background:#1e1e1e;">
          <iframe src="${editorUrl}" style="width:100%;height:100%;border:none;"></iframe>
        </div>
      `;

      document.body.appendChild(container);

      const iframe = container.querySelector('iframe');
      const header = container.querySelector('.np-win-header');
      const saveState = () => {
        pageWindow.localStorage.setItem('notepod-editor-win-state', JSON.stringify({
          top: container.style.top,
          left: container.style.left,
          width: container.style.width,
          height: container.style.height
        }));
      };

      container.querySelector('.win-btn-external').onclick = () => pageWindow.open(editorUrl, '_blank');
      container.querySelector('.win-btn-close').onclick = () => {
        saveState();
        container.remove();
      };

      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialX = 0;
      let initialY = 0;

      header.addEventListener('mousedown', (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        initialX = container.offsetLeft;
        initialY = container.offsetTop;
        iframe.style.pointerEvents = 'none';
        header.style.cursor = 'grabbing';
      });

      pageWindow.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        container.style.left = `${initialX + event.clientX - startX}px`;
        container.style.top = `${initialY + event.clientY - startY}px`;
        container.style.right = 'auto';
        container.style.bottom = 'auto';
      });

      pageWindow.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        iframe.style.pointerEvents = 'auto';
        header.style.cursor = 'move';
        saveState();
      });

      container.addEventListener('mouseup', saveState);
    }

    function injectNotePodMenuItem(menu) {
      const firstItem = Array.from(menu.querySelectorAll('div')).find((el) => el.innerText.trim() === '打开')?.closest('div');
      if (!firstItem || menu.querySelector('.notepod-menu-item')) return;

      const newItem = document.createElement('div');
      newItem.className = 'notepod-menu-item';
      newItem.innerHTML = `
        <div style="padding:8px 16px;cursor:pointer;display:flex;align-items:center;font-size:14px;color:var(--semi-color-text-0);" onmouseover="this.style.background='var(--semi-color-fill-0)'" onmouseout="this.style.background='none'">
          <svg viewBox="0 0 24 24" width="16" height="16" style="margin-right:8px;"><path fill="currentColor" d="M17.876 4c-.298 0-.583.118-.794.329l-12.01 12.01a1.002 1.002 0 00-.254.428l-.583 1.996 1.997-.582c.161-.047.309-.134.428-.253L18.67 5.917A1.123 1.123 0 0017.876 4zm-2.208-1.085a3.123 3.123 0 114.416 4.416L8.074 19.34a3 3 0 01-1.282.76l-2.872.838a1.5 1.5 0 01-1.86-1.86l.838-2.872a3 3 0 01.759-1.281l12.01-12.011zM10.999 20a1 1 0 011-1h9a1 1 0 110 2h-9a1 1 0 01-1-1z"></path></svg>
          <span>使用 NotePod++ 编辑</span>
        </div>
      `;
      newItem.onclick = (event) => {
        event.stopPropagation();
        handleContextMenuEdit();
      };
      firstItem.after(newItem);
    }

    function inject() {
      for (const menu of document.querySelectorAll('div')) {
        const text = menu.innerText || '';
        const isPotentialMenu = menu.offsetWidth > 0 && CONFIG.MENU_KEYWORDS.every((keyword) => text.includes(keyword));

        if (isPotentialMenu) {
          if (lastContextMenuTarget && isFileManagerWin(lastContextMenuTarget)) injectNotePodMenuItem(menu);
          break;
        }
      }

      document.querySelectorAll('button').forEach((targetBtn) => {
        const btnText = targetBtn.innerText || '';
        if (!btnText.includes('新建文件夹') && !btnText.includes('上传文件夹')) return;

        const winContainer = targetBtn.closest(CONFIG.WIN_SELECTOR);
        if (!winContainer || !isFileManagerWin(winContainer)) return;

        const hasNewFileBtn = Array.from(winContainer.querySelectorAll('button')).some((button) => button.innerText.includes('新建文件') && !button.innerText.includes('文件夹'));
        if (hasNewFileBtn) return;

        const btn = document.createElement('button');
        btn.className = 'notepod-new-file-btn';
        btn.style.cssText = [
          'padding:0 12px',
          'height:28px',
          'border-radius:6px',
          'border:1px solid var(--semi-color-border, #dcdfe6)',
          'background:transparent',
          'cursor:pointer',
          'font-size:14px',
          'font-weight:600',
          'font-family:Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          'color:var(--semi-color-text-1, #41464f)',
          'display:flex',
          'align-items:center',
          'gap:4px'
        ].join(';');
        btn.innerHTML = `
          <span style="display:flex;align-items:center;justify-content:center;pointer-events:none;">
            <svg viewBox="0 0 24 24" width="14" height="14" style="flex-shrink:0;opacity:0.62;"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm0 2h7v5h5v11H6V4zm7 8a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H9a1 1 0 110-2h2v-2a1 1 0 011-1z" fill="currentColor"></path></svg>
            <span style="margin-left:4px;white-space:nowrap;">新建文件</span>
          </span>
        `;
        btn.onclick = async (event) => {
          event.stopPropagation();

          const wsPath = winContainer.__notepod_path;
          const domLastPart = getWinLastBreadcrumb(winContainer);
          const wsLastPart = wsPath === '/' ? '我的文件' : (wsPath ? wsPath.split('/').pop() : '');
          const isMatch = (wsPath === '/' && domLastPart === '我的文件') || (wsPath && wsLastPart === domLastPart);

          if (!isMatch || !wsPath) {
            showNotePodAlert('识别延迟', '路径同步中，请稍后重试或刷新页面。', winContainer);
            return;
          }

          if (wsPath === '/') {
            showNotePodAlert('操作受限', '根目录不允许创建文件。', winContainer);
            return;
          }

          const filename = await showCreateFileModal(wsPath, winContainer);
          if (!filename) return;

          const fullPath = wsPath.endsWith('/') ? wsPath + filename : `${wsPath}/${filename}`;

          try {
            const resp = await pageWindow.fetch(CONFIG.API_NEW, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: fullPath })
            });
            const res = await resp.json();
            if (res.error) {
              showNotePodAlert('创建失败', res.error, winContainer);
              return;
            }

            const refreshed = Array.from(winContainer.querySelectorAll('button')).some((button) => {
              const pathNode = button.querySelector('path');
              if (pathNode && (pathNode.getAttribute('d') || '').includes(CONFIG.REFRESH_ICON_PATH)) {
                button.click();
                return true;
              }
              return false;
            });

            if (!refreshed) console.warn('[NotePod++] Refresh button not found.');
          } catch (err) {
            showNotePodAlert('网络错误', '无法连接到后端服务。', winContainer);
          }
        };

        targetBtn.after(btn);
      });
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function startDomObserver() {
      document.addEventListener('mousedown', (event) => {
        const win = event.target.closest(CONFIG.WIN_SELECTOR);
        if (win) lastActiveWin = win;
      }, true);

      document.addEventListener('contextmenu', (event) => {
        lastContextMenuTarget = event.target.closest('[data-path]') || event.target.closest('tr') || event.target.closest('li');
      }, true);

      if (pageWindow.__notepod_observer__) pageWindow.__notepod_observer__.disconnect();
      pageWindow.__notepod_observer__ = new MutationObserver(inject);
      pageWindow.__notepod_observer__.observe(document.body, { childList: true, subtree: true });
      inject();
    }

    installWebSocketInterceptor();

    if (document.body) {
      startDomObserver();
    } else {
      document.addEventListener('DOMContentLoaded', startDomObserver, { once: true });
    }

    console.log('[NotePod++] FNOS userscript loaded.');
  }

  registerMenus();

  const enabled = gmGet(STORAGE_KEYS.enabled, true);
  const matchPattern = gmGet(STORAGE_KEYS.matchPattern, DEFAULT_MATCH_PATTERN);
  if (!enabled || !hostMatchesCurrentPage(matchPattern)) return;

  installNotePod(typeof unsafeWindow === 'undefined' ? window : unsafeWindow);
})();
