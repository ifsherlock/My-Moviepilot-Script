// ==UserScript==
// @name         GitHub Repo Linker
// @namespace    https://github.com/jaysh/
// @version      1.0.0
// @description  点击悬浮框，自动从 GitHub Raw 链接跳转到对应的仓库页面
// @author       Jaysh
// @homepageURL  https://github.com/jaysh/
// @supportURL   https://github.com/jaysh/
// @match        https://raw.githubusercontent.com/*
// @icon         https://github.githubassets.com/favicons/favicon-dark.svg
// @inject-into  content
// @license      MIT
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @grant        GM.registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addElement
// @grant        GM.addElement
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM.addStyle
// @grant        GM_openInTab
// @grant        GM.openInTab
// @connect      raw.githubusercontent.com
// @connect      github.com
// @run-at       document-end
// @name:zh-CN   GitHub 仓库链接跳转助手
// @description:zh-CN  点击悬浮框，自动解析 GitHub Raw 链接并跳转到对应的仓库页面
// @downloadURL https://github.com/ifsherlock/My-Moviepilot-Script/raw/refs/heads/main/GitHub%20仓库链接跳转助手.user.js
// @updateURL   https://github.com/ifsherlock/My-Moviepilot-Script/raw/refs/heads/main/GitHub%20仓库链接跳转助手.user.js
// ==/UserScript==

