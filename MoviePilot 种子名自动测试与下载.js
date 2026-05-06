// ==UserScript==
// @name         MoviePilot 种子名自动测试与下载 (增强版 - API Key )
// @namespace    http://tampermonkey.net/
// @version      3.2.0
// @description  缝合两版脚本功能，在各大 PT 站点详情页自动提取种子名称，发送至 MoviePilot 进行识别，支持手动匹配和一键推送下载。使用 API Key，无需账号密码。
// @author       Arthur Cole、yubanmeiqin9048 
// @match        https://*/details.php?id=*
// @match        https://*/details_movie.php?id=*
// @match        https://*/details_tv.php?id=*
// @match        https://*/details_animate.php?id=*
// @match        https://totheglory.im/t/*
// @match        https://bangumi.moe/*
// @match        https://*.acgnx.se/*
// @match        https://*.dmhy.org/*
// @match        https://nyaa.si/*
// @match        https://mikanani.me/*
// @match        https://*.skyey2.com/*
// @match        https://*.m-team.cc/detail/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *
// @license      MIT
// ==/UserScript==

GM_addStyle(`
  .mp-modal { display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); font-family: sans-serif;}
  .mp-modal-content { background-color: white; margin: 10% auto; padding: 20px; border-radius: 8px; width: 60%; max-width: 600px; position: relative; color:#333; box-shadow: 0 4px 12px rgba(0,0,0,0.2);}
  .mp-close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; position: absolute; right: 15px; top: 5px; }
  .mp-close:hover { color: black; }
  .mp-input-group { margin-bottom: 15px; }
  .mp-input-group label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px;}
  .mp-input-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px;}
  .mp-search-btn { background-color: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; margin-top: 5px; font-size: 14px;}
  .mp-search-btn:hover { background-color: #0056b3; }
  .mp-results-container { margin-top: 20px; max-height: 300px; overflow-y: auto;}
  .mp-result-item { padding: 10px; border: 1px solid #ddd; margin-bottom: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;}
  .mp-result-item:hover { background-color: #f0f8ff; border-color:#007bff; }
  .mp-result-title { font-weight: bold; margin-bottom: 5px; }
  .mp-result-year { color: #666; font-size: 0.9em; }
  .mp-result-type { display: inline-block; background-color: #2775b6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-right: 5px; }

  /* 进度通知 UI 样式 */
  #mp-toast-container { position: fixed; top: 20px; right: 20px; z-index: 10001; display: flex; flex-direction: column; gap: 10px; }
  .mp-toast { background: white; border-left: 5px solid #007bff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); padding: 15px 20px; border-radius: 4px; display: flex; align-items: flex-start; justify-content: space-between; min-width: 280px; max-width: 400px; font-family: sans-serif; transition: opacity 0.3s ease; }
  .mp-toast.info { border-color: #007bff; }
  .mp-toast.success { border-color: #28a745; }
  .mp-toast.error { border-color: #dc3545; }
  .mp-toast-content { display: flex; flex-direction: column; width: 100%; }
  .mp-toast-title { font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #333; }
  .mp-toast-msg { font-size: 13px; color: #666; word-break: break-all; line-height: 1.4; }
  .mp-toast-close { cursor: pointer; color: #999; font-weight: bold; font-size: 18px; margin-left: 15px; line-height: 14px; }
  .mp-toast-close:hover { color: #333; }

  /* M-Team 标题下方专用展示块 */
  .mp-mteam-panel { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--mt-line-color, #e5e7eb); }
  .mp-mteam-title { font-size: 12px; color: #6b7280; margin-bottom: 8px; font-weight: 600; letter-spacing: .2px; }
  .mp-mteam-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; line-height: 1.2; }
`);

// ---------- 全局配置管理 ----------
let mpUrl = GM_getValue('mp_url', '');
let mpApiKey = GM_getValue('mp_api_key', ''); // 改用 API Key
let mpTmdbKey = GM_getValue('mp_tmdb_key', '');
let mpDebug = GM_getValue('mp_debug', false);

let mpLastMTeamBtnLogKey = '';
let mpLastMTeamBtnMissingLogKey = '';
let mpLastMTeamMountMissingLogKey = '';
let mpMTeamRuntimeDownloadLinks = {};
let mpMTeamRuntimeListenerInstalled = false;
let mpMTeamAutoPrefetchState = {};
let mpMTeamMutationWatcherState = {};

function debugLog(...args) {
  if (!mpDebug) return;
  console.log('[MoviePilot-NameTest]', ...args);
}

// 通用认证请求头
function getAuthHeaders() {
    return {
        "user-agent": navigator.userAgent,
        "content-type": "application/json",
        "X-API-KEY": mpApiKey
    };
}

function toPreview(data, limit = 360) {
  try {
    let text = typeof data === 'string' ? data : JSON.stringify(data);
    return text.length > limit ? text.slice(0, limit) + ' ...' : text;
  } catch (e) {
    return String(data);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getHostFromUrl(rawUrl) {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

function isAllowedRequestUrl(rawUrl) {
  try {
    const host = new URL(rawUrl, window.location.origin).hostname.toLowerCase();
    if (host === 'api.themoviedb.org') return true;
    const mpHost = getHostFromUrl(mpUrl);
    return Boolean(mpHost) && host === mpHost;
  } catch (e) {
    return false;
  }
}

function requestWithGuard(options) {
  const targetUrl = options?.url || '';
  if (!isAllowedRequestUrl(targetUrl)) {
    debugLog('blocked request by host guard', { targetUrl, mpUrl });
    if (typeof options?.onerror === 'function') {
      options.onerror({ status: 0, responseText: 'Blocked by host guard' });
    }
    return;
  }
  GM_xmlhttpRequest(options);
}

function showConfigModal() {
    let existingModal = document.getElementById('mp-config-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'mp-config-modal';
    modal.className = 'mp-modal';
    modal.innerHTML = `
      <div class="mp-modal-content">
        <span class="mp-close" id="mp-config-close">&times;</span>
        <h3 style="margin-top:0; color:#007bff; border-bottom: 1px solid #eee; padding-bottom: 10px;">⚙️ MoviePilot 配置项 (API Key 版)</h3>
        <p style="font-size: 13px; color: #666;">初次使用需配置 MoviePilot 接口信息，配置后脚本方可正常运行。</p>
        <div class="mp-input-group">
          <label>MoviePilot 地址 (需带 http/https 及端口):</label>
          <input type="text" id="mp-input-url" placeholder="例如：http://192.168.1.100:3000" value="${escapeHtmlAttr(mpUrl)}">
        </div>
        <div class="mp-input-group">
          <label>API Key (令牌):</label>
          <input type="password" id="mp-input-api-key" placeholder="请输入 MoviePilot 的 API 令牌" value="${escapeHtmlAttr(mpApiKey)}">
          <p style="margin:6px 0 0;color:#666;font-size:12px;">可在 MoviePilot 设置 -> 运营 -> API 密钥中获取。</p>
        </div>
        <div class="mp-input-group">
          <label>TMDB API Key (可选，用于失败时的高级匹配):</label>
          <input type="text" id="mp-input-tmdb-key" placeholder="请输入你自己的 TMDB API Key" value="${escapeHtmlAttr(mpTmdbKey)}">
        </div>
        <button class="mp-search-btn" id="mp-save-btn" style="width: 100%; margin-top: 10px; padding: 10px;">💾 保存配置</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';

    document.getElementById('mp-config-close').onclick = () => modal.remove();
    document.getElementById('mp-save-btn').onclick = () => {
        let url = document.getElementById('mp-input-url').value.trim().replace(/\/$/, "");
        let apiKey = document.getElementById('mp-input-api-key').value.trim();
        let tmdbKey = document.getElementById('mp-input-tmdb-key').value.trim();
        
        if (!url || !apiKey) {
            alert("请完整填写 MoviePilot 地址和 API Key！");
            return;
        }

        try {
            const parsed = new URL(url);
            if (!/^https?:$/i.test(parsed.protocol)) {
                alert("MoviePilot 地址必须是 http:// 或 https:// 开头。");
                return;
            }
        } catch (e) {
            alert("MoviePilot 地址格式不正确，请输入完整 URL（含协议和端口）。");
            return;
        }
        
        GM_setValue('mp_url', url);
        GM_setValue('mp_api_key', apiKey);
        GM_setValue('mp_tmdb_key', tmdbKey);
        
        // 更新内存变量
        mpUrl = url;
        mpApiKey = apiKey;
        mpTmdbKey = tmdbKey;
        
        alert("保存成功！脚本将开始运行。");
        modal.remove();
        
        // 触发一次注入检测
        insertMpRow();
    };
}

// 注册油猴菜单栏命令
GM_registerMenuCommand("⚙️ 设置 MoviePilot", showConfigModal);
GM_registerMenuCommand("🧪 切换调试日志", () => {
    mpDebug = !mpDebug;
    GM_setValue('mp_debug', mpDebug);
    alert(`调试日志已${mpDebug ? '开启' : '关闭'}（刷新页面后持续生效）`);
});

// ---------- 进度通知组件 ----------
function createToast(title, msg, type) {
    let container = document.getElementById('mp-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mp-toast-container';
        document.body.appendChild(container);
    }
    let id = 'toast-' + Date.now() + Math.floor(Math.random() * 1000);
    let toast = document.createElement('div');
    toast.id = id;
    toast.className = `mp-toast ${type}`;
    toast.innerHTML = `
        <div class="mp-toast-content">
            <div class="mp-toast-title">${escapeHtml(title)}</div>
            <div class="mp-toast-msg" id="msg-${id}">${escapeHtml(msg)}</div>
        </div>
        <div class="mp-toast-close" onclick="this.parentElement.remove()" title="关闭">&times;</div>
    `;
    container.appendChild(toast);
    return id;
}

function updateToast(id, title, msg, type) {
    let toast = document.getElementById(id);
    if (toast) {
        toast.className = `mp-toast ${type}`;
        toast.querySelector('.mp-toast-title').textContent = title;
        toast.querySelector(`#msg-${id}`).textContent = msg;
    }
}

function removeToast(id) {
    let toast = document.getElementById(id);
    if (toast) {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }
}

// ---------- UI 辅助工具 ----------
function renderTag(type, string, background_color) {
  const safeString = escapeHtml(string);
  if (type == 'common') {
    return `<span style="background-color:${background_color};color:#ffffff;border-radius:0;font-size:12px;margin:0 4px 0 0;padding:1px 2px">${safeString}</span>`
  } else if (type == 'mteam') {
    return `<span style="display:inline-flex;align-items:center;background-color:${background_color};color:#ffffff;border-radius:6px;font-size:12px;height:20px;padding:0 7px;">${safeString}</span>`;
  } else {
    return `<span class="flex justify-center items-center rounded-md text-[12px] h-[18px] mr-2 px-[5px] font-bold" style="background-color:${background_color};color:#ffffff;">${safeString}</span>`
  }
}

function renderMoviepilotTag(type, tag) {
  if (type === "mteam") {
    return `<div class="mp-mteam-tags">${tag}</div>`;
  }
  if (type == "common") {
    return `<td class="rowhead nowrap" valign="top" align="right">MoviePilot</td><td class="rowfollow" valign="top" align="left">${tag}</td>`;
  } else {
    return tag
  }
}

function getSize(sizeStr) {
  if (!sizeStr) return 0;
  let match = sizeStr.match(/(\d+\.?\d*)\s*(GB|MB|KB|TB)/i);
  if (!match) return 0;
  let size = parseFloat(match[1]);
  let unit = match[2].toUpperCase();
  switch (unit) {
    case 'MB': return size * 1024 ** 2;
    case 'GB': return size * 1024 ** 3;
    case 'TB': return size * 1024 ** 4;
    default: return 0;
  }
}

function escapeHtmlAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function normalizeTorrentTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = String(rawTitle).replace(/\s+/g, ' ').trim();

  title = title
    .replace(/\.torrent$/i, '')
    .replace(/\.(mkv|mp4|avi|ts|m2ts|flv|wmv)$/i, '');

  for (let i = 0; i < 6; i++) {
    let next = title.replace(/^\s*(?:\[[^\]]{1,30}\]|\([^\)]{1,30}\)|【[^】]{1,30}】|<[^>]{1,30}>)(?:[\s._-]+|$)/, '');
    if (next === title) break;
    title = next;
  }

  title = title
    .replace(/^[^A-Za-z0-9\u4e00-\u9fa5]+/, '')
    .replace(/^[A-Za-z0-9]{2,10}\]\s*/, '')
    .replace(/^[\]\)\】\}]+/, '');

  title = title.replace(/[._]+/g, ' ');
  let noisyPart = title.match(/\b(?:4320p|2160p|1080p|720p|480p|web[-\s]?dl|webrip|bluray|bdrip|hdtv|dvdrip|remux|h\.?26[45]|x26[45]|hevc|avc|aac(?:\d\.\d)?|ddp?\d(?:\.\d)?|dts(?:-hd)?|atmos|hdr10\+?|dolby[\s-]?vision|10bit|8bit)\b/i);
  if (noisyPart && noisyPart.index > 0) {
    title = title.slice(0, noisyPart.index);
  }

  title = title.replace(/\s+free\s+\d+\s*h(?:\s+\d+\s*min)?$/i, '');
  title = title.replace(/\s+-[A-Za-z0-9][A-Za-z0-9._-]*$/, '');
  return title.replace(/\s+/g, ' ').trim();
}

