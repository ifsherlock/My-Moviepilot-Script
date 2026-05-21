// ==UserScript==
// @name         Raw to GitHub Repo
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  在 raw.githubusercontent.com 页面右上角添加返回 GitHub 仓库的按钮
// @author       Gemini
// @match        https://raw.githubusercontent.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // 1. 解析当前 URL，提取用户名和仓库名
  // 例如：/vanchKong/cloudflare/refs/heads/main/cfst.sh
  const pathParts = window.location.pathname.split('/').filter(p => p !== '');
  if (pathParts.length < 2) return; // 如果路径层级不够，退出执行

  const user = pathParts[0];
  const repo = pathParts[1];

  // 2. 拼接目标 GitHub 仓库地址
  const repoUrl = `https://github.com/${user}/${repo}`;

  // 3. 创建按钮元素
  const btn = document.createElement('a');
  btn.href = repoUrl;
  btn.textContent = '🏠 返回仓库主页';
  btn.target = '_blank'; // 可选：如果希望在当前页跳转，删除此行即可

  // 4. 设置 UI 样式 (高度还原 GitHub 原生绿色按钮风格)
  Object.assign(btn.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '999999',
    padding: '5px 16px',
    backgroundColor: '#238636',
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '20px',
    border: '1px solid rgba(240, 246, 252, 0.1)',
    borderRadius: '6px',
    boxShadow: '0 0 transparent, 0 0 transparent, 0 1px 0 rgba(27, 31, 36, 0.1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    transition: 'background-color 0.2s cubic-bezier(0.3, 0, 0.5, 1)',
    cursor: 'pointer'
  });

  // 添加 Hover 交互效果
  btn.onmouseover = () => btn.style.backgroundColor = '#2ea043';
  btn.onmouseout = () => btn.style.backgroundColor = '#238636';

  // 5. 挂载到页面
  document.body.appendChild(btn);
})();