(() => {
  'use strict';

  /**
   * 从 GitHub Raw URL 解析出仓库地址
   * 规则：https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path...}
   *    -> https://github.com/{owner}/{repo}
   */
  function parseGitHubRepoUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      // 匹配 raw.githubusercontent.com 域名
      if (url.hostname === 'raw.githubusercontent.com') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        // 路径格式: /{owner}/{repo}/{branch}/{...}
        if (pathParts.length >= 2) {
          const owner = pathParts[0];
          const repo = pathParts[1];
          return `https://github.com/${owner}/${repo}`;
        }
      }
      // 如果不是 raw URL，尝试直接匹配 github.com 的用户/仓库
      if (url.hostname === 'github.com') {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          const owner = pathParts[0];
          const repo = pathParts[1];
          return `https://github.com/${owner}/${repo}`;
        }
      }
      return null;
    } catch (e) {
      console.error('[GitHub Repo Linker] URL 解析失败:', e);
      return null;
    }
  }

  /**
   * 从当前页面中自动发现 GitHub Raw 链接
   */
  function findRawUrlsOnPage() {
    const rawUrls = new Set();
    
    // 1. 检查当前页面 URL 本身
    if (window.location.hostname === 'raw.githubusercontent.com') {
      rawUrls.add(window.location.href);
    }
    
    // 2. 扫描页面中的所有链接
    const links = document.querySelectorAll('a[href*="raw.githubusercontent.com"]');
    links.forEach(link => {
      rawUrls.add(link.href);
    });
    
    // 3. 扫描页面文本中的 GitHub Raw 链接
    const bodyText = document.body.innerText || '';
    const regex = /https?:\/\/raw\.githubusercontent\.com\/[^\s"'<>]+/gi;
    const matches = bodyText.match(regex);
    if (matches) {
      matches.forEach(m => rawUrls.add(m));
    }
    
    // 4. 扫描所有的 code/pre 标签中的链接
    const codeElements = document.querySelectorAll('code, pre, .highlight');
    codeElements.forEach(el => {
      const text = el.textContent || '';
      const codeMatches = text.match(/https?:\/\/raw\.githubusercontent\.com\/[^\s"'<>]+/gi);
      if (codeMatches) {
        codeMatches.forEach(m => rawUrls.add(m));
      }
    });
    
    return Array.from(rawUrls);
  }

  /**
   * 创建悬浮框样式
   */
  function injectStyles() {
    const styleId = 'github-repo-linker-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #github-repo-linker-floater {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 2147483647;
        background: linear-gradient(135deg, #24292f 0%, #57606a 100%);
        color: #ffffff;
        padding: 14px 22px;
        border-radius: 12px;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), 0 1px 4px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
        border: 1px solid rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
      }
      #github-repo-linker-floater:hover {
        background: linear-gradient(135deg, #1b1f23 0%, #444c56 100%);
        transform: translateY(-3px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.15);
        border-color: rgba(255, 255, 255, 0.25);
      }
      #github-repo-linker-floater:active {
        transform: translateY(-1px) scale(0.98);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.1s ease;
      }
      #github-repo-linker-floater .gl-icon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
      }
      #github-repo-linker-floater .gl-text {
        white-space: nowrap;
      }
      #github-repo-linker-floater.loading {
        opacity: 0.75;
        cursor: wait;
      }
      #github-repo-linker-floater .gl-spinner {
        display: none;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #ffffff;
        border-radius: 50%;
        animation: gl-spin 0.7s linear infinite;
        flex-shrink: 0;
      }
      #github-repo-linker-floater.loading .gl-spinner {
        display: inline-block;
      }
      #github-repo-linker-floater.loading .gl-icon {
        display: none;
      }
      @keyframes gl-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* 仓库列表弹窗 */
      #github-repo-linker-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        animation: gl-fadeIn 0.2s ease;
      }
      @keyframes gl-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      #github-repo-linker-modal {
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 560px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: gl-slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes gl-slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #github-repo-linker-modal .gl-modal-header {
        padding: 20px 24px 16px;
        border-bottom: 1px solid #e1e4e8;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #github-repo-linker-modal .gl-modal-title {
        font-size: 18px;
        font-weight: 700;
        color: #24292f;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #github-repo-linker-modal .gl-modal-close {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: #f6f8fa;
        color: #57606a;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      #github-repo-linker-modal .gl-modal-close:hover {
        background: #e1e4e8;
        color: #24292f;
      }
      #github-repo-linker-modal .gl-modal-body {
        padding: 16px 24px 24px;
      }
      #github-repo-linker-modal .gl-repo-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        color: #24292f;
        text-decoration: none;
      }
      #github-repo-linker-modal .gl-repo-item:hover {
        background: #f6f8fa;
        border-color: #d0d7de;
      }
      #github-repo-linker-modal .gl-repo-item .gl-repo-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        color: #57606a;
      }
      #github-repo-linker-modal .gl-repo-item .gl-repo-info {
        flex: 1;
        min-width: 0;
      }
      #github-repo-linker-modal .gl-repo-item .gl-repo-name {
        font-weight: 600;
        font-size: 15px;
        color: #0969da;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #github-repo-linker-modal .gl-repo-item .gl-repo-path {
        font-size: 12px;
        color: #57606a;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-top: 2px;
      }
      #github-repo-linker-modal .gl-empty {
        text-align: center;
        padding: 32px 16px;
        color: #57606a;
      }
      #github-repo-linker-modal .gl-empty svg {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        color: #d0d7de;
      }
      #github-repo-linker-modal .gl-badge {
        display: inline-block;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 12px;
        background: #ddf4ff;
        color: #0969da;
        font-weight: 600;
        margin-left: 8px;
        white-space: nowrap;
      }

      /* 暗色模式 */
      @media (prefers-color-scheme: dark) {
        #github-repo-linker-modal {
          background: #1c2128;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        #github-repo-linker-modal .gl-modal-header {
          border-bottom-color: #30363d;
        }
        #github-repo-linker-modal .gl-modal-title {
          color: #e6edf3;
        }
        #github-repo-linker-modal .gl-modal-close {
          background: #30363d;
          color: #8b949e;
        }
        #github-repo-linker-modal .gl-modal-close:hover {
          background: #444c56;
          color: #e6edf3;
        }
        #github-repo-linker-modal .gl-repo-item {
          color: #e6edf3;
        }
        #github-repo-linker-modal .gl-repo-item:hover {
          background: #22272e;
          border-color: #30363d;
        }
        #github-repo-linker-modal .gl-repo-item .gl-repo-name {
          color: #58a6ff;
        }
        #github-repo-linker-modal .gl-repo-item .gl-repo-path {
          color: #8b949e;
        }
        #github-repo-linker-modal .gl-empty {
          color: #8b949e;
        }
        #github-repo-linker-modal .gl-empty svg {
          color: #30363d;
        }
        #github-repo-linker-modal .gl-badge {
          background: #1f3a5f;
          color: #58a6ff;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 创建悬浮按钮
   */
  function createFloater() {
    const floater = document.createElement('div');
    floater.id = 'github-repo-linker-floater';
    floater.title = 'GitHub 仓库链接跳转';
    floater.innerHTML = `
      <svg class="gl-icon" viewBox="0 0 16 16" fill="currentColor">
        <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      <span class="gl-text">跳转仓库</span>
      <div class="gl-spinner"></div>
    `;
    return floater;
  }

  /**
   * 创建仓库列表弹窗
   */
  function createModal(repos) {
    // 移除已有弹窗
    const existingOverlay = document.getElementById('github-repo-linker-modal-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'github-repo-linker-modal-overlay';

    const modal = document.createElement('div');
    modal.id = 'github-repo-linker-modal';

    let repoItemsHtml = '';
    if (repos.length === 0) {
      repoItemsHtml = `
        <div class="gl-empty">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <p style="margin:8px 0;font-size:15px;font-weight:600;">未发现 GitHub Raw 链接</p>
          <p style="margin:4px 0;font-size:13px;">当前页面中没有检测到 raw.githubusercontent.com 链接</p>
        </div>
      `;
    } else {
      repos.forEach((item, idx) => {
        const displayRepo = `${item.owner}/${item.repo}`;
        const filePath = item.filePath ? '/' + item.filePath : '';
        repoItemsHtml += `
          <div class="gl-repo-item" data-repo-url="${encodeURIComponent(item.repoUrl)}" data-idx="${idx}">
            <svg class="gl-repo-icon" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>
            </svg>
            <div class="gl-repo-info">
              <div class="gl-repo-name">${displayRepo}</div>
              <div class="gl-repo-path">${item.rawUrl.replace(/^https?:\/\//, '')}</div>
            </div>
            <span class="gl-badge">${item.count > 1 ? item.count + '处' : '跳转'}</span>
          </div>
        `;
      });
    }

    modal.innerHTML = `
      <div class="gl-modal-header">
        <div class="gl-modal-title">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          发现的 GitHub 仓库
        </div>
        <button class="gl-modal-close" title="关闭">&times;</button>
      </div>
      <div class="gl-modal-body">
        ${repoItemsHtml}
      </div>
    `;

    overlay.appendChild(modal);

    // 关闭弹窗
    const closeModal = () => overlay.remove();
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    modal.querySelector('.gl-modal-close').addEventListener('click', closeModal);
    
    // 仓库项目点击事件（使用 GM_openInTab 绕过沙盒限制）
    modal.querySelectorAll('.gl-repo-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const repoUrl = decodeURIComponent(item.dataset.repoUrl);
        if (repoUrl) {
          if (typeof GM_openInTab !== 'undefined') {
            GM_openInTab(repoUrl, { active: true });
          } else {
            window.open(repoUrl, '_blank');
          }
        }
      });
    });
    
    // ESC 关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return overlay;
  }

  /**
   * 解析并分组 raw URL
   */
  function groupRawUrls(rawUrls) {
    const repoMap = new Map();
    
    rawUrls.forEach(rawUrl => {
      const parsed = parseGitHubRepoUrl(rawUrl);
      if (!parsed) return;
      
      const url = new URL(rawUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const owner = pathParts[0];
      const repo = pathParts[1];
      const filePath = pathParts.slice(3).join('/');
      const key = `${owner}/${repo}`;
      
      if (!repoMap.has(key)) {
        repoMap.set(key, {
          owner,
          repo,
          repoUrl: parsed,
          rawUrl: rawUrl,
          filePath: filePath,
          count: 0,
          rawUrls: []
        });
      }
      
      const entry = repoMap.get(key);
      entry.count++;
      entry.rawUrls.push(rawUrl);
    });
    
    return Array.from(repoMap.values());
  }

  /**
   * 主初始化函数
   */
  function init() {
    injectStyles();
    
    const floater = createFloater();
    
    // 点击悬浮框
    floater.addEventListener('click', () => {
      if (floater.classList.contains('loading')) return;
      
      floater.classList.add('loading');
      
      // 模拟短暂延迟（给用户视觉反馈）
      setTimeout(() => {
        const rawUrls = findRawUrlsOnPage();
        const repos = groupRawUrls(rawUrls);
        
        if (repos.length === 1) {
          // 只有一个仓库，直接跳转（使用 GM_openInTab 绕过沙盒限制）
          if (typeof GM_openInTab !== 'undefined') {
            GM_openInTab(repos[0].repoUrl, { active: true });
          } else {
            window.open(repos[0].repoUrl, '_blank');
          }
        } else {
          // 多个仓库或无仓库，弹出列表
          const modal = createModal(repos);
          document.body.appendChild(modal);
        }
        
        floater.classList.remove('loading');
      }, 300);
    });

    // 拖拽功能
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    floater.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // 只响应左键
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floater.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      floater.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;
      
      // 限制在视口内
      const maxX = window.innerWidth - floater.offsetWidth;
      const maxY = window.innerHeight - floater.offsetHeight;
      newLeft = Math.max(0, Math.min(newLeft, maxX));
      newTop = Math.max(0, Math.min(newTop, maxY));
      
      floater.style.left = newLeft + 'px';
      floater.style.top = newTop + 'px';
      floater.style.right = 'auto';
      floater.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      floater.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // 如果鼠标没有移动，认为是点击
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) {
        // It was a click, handled by click event
      }
    });

    document.body.appendChild(floater);
  }

  // 等待 DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