function isMTeamHost() {
  return /(^|\.)m-team\.cc$/i.test(window.location.hostname);
}

function isMTeamDetailPage() {
  return isMTeamHost() && /^\/detail\/\d+/.test(window.location.pathname);
}

function shouldProcessCurrentPage() {
  if (isMTeamHost()) return isMTeamDetailPage();
  return true;
}

function isSpringSundaySite() {
  return /(^|\.)springsunday\.net$/i.test(window.location.hostname);
}

function isQingwaSite() {
  return /(^|\.)qingwa\./i.test(window.location.hostname) || /(^|\.)keepfrds\.com$/i.test(window.location.hostname);
}

function isQingwaLikeLayout() {
  if (isSpringSundaySite() || isQingwaSite()) return true;
  return Boolean(document.getElementById('qingwa-head') && document.querySelector('h1#top'));
}

function extractQingwaTitle() {
  const h1 = document.querySelector('h1#top');
  if (!h1) return '';

  let title = cleanText(h1.textContent || '');
  title = title
    .replace(/\[[^\]]*(免费|free|折扣|促销)[^\]]*\]/ig, ' ')
    .replace(/剩余时间[:：].*$/i, ' ')
    .replace(/\b(通过|未审|已审)\b.*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  title = normalizeTorrentTitle(title);
  return title;
}

function cleanupMpUi() {
  let row = document.getElementById('mp-row-flag');
  if (row) {
    let tr = row.closest('tr');
    if (tr) tr.remove();
    else row.remove();
  }
  document.querySelectorAll('.mp-modal').forEach(el => el.remove());
  let toast = document.getElementById('mp-toast-container');
  if (toast) toast.remove();
}

function findMTeamTitleAnchor() {
  const exactSelector = '#app-content > div > div.app-content__inner.px-\\[40px\\].flex.flex-col.justify-between > div.mx-auto.w-full > div.flex.py-5.mb-5.border-0.border-b.border-solid.border-\\[--mt-line-color\\].sticky.items-start.top-0.z-\\[999\\].bg-mt-primary-1.text-\\[--mt-text-base\\] > div.flex-grow.w-1.flex.flex-col.justify-between > div:nth-child(2) > div.ant-space.css-4dguzz.ant-space-horizontal.ant-space-align-center.ant-space-gap-row-small.ant-space-gap-col-small.gap-x-\\[18px\\].gap-y-0.text-\\[--mt-text-base\\]';
  const looseSelector = '#app-content div.app-content__inner.px-\\[40px\\] div.flex-grow.w-1.flex.flex-col.justify-between > div:nth-child(2) > div.ant-space.gap-x-\\[18px\\].gap-y-0.text-\\[--mt-text-base\\]';
  let node = document.querySelector(exactSelector);
  if (!node) {
    node = document.querySelector(looseSelector)
      || document.querySelector('h2 > span:nth-child(3), h2 > span, h2');
  }
  return node || null;
}

function createMTeamMountNode() {
  const anchor = findMTeamTitleAnchor();
  if (!anchor) {
    const missKey = `${window.location.pathname}|mount-missing`;
    if (mpLastMTeamMountMissingLogKey !== missKey) {
      mpLastMTeamMountMissingLogKey = missKey;
      debugLog('m-team mount not found: waiting for title anchor');
    }
    return null;
  }

  const anchorText = cleanText(anchor.textContent || '');
  if (!anchorText || /^m-team$/i.test(anchorText) || anchorText.length < 6) {
    return null;
  }

  const panel = document.createElement('div');
  panel.id = 'mp-row-flag';
  panel.className = 'mp-mteam-panel';
  panel.innerHTML = '<div class="mp-mteam-title">MoviePilot</div><div id="mp-mteam-content" class="mp-mteam-tags">初始化中...</div>';
  anchor.insertAdjacentElement('afterend', panel);

  return panel.querySelector('#mp-mteam-content') || panel;
}

function isMTeamPageDataReady() {
  if (!isMTeamDetailPage()) return false;
  const titleAnchor = findMTeamTitleAnchor();
  const anchorText = cleanText(titleAnchor?.textContent || '');
  const fieldCount = document.querySelectorAll('.ant-descriptions-item-label').length;
  const pageTitle = cleanText(document.title || '');
  const nativeBtn = findMTeamNativeDownloadButton();

  if (!titleAnchor) return false;
  if (!anchorText || /^m-team$/i.test(anchorText) || anchorText.length < 6) return false;
  if (nativeBtn) return true;
  if (fieldCount >= 2) return true;
  if (pageTitle && !/^m-team$/i.test(pageTitle) && /detail|種子詳情|torrent/i.test(pageTitle)) return true;
  return false;
}

