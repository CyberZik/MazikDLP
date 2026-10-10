/**
 * MazikDLP Content Script
 * Intercepts prompts on AI platforms and enforces DLP policies.
 *
 * Interception strategy:
 *   Listen at the document level with capture:true so we run BEFORE React's
 *   root-container handlers. Calling stopImmediatePropagation() prevents
 *   React from ever seeing the event. For resubmit we set bypassNext=true,
 *   which lets the next click/keydown event pass straight through to React.
 */

(function () {
  'use strict';

  // ─── Platform Configs ──────────────────────────────────────────────────────

  const PLATFORMS = {
    // ChatGPT — real domain is chatgpt.com (chat.openai.com redirects)
    'chatgpt.com': {
      name: 'ChatGPT',
      inputSelectors: ['#prompt-textarea', 'div[contenteditable="true"][data-placeholder]', 'textarea'],
      inputType: 'contenteditable',
      submitSelectors: ['[data-testid="send-button"]', 'button[aria-label="Send prompt"]', 'button[aria-label="Send message"]'],
    },
    // Keep legacy domain in case some paths still use it
    'chat.openai.com': {
      name: 'ChatGPT',
      inputSelectors: ['#prompt-textarea', 'div[contenteditable="true"]', 'textarea'],
      inputType: 'contenteditable',
      submitSelectors: ['[data-testid="send-button"]', 'button[aria-label="Send prompt"]'],
    },
    'claude.ai': {
      name: 'Claude',
      inputSelectors: ['.ProseMirror', 'div[contenteditable="true"]'],
      inputType: 'contenteditable',
      submitSelectors: ['button[aria-label="Send message"]', 'button[type="submit"]'],
    },
    'gemini.google.com': {
      name: 'Gemini',
      // Gemini uses a <rich-textarea> web component; the editable div is inside it
      inputSelectors: ['.ql-editor', 'rich-textarea .ql-editor', 'div[contenteditable="true"]'],
      inputType: 'contenteditable',
      submitSelectors: [
        'button[aria-label="Send message"]',
        'button[data-mat-icon-name="send"]',
        'button.send-button',
        'mat-icon[fonticon="send"]',  // click propagates to parent button
      ],
    },
    'grok.com': {
      name: 'Grok',
      inputSelectors: ['textarea[placeholder]', 'textarea'],
      inputType: 'textarea',
      submitSelectors: ['button[type="submit"]', 'button[aria-label="Send"]'],
    },
    'x.com': {
      name: 'Grok',
      inputSelectors: ['textarea[placeholder]', 'textarea'],
      inputType: 'textarea',
      submitSelectors: ['button[type="submit"]', 'button[aria-label="Send"]'],
    },
    'perplexity.ai': {
      name: 'Perplexity',
      inputSelectors: ['textarea[placeholder]', 'textarea'],
      inputType: 'textarea',
      submitSelectors: ['button[aria-label="Submit"]', 'button[type="submit"]'],
    },
    'www.perplexity.ai': {
      name: 'Perplexity',
      inputSelectors: ['textarea[placeholder]', 'textarea'],
      inputType: 'textarea',
      submitSelectors: ['button[aria-label="Submit"]', 'button[type="submit"]'],
    },
    'copilot.microsoft.com': {
      name: 'Microsoft Copilot',
      inputSelectors: ['#userInput', 'textarea', 'div[contenteditable="true"]'],
      inputType: 'textarea',
      submitSelectors: ['button[aria-label="Submit message"]', 'button[type="submit"]'],
    },
    'github.com': {
      name: 'GitHub Copilot',
      inputSelectors: ['textarea[aria-label]', 'textarea'],
      inputType: 'textarea',
      submitSelectors: ['button[aria-label="Submit"]', 'button[type="submit"]'],
    },
    'chat.deepseek.com': {
      name: 'DeepSeek',
      inputSelectors: ['textarea[placeholder]', 'textarea'],
      inputType: 'textarea',
      submitSelectors: ['div[role="button"][aria-label]', 'button[type="submit"]'],
    },
  };

  // ─── Init ─────────────────────────────────────────────────────────────────

  const hostname = window.location.hostname;
  const platform = PLATFORMS[hostname];

  if (!platform) return; // Not a supported platform

  // bypassNext: when true, let the very next click/keydown pass through to React
  let bypassNext = false;

  console.log(`[MazikDLP] Loaded on ${platform.name} (${hostname})`);

  // ─── DOM Utilities ────────────────────────────────────────────────────────

  function findElement(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch { /* invalid selector — skip */ }
    }
    return null;
  }

  /**
   * Check whether a click event target is (or is inside) a submit button.
   * Using closest() handles clicks on SVG icons inside buttons.
   */
  function isSubmitTarget(target) {
    for (const sel of platform.submitSelectors) {
      try {
        if (target.closest(sel)) return true;
      } catch { /* skip */ }
    }
    return false;
  }

  function getInputText() {
    const el = findElement(platform.inputSelectors);
    if (!el) return '';
    if (platform.inputType === 'textarea') return el.value || '';
    // contenteditable: innerText preserves newlines; trim trailing newlines Quill adds
    return (el.innerText || el.textContent || '').replace(/\n$/, '').trim();
  }

  function setInputText(text) {
    const el = findElement(platform.inputSelectors);
    if (!el) return;

    if (platform.inputType === 'textarea') {
      // React textarea: use the native setter so React's onChange synthetic event fires
      try {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(el, text);
      } catch {
        el.value = text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // contenteditable (ChatGPT, Claude, Gemini): setting innerText bypasses React's
      // virtual DOM. execCommand('insertText') goes through the browser's native editing
      // pipeline, which React's synthetic event handlers properly intercept.
      el.focus();
      // Select all existing content
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
      // Replace selection with masked text — fires native input events React hooks into
      if (!document.execCommand('insertText', false, text)) {
        // execCommand fallback (shouldn't be needed in Chrome, but just in case)
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }

  // ─── Resubmit ─────────────────────────────────────────────────────────────

  function resubmit() {
    const btn = findElement(platform.submitSelectors);
    if (!btn) return;
    bypassNext = true;
    btn.click(); // Fires synchronously → our capture listener sees bypassNext=true and skips
    bypassNext = false; // Reset immediately after synchronous dispatch
  }

  function resubmitEnter(originalEvent) {
    // Replicate an Enter keydown on the active input element
    const el = findElement(platform.inputSelectors);
    if (!el) return;
    bypassNext = true;
    el.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', bubbles: true, cancelable: true,
      // Preserve modifiers from original event
      ctrlKey: originalEvent.ctrlKey,
      metaKey: originalEvent.metaKey,
    }));
    bypassNext = false;
  }

  // ─── Scan + Dispatch ──────────────────────────────────────────────────────

  async function scanAndAct(text, originalEvent, isKeyboard) {
    showScanningIndicator();

    let result;
    try {
      result = await chrome.runtime.sendMessage({
        type: 'SCAN',
        payload: { text, platform: platform.name },
      });
    } catch {
      removeScanningIndicator();
      // Extension context error — fail open
      if (isKeyboard) resubmitEnter(originalEvent); else resubmit();
      return;
    }

    removeScanningIndicator();

    const action = result.action || 'allow';
    const entities = result.entities_detected || [];

    // Unauthenticated — special block message
    if (result.unauthenticated) {
      showAuthBlock();
      return;
    }

    if (result.error) {
      // Server error — fail open
      if (isKeyboard) resubmitEnter(originalEvent); else resubmit();
      return;
    }

    switch (action) {
      case 'hard_block':
        showHardBlock(entities);
        break;

      case 'soft_block':
        showSoftBlock(entities, () => {
          if (isKeyboard) resubmitEnter(originalEvent); else resubmit();
        });
        break;

      case 'mask': {
        if (result.masked_text) setInputText(result.masked_text);
        // Delay resubmit so React has time to flush the execCommand-triggered
        // input event and update its internal state before we click Send.
        setTimeout(() => {
          if (isKeyboard) resubmitEnter(originalEvent); else resubmit();
          if (result.session_id) watchAndRestoreResponse(result.session_id);
        }, 150);
        break;
      }

      case 'alert':
        showAlertToast(entities.length);
        if (isKeyboard) resubmitEnter(originalEvent); else resubmit();
        break;

      default: // allow
        if (isKeyboard) resubmitEnter(originalEvent); else resubmit();
        break;
    }
  }

  // ─── Document-Level Click Capture ─────────────────────────────────────────

  document.addEventListener('click', (e) => {
    if (bypassNext) return; // Let this one through to React

    if (!isSubmitTarget(e.target)) return; // Not a submit button

    const text = getInputText();
    if (!text) return; // Empty — let through

    e.stopImmediatePropagation();
    e.preventDefault();

    scanAndAct(text, e, false);
  }, true); // capture: true → runs before React root handlers

  // ─── Document-Level Keydown Capture (Enter to submit) ────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (bypassNext) return;

    const input = findElement(platform.inputSelectors);
    if (!input) return;

    // Check if the event came from within the input (handles contenteditable children)
    if (!input.contains(e.target) && e.target !== input) return;

    const text = getInputText();
    if (!text) return;

    e.stopImmediatePropagation();
    e.preventDefault();

    scanAndAct(text, e, true);
  }, true);

  // ─── Scanning Indicator ───────────────────────────────────────────────────

  function showScanningIndicator() {
    removeScanningIndicator();
    const btn = findElement(platform.submitSelectors);
    const indicator = document.createElement('div');
    indicator.id = 'mazikdlp-scanning';
    indicator.className = 'mazikdlp-scanning';
    indicator.innerHTML = '<div class="mazikdlp-spinner"></div><span>Scanning…</span>';
    if (btn?.parentElement) {
      btn.parentElement.style.position = 'relative';
      btn.parentElement.appendChild(indicator);
    } else {
      document.body.appendChild(indicator);
    }
  }

  function removeScanningIndicator() {
    document.getElementById('mazikdlp-scanning')?.remove();
  }

  // ─── Auth Block (not signed in) ───────────────────────────────────────────

  function showAuthBlock() {
    removeAllOverlays();
    const overlay = document.createElement('div');
    overlay.id = 'mazikdlp-overlay';
    overlay.className = 'mazikdlp-overlay';
    overlay.innerHTML = `
      <div class="mazikdlp-modal mazikdlp-modal-block">
        <div class="mazikdlp-modal-icon block-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 class="mazikdlp-modal-title">Sign in Required</h2>
        <p class="mazikdlp-modal-sub">
          MazikDLP protection is active on this platform. Please sign in to your MazikDLP account to continue using AI tools.
        </p>
        <div class="mazikdlp-modal-actions">
          <button class="mazikdlp-btn-primary" id="mazikdlp-signin-dismiss">Dismiss</button>
        </div>
        <p class="mazikdlp-modal-footer">Click the <strong>MazikDLP</strong> extension icon to sign in.</p>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('mazikdlp-signin-dismiss').onclick = () => removeAllOverlays();
  }

  // ─── Mask Map & Response Restoration ──────────────────────────────────────

  /**
   * Backend placeholder format: <SHORTTYPE_xxxx>
   *   e.g. <EMAILADDR_a3f7>, <INPAN_9c21>
   * Generated by masking_service._placeholder() using MD5(original_text)[:4]
   * We don't reimplement MD5 — instead we ask the backend to restore via session_id.
   */
  const PLACEHOLDER_RE = /<[A-Z]{1,8}_[a-f0-9]{4}>/g;

  /**
   * Watch the entire document for placeholder tokens after a masked submission.
   * When content settles (600ms after last mutation), find text nodes that
   * contain placeholder tokens and restore them via the backend /restore endpoint.
   * The backend Redis session has the exact placeholder→original mapping.
   */
  function watchAndRestoreResponse(sessionId) {
    let debounceTimer = null;
    const processed = new WeakSet();

    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => restoreTextNodes(sessionId, processed), 600);
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setTimeout(() => observer.disconnect(), 120000);
  }

  async function restoreTextNodes(sessionId, processed) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodesToProcess = [];
    let node;
    while ((node = walker.nextNode())) {
      if (processed.has(node)) continue;
      PLACEHOLDER_RE.lastIndex = 0;
      if (PLACEHOLDER_RE.test(node.nodeValue)) nodesToProcess.push(node);
    }
    if (!nodesToProcess.length) return;

    for (const n of nodesToProcess) {
      processed.add(n); // Mark immediately to avoid double-processing
      try {
        const result = await chrome.runtime.sendMessage({
          type: 'RESTORE',
          payload: { masked_text: n.nodeValue, session_id: sessionId },
        });
        if (result?.restored_text && result.restored_text !== n.nodeValue) {
          n.nodeValue = result.restored_text;
        }
      } catch { /* extension context gone — ignore */ }
    }
  }

  // ─── Hard Block Overlay ───────────────────────────────────────────────────

  function showHardBlock(entities) {
    removeAllOverlays();
    const overlay = document.createElement('div');
    overlay.id = 'mazikdlp-overlay';
    overlay.className = 'mazikdlp-overlay';
    overlay.innerHTML = `
      <div class="mazikdlp-modal mazikdlp-modal-block">
        <div class="mazikdlp-modal-icon block-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 class="mazikdlp-modal-title">Sensitive Data Detected</h2>
        <p class="mazikdlp-modal-sub">Your prompt contains sensitive information that violates your organization's DLP policy. Submission has been blocked.</p>
        ${entityListHtml(entities)}
        <div class="mazikdlp-modal-actions">
          <button class="mazikdlp-btn-primary" id="mazikdlp-edit-btn">Edit Prompt</button>
        </div>
        <p class="mazikdlp-modal-footer">Protected by <strong>MazikDLP</strong> · ${platform.name}</p>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('mazikdlp-edit-btn').onclick = () => {
      removeAllOverlays();
      findElement(platform.inputSelectors)?.focus();
    };
  }

  // ─── Soft Block Overlay ───────────────────────────────────────────────────

  function showSoftBlock(entities, onSendAnyway) {
    removeAllOverlays();
    const overlay = document.createElement('div');
    overlay.id = 'mazikdlp-overlay';
    overlay.className = 'mazikdlp-overlay';
    overlay.innerHTML = `
      <div class="mazikdlp-modal mazikdlp-modal-warn">
        <div class="mazikdlp-modal-icon warn-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 class="mazikdlp-modal-title">Sensitive Data Warning</h2>
        <p class="mazikdlp-modal-sub">Your prompt may contain sensitive information. You can edit it or proceed — this action will be logged.</p>
        ${entityListHtml(entities)}
        <div class="mazikdlp-modal-actions">
          <button class="mazikdlp-btn-secondary" id="mazikdlp-edit-btn">Edit Prompt</button>
          <button class="mazikdlp-btn-danger" id="mazikdlp-send-btn">Send Anyway</button>
        </div>
        <p class="mazikdlp-modal-footer">Protected by <strong>MazikDLP</strong> · ${platform.name}</p>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('mazikdlp-edit-btn').onclick = () => {
      removeAllOverlays();
      findElement(platform.inputSelectors)?.focus();
    };
    document.getElementById('mazikdlp-send-btn').onclick = () => {
      removeAllOverlays();
      onSendAnyway();
    };
  }

  // ─── Alert Toast ─────────────────────────────────────────────────────────

  function showAlertToast(count) {
    document.getElementById('mazikdlp-toast')?.remove();
    const toast = document.createElement('div');
    toast.id = 'mazikdlp-toast';
    toast.className = 'mazikdlp-toast';
    toast.innerHTML = `<span class="mazikdlp-toast-icon">⚠️</span><span>MazikDLP: ${count} sensitive item${count !== 1 ? 's' : ''} detected and logged.</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function removeAllOverlays() {
    document.getElementById('mazikdlp-overlay')?.remove();
  }

  function entityListHtml(entities) {
    if (!entities?.length) return '';
    const items = entities.map(e => `
      <div class="mazikdlp-entity-item">
        <span class="mazikdlp-entity-type">${esc(e.entity_type || 'UNKNOWN')}</span>
        <span class="mazikdlp-entity-value">${esc(trunc(e.text || '', 40))}</span>
      </div>`).join('');
    return `<div class="mazikdlp-entity-list">
      <div class="mazikdlp-entity-header">Detected (${entities.length})</div>${items}
    </div>`;
  }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function trunc(str, len) {
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  // ─── Image Upload Check ──────────────────────────────────────────────────
  // When a user picks a file in any <input type="file">, scan the first 64 KB
  // for the MAZIKDLP_REDACTED marker. If absent, show a soft-block overlay.

  const MAZIKDLP_MARKER = new TextEncoder().encode('MAZIKDLP_REDACTED');

  function bufferContainsMarker(buffer) {
    const bytes = new Uint8Array(buffer);
    const mlen = MAZIKDLP_MARKER.length;
    outer: for (let i = 0; i <= bytes.length - mlen; i++) {
      for (let j = 0; j < mlen; j++) {
        if (bytes[i + j] !== MAZIKDLP_MARKER[j]) continue outer;
      }
      return true;
    }
    return false;
  }

  function showImageSoftBlock(filename, onUploadAnyway, onCancel) {
    removeAllOverlays();
    const overlay = document.createElement('div');
    overlay.id = 'mazikdlp-overlay';
    overlay.className = 'mazikdlp-overlay';
    overlay.innerHTML = `
      <div class="mazikdlp-modal mazikdlp-modal-warn">
        <div class="mazikdlp-modal-icon warn-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 class="mazikdlp-modal-title">Image Not Redacted</h2>
        <p class="mazikdlp-modal-sub">
          <strong>${esc(filename)}</strong> has not been processed by MazikDLP.
          It may contain PII or sensitive visual data. Use the MazikDLP extension to redact it first.
        </p>
        <div class="mazikdlp-entity-list" style="margin-bottom:4px">
          <div class="mazikdlp-entity-header">Tip</div>
          <div class="mazikdlp-entity-item">
            <span class="mazikdlp-entity-type">How to redact</span>
            <span class="mazikdlp-entity-value">Click the MazikDLP icon → Redact Image</span>
          </div>
        </div>
        <div class="mazikdlp-modal-actions">
          <button class="mazikdlp-btn-secondary" id="mazikdlp-img-cancel">Cancel Upload</button>
          <button class="mazikdlp-btn-danger" id="mazikdlp-img-anyway">Upload Anyway</button>
        </div>
        <p class="mazikdlp-modal-footer">Protected by <strong>MazikDLP</strong> · ${platform.name}</p>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('mazikdlp-img-cancel').onclick = () => { removeAllOverlays(); onCancel(); };
    document.getElementById('mazikdlp-img-anyway').onclick = () => { removeAllOverlays(); onUploadAnyway(); };
  }

  // Tracks inputs where user chose "Upload Anyway" — skip check once
  const _bypassImageCheck = new WeakSet();

  // Capture file input change events at the document level
  document.addEventListener('change', async (e) => {
    const input = e.target;
    if (input.tagName !== 'INPUT' || input.type !== 'file') return;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) return; // Only intercept images

    // "Upload Anyway" was chosen — let this event through and clear the bypass flag
    if (_bypassImageCheck.has(input)) {
      _bypassImageCheck.delete(input);
      return;
    }

    // Read first 64 KB to check for marker
    const slice = file.slice(0, 65536);
    let hasMarker = false;
    try {
      const buffer = await slice.arrayBuffer();
      hasMarker = bufferContainsMarker(buffer);
    } catch {
      return; // Can't read file — fail open
    }

    if (hasMarker) return; // MazikDLP-approved image — allow

    // No marker → soft block
    e.stopImmediatePropagation();
    e.preventDefault();

    showImageSoftBlock(file.name,
      () => {
        // Mark this input to bypass the check on the next change event, then re-fire
        _bypassImageCheck.add(input);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      },
      () => {
        // Cancel — clear selection
        input.value = '';
      }
    );
  }, true); // capture: true

})();