function stripEpisodeInfo(title) {
  return String(title || '')
    .replace(/\bS\d{1,2}E\d{1,3}\b/ig, ' ')
    .replace(/\bE\d{1,3}\b/ig, ' ')
    .replace(/\b第\s*\d+\s*[季集]\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSubtitleCandidates(subtitle) {
  let results = [];
  let add = (v) => {
    let val = String(v || '').replace(/\s+/g, ' ').trim();
    if (val && !results.includes(val)) results.push(val);
  };

  if (!subtitle) return results;
  let clean = String(subtitle || '')
    .replace(/\*[^*]{1,40}\*/g, ' ')
    .replace(/\[[^\]]{1,40}\]/g, ' ')
    .replace(/[|｜]/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  clean.split(/\s*\/\s*/).forEach((part) => {
    let p = String(part || '').trim();
    if (!p) return;
    p = p
      .replace(/(?:评论音轨|多国语字幕|字幕|中字|簡繁|简繁|国语|日语|英语|粤语|双语|音轨|內封|外挂|內嵌).*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    add(p);

    let words = p.match(/\b[A-Za-z][A-Za-z0-9'’-]{3,}\b/g) || [];
    words.forEach(add);
  });

  return results.slice(0, 8);
}

function getRecognitionCandidates(rawTitle, subtitle = '') {
  let candidates = [];
  let addCandidate = (title) => {
    let val = String(title || '')
      .replace(/\s+/g, ' ')
      .replace(/\.torrent$/i, '')
      .replace(/\.(mkv|mp4|avi|ts|m2ts|flv|wmv)$/i, '')
      .replace(/^[A-Za-z0-9]{2,10}\]\s*/, '')
      .trim();
    if (val && !candidates.includes(val)) candidates.push(val);
  };

  let normalized = normalizeTorrentTitle(rawTitle);
  let withoutEpisode = stripEpisodeInfo(normalized);
  let slashAlias = normalized.split(/\s*\/\s*/)[0].trim();
  let hasTvPattern = /\bS\d{1,2}E\d{1,3}\b/i.test(normalized)
    || /\bE\d{1,3}\b/i.test(normalized)
    || /第\s*\d+\s*[季集]/.test(normalized);

  addCandidate(rawTitle);
  addCandidate(normalized);
  addCandidate(slashAlias);
  addCandidate(withoutEpisode);
  extractSubtitleCandidates(subtitle).forEach(addCandidate);

  // 电影常见格式兜底
  if (!hasTvPattern) {
    let yearMatch = normalized.match(/\b(?:19|20)\d{2}\b/);
    if (yearMatch) {
      let year = yearMatch[0];
      let noYear = normalized
        .replace(new RegExp(`\\b${year}\\b`, 'g'), ' ')
        .replace(/\(\s*\)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      addCandidate(noYear);
      if (noYear) {
        addCandidate(`${noYear} ${year}`);
        addCandidate(`${noYear} (${year})`);
      }
    }
  }

  return candidates;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function addUnique(list, value) {
  const val = cleanText(value);
  if (val && !list.includes(val)) list.push(val);
}

function isLikelyTagCloudTitle(title) {
  const val = cleanText(title);
  if (!val) return true;
  const pipeCount = (val.match(/\|/g) || []).length;
  if (pipeCount >= 5 && !/\bS\d{1,2}E\d{1,3}\b/i.test(val)) return true;

  const words = val.split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const upperShortWords = words.filter(w => /^[A-Z0-9]{2,10}$/.test(w)).length;
  if (words.length >= 8 && upperShortWords / words.length > 0.65) return true;
  return false;
}

function scoreTitleCandidate(title) {
  const val = cleanText(title);
  if (!val) return -999;

  let score = 0;
  if (val.length >= 6 && val.length <= 220) score += 2;
  if (/[A-Za-z\u4e00-\u9fa5]/.test(val)) score += 1;
  if (/\bS\d{1,2}E\d{1,3}\b/i.test(val)) score += 3;
  if (/\b(?:4320p|2160p|1080p|720p|web[-\s]?dl|webrip|bluray|h\.?26[45]|x26[45]|hevc)\b/i.test(val)) score += 2;
  if (/\b(?:19|20)\d{2}\b/.test(val)) score += 1;

  const pipeCount = (val.match(/\|/g) || []).length;
  if (pipeCount >= 3) score -= 3;
  if (isLikelyTagCloudTitle(val)) score -= 4;
  if (!/\s/.test(val) && val.length < 8) score -= 2;

  return score;
}

function pickBestTitleCandidate(candidates) {
  let best = '';
  let bestScore = -999;
  candidates.forEach((candidate) => {
    const score = scoreTitleCandidate(candidate);
    if (score > bestScore) {
      best = cleanText(candidate);
      bestScore = score;
    }
  });
  return best;
}

function collectAntFields() {
  const fields = [];
  document.querySelectorAll('.ant-descriptions-item-label').forEach(label => {
    const key = cleanText(label.textContent);
    const value = cleanText(label.nextElementSibling?.textContent || '');
    if (key && value) fields.push({ key, value });
  });
  return fields;
}

function pickAntFieldValue(fields, patterns) {
  for (const field of fields) {
    if (patterns.some(pattern => pattern.test(field.key))) {
      return field.value;
    }
  }
  return '';
}

function extractLinkFromString(text) {
  const raw = String(text || '')
    .replace(/\\\//g, '/')
    .replace(/\\u002F/ig, '/')
    .replace(/\\u003A/ig, ':')
    .replace(/\\u003F/ig, '?')
    .replace(/\\u003D/ig, '=')
    .replace(/\\u0026/ig, '&')
    .replace(/\\u0025/ig, '%')
    .replace(/&amp;/g, '&');
  const match = raw.match(/https?:\/\/[^\s"'`<>\\]+|\/api\/rss\/dlv2\?[^\s"'`<>\\]+|\/api\/torrent\/download\?[^\s"'`<>\\]+/i);
  if (!match) return '';
  try {
    return new URL(match[0], window.location.origin).href;
  } catch (e) {
    return '';
  }
}

function findMTeamNativeDownloadButton() {
  const exactSelector = '#app-content > div > div.app-content__inner.px-\\[40px\\].flex.flex-col.justify-between > div.mx-auto.w-full > div.flex.py-5.mb-5.border-0.border-b.border-solid.border-\\[--mt-line-color\\].sticky.items-start.top-0.z-\\[999\\].bg-mt-primary-1.text-\\[--mt-text-base\\] > div.flex-grow.w-1.flex.flex-col.justify-between > div.flex.justify-between > div > div > div > div:nth-child(4)';
  return document.querySelector(exactSelector)
    || document.querySelector('div.flex.justify-between [class*="download"], div.flex.justify-between button, div.flex.justify-between a');
}

function deepFindDownloadLinkInObject(root, maxNodes = 5000) {
  if (!root) return '';
  const stack = [root];
  const visited = new Set();
  let count = 0;

  while (stack.length && count < maxNodes) {
    const current = stack.pop();
    count++;
    if (!current) continue;

    const t = typeof current;
    if (t === 'string') {
      const parsed = extractLinkFromString(current);
      if (parsed) return parsed;
      continue;
    }
    if (t !== 'object' && t !== 'function') continue;
    if (visited.has(current)) continue;
    visited.add(current);

    let keys = [];
    try {
      keys = Object.keys(current);
    } catch (e) {
      continue;
    }

    for (const key of keys) {
      let val;
      try {
        val = current[key];
      } catch (e) {
        continue;
      }
      if (typeof val === 'string') {
        const parsed = extractLinkFromString(val);
        if (parsed) return parsed;
      } else if (val && (typeof val === 'object' || typeof val === 'function')) {
        stack.push(val);
      }
    }
  }

  return '';
}

function isLikelyTorrentDownloadUrl(abs) {
  const url = String(abs || '');
  if (!url) return false;
  if (/\/api\/rss\/dlv2\?/i.test(url)) return true;
  if (/\/api\/torrent\/download\?/i.test(url)) return true;
  if (/\.torrent(?:\?|$)/i.test(url)) return true;
  if (/[?&](?:app_id|payload|playload)=/i.test(url) && /[?&]sign=/i.test(url) && /[?&]t=/i.test(url)) return true;
  if (/halomt\.com/i.test(url) && /[?&]sign=/i.test(url)) return true;
  return false;
}

function isAllowedMTeamDownloadHost(abs) {
  try {
    const host = new URL(abs).hostname.toLowerCase();
    return /(^|\.)m-team\.cc$|(^|\.)m-team\.io$|(^|\.)halomt\.com$/.test(host);
  } catch (e) {
    return false;
  }
}

function getCurrentMTeamTid() {
  const m = window.location.pathname.match(/\/detail\/(\d+)/);
  return m ? m[1] : '';
}

function pruneMTeamCaches() {
  const now = Date.now();
  const maxAgeMs = 10 * 60 * 1000;
  const maxEntries = 80;
  const currentTid = getCurrentMTeamTid();

  const pruneMapByAge = (mapObj, getTs) => {
    Object.keys(mapObj).forEach((tid) => {
      if (tid === currentTid) return;
      const ts = getTs(mapObj[tid]) || 0;
      if (!ts || now - ts > maxAgeMs) delete mapObj[tid];
    });
  };

  pruneMapByAge(mpMTeamRuntimeDownloadLinks, (item) => item?.at);
  pruneMapByAge(mpMTeamAutoPrefetchState, (item) => Number(item || 0));

  Object.keys(mpMTeamMutationWatcherState).forEach((tid) => {
    if (tid === currentTid) return;
    const state = mpMTeamMutationWatcherState[tid];
    if (!state?.active) delete mpMTeamMutationWatcherState[tid];
  });

  const trimMap = (mapObj, getTs) => {
    const keys = Object.keys(mapObj);
    if (keys.length <= maxEntries) return;
    const sorted = keys
      .map((k) => ({ k, ts: getTs(mapObj[k]) || 0 }))
      .sort((a, b) => a.ts - b.ts);
    const removeCount = sorted.length - maxEntries;
    for (let i = 0; i < removeCount; i++) {
      if (sorted[i].k !== currentTid) delete mapObj[sorted[i].k];
    }
  };

  trimMap(mpMTeamRuntimeDownloadLinks, (item) => item?.at);
  trimMap(mpMTeamAutoPrefetchState, (item) => Number(item || 0));
}

function setMTeamRuntimeDownloadLink(url, source) {
  const tid = getCurrentMTeamTid();
  if (!tid || !url) return;
  const existing = mpMTeamRuntimeDownloadLinks[tid];
  if (existing?.url === url) {
    existing.source = source || existing.source;
    existing.at = Date.now();
    return;
  }
  mpMTeamRuntimeDownloadLinks[tid] = {
    url,
    source: source || 'runtime',
    at: Date.now()
  };
  debugLog('m-team runtime link captured', { tid, source, url });
  try {
    document.dispatchEvent(new CustomEvent('mp-mteam-runtime-link-updated', { detail: { tid, url, source } }));
  } catch (e) {}
}

function getMTeamRuntimeDownloadLink() {
  const tid = getCurrentMTeamTid();
  if (!tid) return '';
  const item = mpMTeamRuntimeDownloadLinks[tid];
  if (!item?.url) return '';
  // 运行时签名链接可能过期，默认只使用 10 分钟内捕获的链接
  if (Date.now() - (item.at || 0) > 10 * 60 * 1000) return '';
  return item.url;
}

function getDownloadLikeAttrsFromElement(el) {
  if (!el || typeof el.getAttribute !== 'function') return [];
  const attrs = ['href', 'data-url', 'data-href', 'onclick', 'title', 'aria-label'];
  const values = [];
  attrs.forEach((attr) => {
    const v = el.getAttribute(attr);
    if (v) push(v);
  });
  if (el.outerHTML) values.push(el.outerHTML);
  if (el.textContent) values.push(el.textContent);
  return values;
}

function installMTeamRuntimeCaptureListener() {
  if (mpMTeamRuntimeListenerInstalled) return;
  mpMTeamRuntimeListenerInstalled = true;

  document.addEventListener('mp-download-url-captured', (ev) => {
    try {
      const rawUrl = ev?.detail?.url || '';
      const source = ev?.detail?.source || 'page-hook';
      if (!rawUrl) return;
      const abs = new URL(rawUrl, window.location.origin).href;
      if (!isLikelyTorrentDownloadUrl(abs)) return;
      if (!isAllowedMTeamDownloadHost(abs)) return;
      const tid = getCurrentMTeamTid();
      if (tid && /[?&]tid=\d+/.test(abs) && !new RegExp(`[?&]tid=${tid}(?:&|$)`).test(abs)) return;
      setMTeamRuntimeDownloadLink(abs, `page:${source}`);
    } catch (e) {}
  }, true);
}

function installMTeamPageContextHook() {
  if (!isMTeamDetailPage()) return;
  if (document.getElementById('mp-mteam-page-hook-script')) return;

  const script = document.createElement('script');
  script.id = 'mp-mteam-page-hook-script';
  script.textContent = `
    (function() {
      if (window.__mpMTeamPageHookInstalled) return;
      window.__mpMTeamPageHookInstalled = true;
      window.__mpMTeamPrefetchUntil = 0;

      function shouldCapture(url) {
        try {
          var s = String(url || '');
          var lower = s.toLowerCase();
          if (lower.indexOf('dlv2') >= 0) return true;
          if (lower.indexOf('torrent/download') >= 0) return true;
          if (lower.indexOf('.torrent') >= 0) return true;
          if (lower.indexOf('halomt.com') >= 0 && lower.indexOf('sign=') >= 0) return true;
          if (
            (lower.indexOf('app_id=') >= 0 || lower.indexOf('payload=') >= 0 || lower.indexOf('playload=') >= 0)
            && lower.indexOf('sign=') >= 0
          ) return true;
          return false;
        } catch (e) { return false; }
      }

      function inPrefetchMode() {
        try {
          return Date.now() < (window.__mpMTeamPrefetchUntil || 0);
        } catch (e) { return false; }
      }

      try {
        document.addEventListener('mp-mteam-prefetch-mode', function(ev) {
          try {
            var duration = Number(ev && ev.detail && ev.detail.duration) || 5000;
            if (duration < 500) duration = 500;
            window.__mpMTeamPrefetchUntil = Date.now() + duration;
          } catch (e) {}
        }, true);
      } catch (e) {}

      function emit(url, source) {
        try {
          if (!url || !shouldCapture(url)) return;
          document.dispatchEvent(new CustomEvent('mp-download-url-captured', { detail: { url: String(url), source: source || 'page-hook' } }));
        } catch (e) {}
      }

      try {
        var origOpen = window.open;
        if (typeof origOpen === 'function') {
          window.open = function(url) {
            emit(url, 'window.open');
            if (inPrefetchMode() && shouldCapture(url)) return null;
            return origOpen.apply(this, arguments);
          };
        }
      } catch (e) {}

      try {
        if (window.fetch) {
          var origFetch = window.fetch;
          window.fetch = function(input) {
            try {
              var u = (typeof input === 'string') ? input : (input && input.url);
              emit(u, 'fetch');
            } catch (e) {}
            return origFetch.apply(this, arguments);
          };
        }
      } catch (e) {}

      try {
        var origXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
          emit(url, 'xhr.open');
          return origXhrOpen.apply(this, arguments);
        };
      } catch (e) {}

      try {
        var origAnchorClick = HTMLAnchorElement.prototype.click;
        HTMLAnchorElement.prototype.click = function() {
          emit(this && this.href, 'anchor.click');
          if (inPrefetchMode() && shouldCapture(this && this.href)) return;
          return origAnchorClick.apply(this, arguments);
        };
      } catch (e) {}

      try {
        document.addEventListener('click', function(ev) {
          var path = ev.composedPath ? ev.composedPath() : [ev.target];
          for (var i = 0; i < path.length; i++) {
            var n = path[i];
            if (!n || !n.getAttribute) continue;
            emit(n.getAttribute('href'), 'dom.click.href');
            emit(n.getAttribute('data-url'), 'dom.click.data-url');
            emit(n.getAttribute('data-href'), 'dom.click.data-href');
            emit(n.getAttribute('onclick'), 'dom.click.onclick');
          }
        }, true);
      } catch (e) {}
    })();
  `;
  (document.documentElement || document.head || document.body).appendChild(script);
}

function triggerMTeamPrefetchMode(durationMs = 5000) {
  try {
    document.dispatchEvent(new CustomEvent('mp-mteam-prefetch-mode', {
      detail: { duration: durationMs }
    }));
  } catch (e) {}
}

function getMTeamPrefetchClickTargets(nativeBtn) {
  const targets = [];
  const seen = new Set();
  const add = (el) => {
    if (!el || typeof el !== 'object') return;
    if (seen.has(el)) return;
    seen.add(el);
    targets.push(el);
  };

  add(nativeBtn);
  nativeBtn.querySelectorAll?.('a,button,[role="button"],.ant-btn,[class*="download"],[title*="下載"],[aria-label*="下載"]').forEach(add);

  let p = nativeBtn.parentElement;
  for (let i = 0; i < 3 && p; i++) {
    add(p);
    p.querySelectorAll?.('a,button,[role="button"],.ant-btn,[class*="download"],[title*="下載"],[aria-label*="下載"]').forEach(add);
    p = p.parentElement;
  }

  return targets.filter((el) => {
    const txt = cleanText(el.textContent || '').toLowerCase();
    if (txt.includes('下載') || txt.includes('下载') || txt.includes('download')) return true;
    const title = String(el.getAttribute?.('title') || '').toLowerCase();
    const aria = String(el.getAttribute?.('aria-label') || '').toLowerCase();
    return title.includes('下載') || title.includes('下载') || aria.includes('下載') || aria.includes('下载');
  });
}

function dispatchSyntheticClick(el) {
  if (!el) return;
  try { el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
  try { el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
  try { el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
  try { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } catch (e) {}
  try { if (typeof el.click === 'function') el.click(); } catch (e) {}
}

function startMTeamLinkMutationWatcher(reason = 'auto', windowMs = 9000) {
  const tid = getCurrentMTeamTid();
  if (!tid) return;

  const state = mpMTeamMutationWatcherState[tid];
  if (state?.active) return;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type !== 'attributes') continue;
      const node = m.target;
      if (!node || typeof node.getAttribute !== 'function') continue;
      const vals = getDownloadLikeAttrsFromElement(node);
      for (const raw of vals) {
        const parsed = extractLinkFromString(raw);
        if (parsed && isLikelyTorrentDownloadUrl(parsed) && isAllowedMTeamDownloadHost(parsed)) {
          setMTeamRuntimeDownloadLink(parsed, `mutation:${reason}:${m.attributeName || 'attr'}`);
          return;
        }
      }
    }
  });

  mpMTeamMutationWatcherState[tid] = { active: true, observer };
  observer.observe(document.documentElement || document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'data-url', 'data-href', 'onclick', 'title', 'aria-label']
  });

  setTimeout(() => {
    try { observer.disconnect(); } catch (e) {}
    mpMTeamMutationWatcherState[tid] = { active: false };
  }, windowMs);
}

function autoPrefetchMTeamDownloadLink(reason = 'auto', options = {}) {
  if (!isMTeamDetailPage()) return;
  const tid = getCurrentMTeamTid();
  if (!tid) return;
  if (getMTeamRuntimeDownloadLink()) return;

  const force = Boolean(options.force);
  const cooldownMs = Number(options.cooldownMs || 30000);
  const lastTs = mpMTeamAutoPrefetchState[tid] || 0;
  if (!force && Date.now() - lastTs < cooldownMs) return;

  const nativeBtn = findMTeamNativeDownloadButton();
  if (!nativeBtn) return;

  mpMTeamAutoPrefetchState[tid] = Date.now();
  debugLog('m-team auto prefetch start', { tid, reason });

  triggerMTeamPrefetchMode(8000);
  startMTeamLinkMutationWatcher(reason, 9000);

  const targets = getMTeamPrefetchClickTargets(nativeBtn);
  debugLog('m-team prefetch click targets', { count: targets.length });
  if (!targets.length) {
    dispatchSyntheticClick(nativeBtn);
  } else {
    targets.forEach((el, idx) => {
      setTimeout(() => dispatchSyntheticClick(el), idx * 180);
    });
  }

  [300, 900, 1600, 2600, 4000, 5200].forEach((delay) => {
    setTimeout(() => {
      const perfHit = captureMTeamDownloadLinkFromPerformance(`auto-prefetch+${delay}ms`);
      if (perfHit) return;
      const late = extractMTeamDownloadLink();
      if (late.link) setMTeamRuntimeDownloadLink(late.link, `auto-prefetch-extract+${delay}ms`);
    }, delay);
  });
}

function captureMTeamDownloadLinkFromPerformance(source) {
  const tid = getCurrentMTeamTid();
  if (!tid) return '';
  try {
    const entries = performance.getEntriesByType('resource') || [];
    for (let i = entries.length - 1; i >= 0; i--) {
      const url = entries[i]?.name || '';
      if (!isLikelyTorrentDownloadUrl(url)) continue;
      if (!isAllowedMTeamDownloadHost(url)) continue;
      if (/[?&]tid=\d+/.test(url) && !new RegExp(`[?&]tid=${tid}(?:&|$)`).test(url)) continue;
      setMTeamRuntimeDownloadLink(url, source || 'performance');
      return url;
    }
  } catch (e) {}
  return '';
}

function installMTeamNativeDownloadHook() {
  if (!isMTeamDetailPage()) return;
  installMTeamRuntimeCaptureListener();
  installMTeamPageContextHook();
  const nativeBtn = findMTeamNativeDownloadButton();
  if (!nativeBtn) return;
  if (nativeBtn.dataset?.mpHooked === '1') return;
  if (nativeBtn.dataset) nativeBtn.dataset.mpHooked = '1';

  nativeBtn.addEventListener('click', (ev) => {
    try {
      const path = ev.composedPath ? ev.composedPath() : [ev.target, nativeBtn];
      path.forEach((node) => {
        if (!node || typeof node !== 'object') return;
        getDownloadLikeAttrsFromElement(node).forEach((raw) => {
          const parsed = extractLinkFromString(raw);
          if (parsed && isLikelyTorrentDownloadUrl(parsed) && isAllowedMTeamDownloadHost(parsed)) {
            setMTeamRuntimeDownloadLink(parsed, 'native-click-path');
          }
        });
      });
    } catch (e) {}

    [250, 800, 1600, 2600, 4000].forEach((delay) => {
      setTimeout(() => {
        const perfHit = captureMTeamDownloadLinkFromPerformance(`native-click+${delay}ms`);
        if (perfHit) return;
        const late = extractMTeamDownloadLink();
        if (late.link) setMTeamRuntimeDownloadLink(late.link, `native-click-extract+${delay}ms`);
      }, delay);
    });
  }, true);
}

function extractMTeamDownloadLink() {
  const tid = getCurrentMTeamTid();
  const candidates = [];
  const seen = new Set();
  const pushCandidate = (raw, source) => {
    if (!raw) return;
    let abs = '';
    try {
      abs = new URL(String(raw).replace(/\\\//g, '/').replace(/&amp;/g, '&'), window.location.origin).href;
    } catch (e) {
      return;
    }
    if (!isLikelyTorrentDownloadUrl(abs)) return;
    if (!isAllowedMTeamDownloadHost(abs)) return;
    if (tid && /[?&]tid=\d+/.test(abs) && !new RegExp(`[?&]tid=${tid}(?:&|$)`).test(abs)) return;
    if (!seen.has(abs)) {
      seen.add(abs);
      candidates.push({ url: abs, source });
    }
  };

  const nativeBtn = findMTeamNativeDownloadButton();
  if (nativeBtn) {
    const btnLogKey = [
      window.location.pathname,
      nativeBtn.tagName || '',
      nativeBtn.className || '',
      cleanText(nativeBtn.textContent || '').slice(0, 80)
    ].join('|');
    if (btnLogKey !== mpLastMTeamBtnLogKey) {
      mpLastMTeamBtnLogKey = btnLogKey;
      debugLog('m-team native download button', { tag: nativeBtn.tagName, className: nativeBtn.className || '', text: cleanText(nativeBtn.textContent || '').slice(0, 80) });
    }

    const attrsToCheck = ['href', 'data-url', 'data-href', 'onclick', 'title', 'aria-label'];
    attrsToCheck.forEach((attr) => {
      const val = nativeBtn.getAttribute?.(attr);
      if (val) {
        const parsed = extractLinkFromString(val);
        if (parsed) pushCandidate(parsed, `native-btn:${attr}`);
      }
    });
    const outerHit = extractLinkFromString(nativeBtn.outerHTML || '');
    if (outerHit) pushCandidate(outerHit, 'native-btn:outerHTML');

    nativeBtn.querySelectorAll?.('a,button,[data-url],[data-href],[onclick]').forEach((el, idx) => {
      attrsToCheck.forEach((attr) => {
        const val = el.getAttribute?.(attr);
        if (val) {
          const parsed = extractLinkFromString(val);
          if (parsed) pushCandidate(parsed, `native-desc[${idx}]:${attr}`);
        }
      });
      const txtHit = extractLinkFromString(el.textContent || '');
      if (txtHit) pushCandidate(txtHit, `native-desc[${idx}]:text`);
    });

    const reactKeys = Object.keys(nativeBtn).filter(k => /^__reactProps\$|^__reactFiber\$/i.test(k));
    reactKeys.forEach((key) => {
      const reactHit = deepFindDownloadLinkInObject(nativeBtn[key]);
      if (reactHit) pushCandidate(reactHit, `native-btn:${key}`);
    });
  } else {
    const missKey = `${window.location.pathname}|missing`;
    if (mpLastMTeamBtnMissingLogKey !== missKey) {
      mpLastMTeamBtnMissingLogKey = missKey;
      debugLog('m-team native download button not found');
    }
  }

  const runtimeCached = getMTeamRuntimeDownloadLink();
  if (runtimeCached) pushCandidate(runtimeCached, 'runtime-cache');

  const selectors = [
    'a[href*="/api/rss/dlv2"]',
    'a[href*="api.m-team.io/api/rss/dlv2"]',
    'a[href*="dlv2"]',
    'a[href*="torrent/download"]',
    'a[href*="download?tid="]',
    'a[href*=".torrent"]',
    '[data-url*="dlv2"]',
    '[data-href*="dlv2"]',
    '[data-url*="download"]',
    '[data-href*="download"]',
    '[class*="download"]',
    '[class*="Download"]',
    'button[onclick*="dlv2"]',
    'a[onclick*="dlv2"]',
    'button[onclick*="download"]',
    'a[onclick*="download"]'
  ];

  for (const selector of selectors) {
    const nodes = document.querySelectorAll(selector);
    for (const node of nodes) {
      const href = node.getAttribute('href');
      if (href) pushCandidate(href, `${selector}:href`);
      const dataUrl = node.getAttribute('data-url') || node.getAttribute('data-href');
      if (dataUrl) pushCandidate(dataUrl, `${selector}:data-url`);
      const inline = node.getAttribute('onclick') || node.getAttribute('title') || node.getAttribute('aria-label') || node.textContent;
      const parsed = extractLinkFromString(inline);
      if (parsed) pushCandidate(parsed, `${selector}:inline`);
    }
  }

  try {
    const entries = performance.getEntriesByType('resource') || [];
    entries.forEach((entry) => {
      const name = entry?.name || '';
      if (/\/api\/rss\/dlv2\?/i.test(name)) pushCandidate(name, 'performance');
    });
  } catch (e) {}

  document.querySelectorAll('script').forEach((script, idx) => {
    const parsed = extractLinkFromString(script.textContent || '');
    if (parsed) pushCandidate(parsed, `script[${idx}]`);
  });

  if (!candidates.length) {
    const pageSourceHit = extractLinkFromString(document.documentElement?.innerHTML || '');
    if (pageSourceHit) pushCandidate(pageSourceHit, 'document-html');
  }

  return {
    link: candidates[0]?.url || '',
    source: candidates[0]?.source || '',
    candidates: candidates.slice(0, 8)
  };
}

function extractMTeamInfo(rows) {
  let candidates = [];
  const fields = collectAntFields();

  addUnique(candidates, rows[0]?.nextElementSibling?.textContent?.replace(/\.torrent$/i, ''));
  fields.forEach(field => {
    if (/(标题|標題|名称|名稱|片名|title|name)/i.test(field.key)) {
      addUnique(candidates, field.value.replace(/\.torrent$/i, ''));
    }
  });

  [
    '.ant-page-header-heading-title',
    '.ant-page-header-heading .ant-typography',
    'h1',
    'h2',
    '[class*="title"]',
    '[class*="Title"]'
  ].forEach(selector => {
    document.querySelectorAll(selector).forEach(el => addUnique(candidates, el.textContent));
  });

  let pageTitle = cleanText(document.title).replace(/\s*[-|_]\s*M[\s-]?Team.*$/i, '').trim();
  if (pageTitle && !/^m-team$/i.test(pageTitle)) {
    addUnique(candidates, pageTitle);
  }

  let torrent_name = pickBestTitleCandidate(candidates);
  let torrent_description = pickAntFieldValue(fields, [/(副标题|副標題|简介|簡介|描述|description|剧情|劇情|small\s*descr)/i]);
  const dlResult = extractMTeamDownloadLink();
  let download_link = dlResult.link
    || document.querySelector('a[href*="dlv2"], a[href*="download"], a[download], a[href*=".torrent"]')?.href
    || '';
  let torrent_size = getSize(pickAntFieldValue(fields, [/(大小|體積|体积|size)/i]));

  debugLog('m-team extracted', {
    titleCandidates: candidates,
    selectedTitle: torrent_name,
    descriptionPreview: toPreview(torrent_description || ''),
    downloadLink: download_link,
    downloadLinkSource: dlResult.source,
    downloadLinkCandidates: dlResult.candidates,
    size: torrent_size
  });

  return { torrent_name, download_link, torrent_description, torrent_size };
}

function getLatestDownloadLink(type, currentLink, options = {}) {
  if (currentLink) return currentLink;
  if (type === 'mteam' || isMTeamDetailPage()) {
    if (options.allowPrefetch) {
      autoPrefetchMTeamDownloadLink(options.reason || 'late-refresh', {
        force: Boolean(options.forcePrefetch),
        cooldownMs: options.cooldownMs || 30000
      });
    }
    const dlResult = extractMTeamDownloadLink();
    if (dlResult.link) {
      debugLog('m-team late download-link refresh', dlResult);
      return dlResult.link;
    }
  }
  return '';
}

function waitForMTeamLinkOnDemand(initialLink = '') {
  return new Promise((resolve) => {
    autoPrefetchMTeamDownloadLink('manual-push-click', { force: true, cooldownMs: 1200 });
    let immediate = getLatestDownloadLink('mteam', initialLink, { allowPrefetch: false });
    if (immediate) {
      resolve(immediate);
      return;
    }

    let attempts = 0;
    const maxAttempts = 24;
    const intervalMs = 700;

    const cleanup = () => {
      clearInterval(timer);
      document.removeEventListener('mp-mteam-runtime-link-updated', onRuntimeLink, true);
    };

    const onRuntimeLink = () => {
      const got = getLatestDownloadLink('mteam', '', { allowPrefetch: false });
      if (got) {
        cleanup();
        resolve(got);
      }
    };
    document.addEventListener('mp-mteam-runtime-link-updated', onRuntimeLink, true);

    const timer = setInterval(() => {
      attempts++;
      if (attempts === 1 || attempts % 2 === 0) {
        autoPrefetchMTeamDownloadLink('manual-push-click', { force: true, cooldownMs: 1200 });
      }

      const got = getLatestDownloadLink('mteam', '', { allowPrefetch: false });
      if (got) {
        cleanup();
        resolve(got);
        return;
      }

      if (attempts >= maxAttempts) {
        cleanup();
        resolve('');
      }
    }, intervalMs);
  });
}

// ---------- API 请求逻辑 (基于 API Key 重构) ----------

function recognizeByTitle(title, subtitle) {
  return new Promise(r => {
    requestWithGuard({
      url: `${mpUrl}/api/v1/media/recognize?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle || '')}`,
      method: "GET", 
      headers: getAuthHeaders(),
      responseType: "json",
      onload: (res) => {
        debugLog('recognizeByTitle response', { status: res.status, title, subtitlePreview: toPreview(subtitle || ''), body: toPreview(res.response) });
        r(res.status >= 200 && res.status < 300 ? res.response : null);
      },
      onerror: (err) => {
        debugLog('recognizeByTitle network error', { title, subtitlePreview: toPreview(subtitle || ''), err });
        r(null);
      }
    });
  });
}

function recognizeById(tmdbId, typeName) {
  return new Promise(r => {
    requestWithGuard({
      url: `${mpUrl}/api/v1/media/tmdb:${tmdbId}?type_name=${encodeURIComponent(typeName)}`,
      method: "GET", 
      headers: getAuthHeaders(),
      responseType: "json", 
      onload: (res) => r(res.status === 200 ? res.response : null), 
      onerror: () => r(null)
    });
  });
}

function searchTmdb(query, type = '') {
  return new Promise(r => {
    const key = (mpTmdbKey || '').trim();
    if (!key) {
      debugLog('searchTmdb skipped: missing tmdb key');
      r([]);
      return;
    }
    let url = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}&language=zh-CN`;
    if (type) url = `https://api.themoviedb.org/3/search/${type}?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(query)}&language=zh-CN`;
    requestWithGuard({
      url: url, method: "GET", responseType: "json",
      onload: (res) => r(res.response?.results || []), onerror: () => r([])
    });
  });
}

function inferTmdbSearchTypeFromText(text) {
  const raw = String(text || '');
  if (/\bS\d{1,2}E\d{1,3}\b/i.test(raw)) return 'tv';
  if (/\bE\d{1,3}\b/i.test(raw) || /第\s*\d+\s*季/.test(raw)) return 'tv';
  return '';
}

function extractYearHintsFromText(text) {
  const years = [];
  String(text || '').replace(/\b(19|20)\d{2}\b/g, (m) => {
    if (!years.includes(m)) years.push(m);
    return m;
  });
  return years;
}

function normalizeForMatch(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTmdbResult(item, query, yearHints, preferType) {
  const title = item?.title || item?.name || '';
  const nt = normalizeForMatch(title);
  const nq = normalizeForMatch(query);
  let score = 0;

  if (!nt || !nq) return score;
  if (nt === nq) score += 12;
  else if (nt.includes(nq) || nq.includes(nt)) score += 8;

  const qTokens = nq.split(' ').filter(Boolean);
  const tTokens = nt.split(' ').filter(Boolean);
  const overlap = qTokens.filter(t => tTokens.includes(t)).length;
  score += Math.min(overlap, 6);

  const mediaType = item?.media_type || '';
  if (preferType && mediaType === preferType) score += 2;

  const y = String(item?.release_date || item?.first_air_date || '').slice(0, 4);
  if (y && yearHints.includes(y)) score += 4;
  return score;
}

function autoRecognizeByTmdbFallback(candidates, subtitle) {
  return new Promise(async (resolve) => {
    try {
      const uniqueQueries = [];
      const addQuery = (q) => {
        const val = String(q || '').trim();
        if (val && !uniqueQueries.includes(val)) uniqueQueries.push(val);
      };

      candidates.forEach(addQuery);
      extractSubtitleCandidates(subtitle).forEach(addQuery);

      const yearHints = extractYearHintsFromText(`${candidates.join(' ')} ${subtitle || ''}`);
      const preferType = inferTmdbSearchTypeFromText(`${candidates.join(' ')} ${subtitle || ''}`);
      const topQueries = uniqueQueries.slice(0, 6);
      let scored = [];
      let dedup = new Set();

      for (const q of topQueries) {
        const modes = preferType ? [preferType, ''] : [''];
        for (const mode of modes) {
          const results = await searchTmdb(q, mode);
          (results || []).slice(0, 12).forEach((item) => {
            const key = `${item?.media_type || mode || ''}:${item?.id || ''}`;
            if (!item?.id || dedup.has(key)) return;
            dedup.add(key);
            const mediaType = item?.media_type || (mode || 'movie');
            const effectiveType = mediaType === 'tv' ? 'tv' : 'movie';
            const score = scoreTmdbResult({ ...item, media_type: effectiveType }, q, yearHints, preferType);
            scored.push({ id: item.id, mediaType: effectiveType, score });
          });
        }
      }

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      debugLog('tmdb fallback scored top', scored.slice(0, 5));
      if (!best || best.score < 6) {
        resolve(null);
        return;
      }

      const typeName = best.mediaType === 'tv' ? '电视剧' : '电影';
      const mediaInfo = await recognizeById(best.id, typeName);
      resolve(mediaInfo && mediaInfo.tmdb_id ? mediaInfo : null);
    } catch (e) {
      debugLog('tmdb fallback failed', e);
      resolve(null);
    }
  });
}

function downloadTorrent(btn, media_info, torrent_name, torrent_description, download_link, torrent_size) {
  btn.disabled = true;
  btn.textContent = "推送中...";
  
  let toastId = createToast("📡 连接当前 PT 站点", "正在获取站点的 MoviePilot 代理/Cookie 规则...", "info");

  requestWithGuard({
    url: mpUrl + `/api/v1/site/domain/${window.location.hostname}`,
    method: "GET", 
    headers: getAuthHeaders(),
    responseType: "json",
    onload: (siteRes) => {
      let siteData = siteRes.response || {};
      
      updateToast(toastId, "⏳ 正在下发到下载器", "后端处理解析与防重逻辑需要一定时间，请稍等...", "info");

      let torrent_in = {
         "site": siteData.id || 0, "site_name": siteData.name || "", "site_cookie": siteData.cookie || "",
         "site_ua": navigator.userAgent, "site_proxy": siteData.proxy || null, "site_order": siteData.pri || null,
         "title": torrent_name, "description": torrent_description || "", "imdbid": null,
         "enclosure": download_link, "page_url": window.location.href, "size": torrent_size || 0,
         "seeders": 0, "peers": 0, "grabs": 0, "pubdate": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
         "date_elapsed": null, "uploadvolumefactor": 1, "downloadvolumefactor": 0, "hit_and_run": false,
         "labels": [], "pri_order": 0, "volume_factor": "普通"
      };

      let payload = { media_in: media_info, torrent_in: torrent_in };

      requestWithGuard({
        method: 'POST', 
        url: mpUrl + `/api/v1/download/`,
        data: JSON.stringify(payload),
        headers: getAuthHeaders(),
        responseType: 'json',
        onload: (res) => {
          btn.disabled = false;
          if (res.status === 200 && res.response && res.response.success) {
            btn.textContent = "下载完成"; btn.style.backgroundColor = "#28a745";
            let msg = res.response.message || "任务已成功接管";
            updateToast(toastId, "✅ 推送成功", msg, "success");
            setTimeout(() => removeToast(toastId), 3000);
          } else {
            btn.textContent = "下载失败"; btn.style.backgroundColor = "#dc3545";
            let errMsg = res.response ? (res.response.message || res.response.msg) : `HTTP ${res.status} 状态异常`;
            updateToast(toastId, "❌ 推送被拒绝或执行失败", errMsg, "error");
          }
        },
        onerror: () => {
          btn.disabled = false;
          btn.textContent = "网络错误"; btn.style.backgroundColor = "#dc3545";
          updateToast(toastId, "❌ 网络连接断开", "无法与 MoviePilot 服务建立网络连接", "error");
        }
      });
    },
    onerror: () => {
      btn.disabled = false;
      btn.textContent = "获取站点失败"; btn.style.backgroundColor = "#dc3545";
      updateToast(toastId, "❌ 执行中断", "请求站点域配置接口 (/api/v1/site/domain) 失败，请检查配置或网络。", "error");
    }
  });
}

// ---------- 结果页面 UI 构建 ----------
function buildHtml(row, mediaInfo, type, torrentName, torrentDesc, downloadLink, torrentSize) {
    if(!mediaInfo) return '';
    let html = '';
    const tmdbType = mediaInfo.type === '电视剧' ? 'tv' : 'movie';
    const tmdbId = String(mediaInfo.tmdb_id || '').replace(/[^\d]/g, '');
    html += mediaInfo.type ? renderTag(type, mediaInfo.type, '#2775b6') : '';
    html += mediaInfo.category ? renderTag(type, mediaInfo.category, '#2775b6') : '';
    html += mediaInfo.title ? renderTag(type, mediaInfo.title, '#c54640') : '';
    html += mediaInfo.year ? renderTag(type, mediaInfo.year, '#e6702e') : '';
    html += tmdbId ? `<a href="https://www.themoviedb.org/${tmdbType}/${tmdbId}" target="_blank" rel="noopener noreferrer">${renderTag(type, 'TMDB:' + tmdbId, '#5bb053')}</a>` : '';
    
    let btnId = "dl-btn-" + Math.floor(Math.random() * 10000);
    let reBtnId = "re-btn-" + Math.floor(Math.random() * 10000);
    const canPush = Boolean(downloadLink);
    const canLazyPush = type === 'mteam';
    const buttonText = canPush || canLazyPush ? '下载种子' : '无下载链接';
    const buttonStyle = canPush ? '#cdae9c' : '#999999';
    if (type === 'common') {
      html += `<button id="${btnId}" style="margin-left:5px;${canPush ? '' : 'cursor:not-allowed;'}">${buttonText}</button>`;
      html += `<button id="${reBtnId}" style="margin-left:5px;background:#007bff;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;">重新识别</button>`;
    } else if (type === 'mteam') {
      html += `<button id="${btnId}" style="border:none;border-radius:6px;height:22px;padding:0 10px;font-size:12px;color:#fff;background:#cdae9c;cursor:pointer;">${buttonText}</button>`;
      html += `<button id="${reBtnId}" style="border:none;border-radius:6px;height:22px;padding:0 10px;font-size:12px;color:#fff;background:#007bff;cursor:pointer;">重新识别</button>`;
    } else {
      html += `<button id="${btnId}" class="flex justify-center items-center rounded-md text-[12px] h-[18px] mr-2 px-[5px] font-bold" style="background-color:${buttonStyle};color:#ffffff;${canPush ? '' : 'cursor:not-allowed;'}">${buttonText}</button>`;
      html += `<button id="${reBtnId}" class="flex justify-center items-center rounded-md text-[12px] h-[18px] mr-2 px-[5px] font-bold" style="background-color:#007bff;color:#ffffff;cursor:pointer;">重新识别</button>`;
    }
    
    setTimeout(() => {
        let btn = document.getElementById(btnId);
        let reBtn = document.getElementById(reBtnId);
        if (btn) {
          if (!canPush && !canLazyPush) {
            btn.disabled = true;
            btn.title = "当前页面未提取到可用下载链接，正在重试...";
          } else if (canPush) {
            btn.onclick = () => downloadTorrent(btn, mediaInfo, torrentName, torrentDesc, downloadLink, torrentSize);
          } else {
            btn.onclick = async () => {
              if (btn.disabled) return;
              btn.disabled = true;
              btn.textContent = '正在获取链接...';
              btn.style.background = '#2775b6';
              btn.title = '';

              const fetched = await waitForMTeamLinkOnDemand(downloadLink);
              if (fetched) {
                btn.textContent = '获取成功，正在推送...';
                btn.style.background = '#5bb053';
                downloadTorrent(btn, mediaInfo, torrentName, torrentDesc, fetched, torrentSize);
              } else {
                btn.disabled = false;
                btn.textContent = '获取失败，请刷新重试';
                btn.style.background = '#dc3545';
                btn.title = '获取失败，请刷新网页重试';
                setTimeout(() => {
                  if (btn.textContent === '获取失败，请刷新重试') {
                    btn.textContent = '下载种子';
                    btn.style.background = '#cdae9c';
                  }
                }, 2200);
              }
            };
          }
        }
        if (reBtn) {
          reBtn.onclick = () => openManualModal(row, type, torrentName, torrentDesc, downloadLink, torrentSize);
        }
    }, 100);
    return html;
}

function openManualModal(row, type, torrentName, torrentDesc, downloadLink, torrentSize) {
  const candidates = getRecognitionCandidates(torrentName, torrentDesc);
  const defaultQuery = candidates[1] || candidates[0] || '';
  const modal = document.createElement('div');
  modal.className = 'mp-modal';
  modal.innerHTML = `
    <div class="mp-modal-content">
      <span class="mp-close">&times;</span>
      <h3 style="margin-top:0">手动关联识别</h3>
      <div class="mp-input-group">
        <label>输入影视名称或 TMDB ID:</label>
        <input type="text" id="mp-media-name" value="${escapeHtmlAttr(defaultQuery)}">
      </div>
      <button class="mp-search-btn" id="mp-search-all">搜索全部</button>
      <button class="mp-search-btn" style="background-color: #28a745;" id="mp-search-tv">搜电视剧</button>
      <button class="mp-search-btn" style="background-color: #dc3545;" id="mp-search-movie">搜电影</button>
      <div class="mp-results-container" id="res-container" style="display:none"><div id="res-list"></div></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = 'block';

  modal.querySelector('.mp-close').onclick = () => modal.remove();

  const doSearch = (stype) => {
    if (!mpTmdbKey) {
      alert("请先在脚本配置中填写 TMDB API Key。");
      return;
    }
    const query = modal.querySelector('#mp-media-name').value.trim();
    if (!query) return;
    
    searchTmdb(query, stype).then(results => {
      const list = modal.querySelector('#res-list');
      modal.querySelector('#res-container').style.display = 'block';
      list.innerHTML = results.length ? '' : '<p>未找到相关结果</p>';

      results.slice(0, 10).forEach(item => {
        const title = item.title || item.name;
        const mType = item.media_type || (stype === 'tv' ? 'tv' : 'movie');
        const mpTypeName = mType === 'tv' ? '电视剧' : '电影';
        const safeTitle = escapeHtml(title || '');
        const safeDate = escapeHtml(item.release_date || item.first_air_date || 'N/A');
        const safeId = escapeHtml(String(item.id || ''));
        
        const div = document.createElement('div');
        div.className = 'mp-result-item';
        div.innerHTML = `
          <div class="mp-result-title"><span class="mp-result-type">${mpTypeName}</span>${safeTitle}</div>
          <div class="mp-result-year">年份: ${safeDate} | ID: ${safeId}</div>
        `;
        
        div.onclick = () => {
          row.innerHTML = renderMoviepilotTag(type, "正在精确匹配...");
          modal.remove();
          
          recognizeById(item.id, mpTypeName).then(mediaInfo => {
            if (mediaInfo && mediaInfo.tmdb_id) {
               const latestLink = getLatestDownloadLink(type, downloadLink, { allowPrefetch: type === 'mteam', reason: 'manual-recognize' });
               let h = buildHtml(row, mediaInfo, type, torrentName, torrentDesc, latestLink, torrentSize);
               row.innerHTML = renderMoviepilotTag(type, h);
            } else {
               row.innerHTML = renderMoviepilotTag(type, `<span style="color:red">后端拉取信息失败，该条目可能未收录</span>`);
            }
          });
        };
        list.appendChild(div);
      });
    });
  };

  modal.querySelector('#mp-search-all').onclick = () => doSearch('');
  modal.querySelector('#mp-search-tv').onclick = () => doSearch('tv');
  modal.querySelector('#mp-search-movie').onclick = () => doSearch('movie');
}

// ---------- 页面 DOM 解析核心 ----------
function insertMpRow(){
  if (!shouldProcessCurrentPage()) return;
  if(document.getElementById('mp-row-flag')) return;

  let rows = document.querySelectorAll('.rowhead, .ant-descriptions-item-label');
  let divs = document.getElementsByClassName('font-bold leading-6');
  let type = 'common';

  if (isMTeamDetailPage()) {
    try {
      if (!isMTeamPageDataReady()) return;
      installMTeamNativeDownloadHook();
      autoPrefetchMTeamDownloadLink('initial', { force: false });
      const info = extractMTeamInfo(rows);
      if (!info.torrent_name || /^m-team$/i.test(String(info.torrent_name).trim())) return;
      const row = createMTeamMountNode();
      if (!row) return;
      processRecognition(row, 'mteam', info.torrent_name, info.torrent_description, info.download_link, info.torrent_size);
      return;
    } catch(e) { console.error("MoviePilot Error:", e); }
  }
  
  if (rows.length) {
    let torrent_name = '', download_link = '', torrent_description = '', torrent_size = 0;
    
    try {
        if (window.location.href.includes('hdsky')) {
          torrent_name = rows[0].nextElementSibling?.firstElementChild?.firstElementChild?.value || rows[0].nextElementSibling?.innerText;
          download_link = rows[1].nextElementSibling?.firstElementChild?.href;
          torrent_description = rows[2].nextElementSibling?.innerText || "";
          torrent_size = getSize(rows[3].nextElementSibling?.innerText || "");
        } else if (isQingwaLikeLayout()) {
          torrent_name = extractQingwaTitle()
            || rows[0].nextElementSibling?.firstElementChild?.text
            || rows[0].nextElementSibling?.innerText;
          download_link = document.querySelector('a[href*="download.php?id="], a[href*="download.php"], a[href*="download"], a[href*=".torrent"]')?.href
            || rows[0].nextElementSibling?.firstElementChild?.href;
          torrent_description = rows[1].nextElementSibling?.innerText
            || cleanText(document.querySelector('#titleEditBox input[type="text"]')?.value || '')
            || "";
          torrent_size = getSize(rows[2].nextElementSibling?.innerText || "");
          debugLog('qingwa-like extracted', { host: window.location.hostname, title: torrent_name, downloadLink: download_link, subtitlePreview: toPreview(torrent_description) });
        } else if (window.location.href.includes('totheglory')) {
          torrent_name = rows[0].nextElementSibling?.firstElementChild?.nextElementSibling?.text || rows[0].nextElementSibling?.innerText;
          let tds = document.getElementsByClassName('heading');
          download_link = tds[0]?.nextElementSibling?.firstElementChild?.href;
          torrent_size = getSize(tds[5]?.nextElementSibling?.innerText || "");
        } else {
          torrent_name = rows[0].nextElementSibling?.firstElementChild?.text || rows[0].nextElementSibling?.innerText;
          download_link = rows[0].nextElementSibling?.firstElementChild?.href;
          torrent_description = rows[1].nextElementSibling?.innerText || "";
          torrent_size = getSize(rows[2].nextElementSibling?.innerText || "");
        }

        if (!torrent_name) return;
        
        let table = rows[0].closest('table') || rows[0].parentNode.parentNode.parentNode;
        if (!table) return;
        
        let row = table.insertRow(2);
        row.id = 'mp-row-flag';
        
        processRecognition(row, type, torrent_name, torrent_description, download_link, torrent_size);
    } catch(e) { console.error("MoviePilot Error:", e); }

  } else if (divs.length) {
    try {
        let torrent_index_div = document.querySelector('a.index');
        if(!torrent_index_div) return;
        let torrent_name = torrent_index_div.textContent;
        let torrent_description = divs[3].innerText;
        let download_link = torrent_index_div.href;
        let torrent_size = getSize(divs[5].nextElementSibling.innerText);
        
        if (torrent_name) {
          divs[3].insertAdjacentHTML('afterend', '<div class="font-bold leading-6" id="mp-row-flag">moviepilot</div><div class="font-light leading-6 flex flex-wrap"><div id="moviepilot" class="font-light leading-6 flex"></div></div>');
          let row = document.getElementById("moviepilot");
          processRecognition(row, '', torrent_name, torrent_description, download_link, torrent_size);
        }
    } catch(e) { console.error("MoviePilot Error:", e); }
  }
}

function processRecognition(row, type, t_name, t_desc, d_link, t_size) {
  row.innerHTML = renderMoviepilotTag(type, "正在连接 MoviePilot 接口...");
  debugLog('processRecognition start', { page: window.location.href, rawTitle: t_name, subtitlePreview: toPreview(t_desc || '') });

  const candidates = getRecognitionCandidates(t_name, t_desc);
  debugLog('recognition candidates', candidates);

  const tryRecognize = (index) => {
    if (index >= candidates.length) {
      debugLog('recognition failed after all candidates', candidates);
      row.innerHTML = renderMoviepilotTag(type, "自动识别失败，尝试 TMDB 智能匹配...");
      autoRecognizeByTmdbFallback(candidates, t_desc).then((mediaInfo) => {
        if (mediaInfo && mediaInfo.tmdb_id) {
          const latestLink = getLatestDownloadLink(type, d_link, { allowPrefetch: type === 'mteam', reason: 'tmdb-fallback' });
          let html = buildHtml(row, mediaInfo, type, t_name, t_desc, latestLink, t_size);
          row.innerHTML = renderMoviepilotTag(type, html);
        } else {
          row.innerHTML = renderMoviepilotTag(type, '<button id="manual-recognize-btn" style="background-color:#ff6b6b;color:white;padding:2px 6px;border:none;border-radius:4px;cursor:pointer;">识别失败，点此手动识别</button>');
          row.querySelector("#manual-recognize-btn").onclick = () => openManualModal(row, type, t_name, t_desc, d_link, t_size);
        }
      });
      return;
    }

    row.innerHTML = renderMoviepilotTag(
      type,
      index === 0 ? "正在自动识别种子名称..." : `自动识别重试中 (${index + 1}/${candidates.length})...`
    );

    let currentTitle = candidates[index];
    let currentSubtitle = index === 0 ? t_desc : '';
    debugLog('recognize attempt', { attempt: `${index + 1}/${candidates.length}`, title: currentTitle, withSubtitle: index === 0 });
    
    recognizeByTitle(currentTitle, currentSubtitle).then(data => {
      if (data && data.media_info) {
        debugLog('recognize success', { title: currentTitle, media: toPreview(data.media_info) });
        const latestLink = getLatestDownloadLink(type, d_link, { allowPrefetch: type === 'mteam', reason: 'recognize-success' });
        let html = buildHtml(row, data.media_info, type, t_name, t_desc, latestLink, t_size);
        row.innerHTML = renderMoviepilotTag(type, html);
      } else {
        debugLog('recognize miss', { title: currentTitle });
        tryRecognize(index + 1);
      }
    });
  };

  tryRecognize(0);
}

// ---------- 运行守护 ----------
(function () {
  'use strict';
  
  let configChecked = false;
  let lastUrl = window.location.href;

  setInterval(() => {
     if (window.location.href !== lastUrl) {
         debugLog('route changed', { from: lastUrl, to: window.location.href });
         lastUrl = window.location.href;
         cleanupMpUi();
         pruneMTeamCaches();
     }

     if (!shouldProcessCurrentPage()) {
         if (document.getElementById('mp-row-flag') || document.querySelector('.mp-modal') || document.getElementById('mp-toast-container')) {
             debugLog('cleanup on unsupported page', window.location.href);
             cleanupMpUi();
         }
         pruneMTeamCaches();
         return;
     }

     // 1. 检查配置是否填写，改为检查 url 和 API key
     if (!mpUrl || !mpApiKey) {
         if (!configChecked && !document.getElementById('mp-config-modal')) {
             showConfigModal();
             configChecked = true;
         }
         return; // 未配置前不执行注入逻辑
     }

     // 2. 检查页面是否需要注入
     if(!document.getElementById('mp-row-flag')) {
         insertMpRow();
     }
     pruneMTeamCaches();
  }, 1500);
})();
