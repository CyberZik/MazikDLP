/**
 * MazikDLP Background Service Worker
 * Handles authentication, API communication, and token management.
 */

const DEFAULT_API_BASE = 'http://localhost:8000/api/v1';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getApiBase() {
  const result = await chrome.storage.local.get('api_base');
  return result.api_base || DEFAULT_API_BASE;
}

async function getTokens() {
  const result = await chrome.storage.local.get(['access_token', 'refresh_token']);
  return { accessToken: result.access_token, refreshToken: result.refresh_token };
}

async function setTokens(accessToken, refreshToken) {
  await chrome.storage.local.set({ access_token: accessToken, refresh_token: refreshToken });
}

async function clearAuth() {
  await chrome.storage.local.remove(['access_token', 'refresh_token', 'current_user']);
}

// ─── Token Refresh ───────────────────────────────────────────────────────────

async function refreshAccessToken() {
  const { refreshToken } = await getTokens();
  if (!refreshToken) return null;

  const apiBase = await getApiBase();
  try {
    const res = await fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      await clearAuth();
      return null;
    }
    const data = await res.json();
    const newAccess = data.access_token || data.data?.access_token;
    const newRefresh = data.refresh_token || data.data?.refresh_token || refreshToken;
    await setTokens(newAccess, newRefresh);
    return newAccess;
  } catch {
    return null;
  }
}

// ─── Authenticated Fetch (auto-retry on 401) ─────────────────────────────────

async function authFetch(path, options = {}) {
  const apiBase = await getApiBase();
  let { accessToken } = await getTokens();

  const doFetch = (token) =>
    fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

  let res = await doFetch(accessToken);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) throw new Error('UNAUTHORIZED');
    res = await doFetch(newToken);
  }

  return res;
}

// ─── Message Handlers ────────────────────────────────────────────────────────

async function handleLogin({ email, password }) {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();
  if (!res.ok) {
    const msg = body?.error?.message || body?.detail || body?.message || 'Login failed';
    throw new Error(msg);
  }

  const data = body.data || body;
  const accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const user = data.user || {};

  await chrome.storage.local.set({
    access_token: accessToken,
    refresh_token: refreshToken,
    current_user: user,
  });

  // Update extension badge
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

  return { success: true, user };
}

async function handleLogout() {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore — clear locally regardless
  }
  await clearAuth();
  chrome.action.setBadgeText({ text: '' });
  return { success: true };
}

async function handleGetStatus() {
  const result = await chrome.storage.local.get(['access_token', 'current_user', 'scan_count', 'block_count']);
  return {
    isLoggedIn: !!result.access_token,
    user: result.current_user || null,
    scanCount: result.scan_count || 0,
    blockCount: result.block_count || 0,
  };
}

async function handleScan({ text, platform }) {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    console.warn('[MazikDLP] No access token — blocking unauthenticated scan');
    return { action: 'hard_block', entities_detected: [], unauthenticated: true };
  }

  console.log(`[MazikDLP] Scanning ${text.length} chars on ${platform}`);

  const res = await authFetch('/scan', {
    method: 'POST',
    body: JSON.stringify({ text, platform }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[MazikDLP] Scan failed: HTTP ${res.status}`, errBody);
    if (res.status === 401) {
      return { action: 'hard_block', entities_detected: [], unauthenticated: true };
    }
    return { action: 'allow', entities_detected: [], error: true };
  }

  const body = await res.json();
  const data = body.data || body;
  console.log(`[MazikDLP] Scan result: action=${data.action}, entities=${data.entities_detected?.length ?? 0}`);

  // Update stats
  const stored = await chrome.storage.local.get(['scan_count', 'block_count']);
  const scanCount = (stored.scan_count || 0) + 1;
  let blockCount = stored.block_count || 0;
  if (data.action === 'hard_block' || data.action === 'soft_block') blockCount++;

  await chrome.storage.local.set({ scan_count: scanCount, block_count: blockCount });

  // Update badge if blocked
  if (data.action === 'hard_block' || data.action === 'soft_block') {
    const count = (data.entities_detected || []).length;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    // Clear badge after 5s
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);
  }

  return data;
}

async function handleRestore({ masked_text, session_id }) {
  const res = await authFetch('/restore', {
    method: 'POST',
    body: JSON.stringify({ masked_text, session_id }),
  });

  if (!res.ok) return { restored_text: masked_text };
  const body = await res.json();
  const data = body.data || body;
  return { restored_text: data.restored_text || masked_text };
}

// ─── Main Message Listener ───────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      case 'LOGIN':
        return await handleLogin(message.payload);
      case 'LOGOUT':
        return await handleLogout();
      case 'GET_STATUS':
        return await handleGetStatus();
      case 'SCAN':
        return await handleScan({ ...message.payload, tabId: sender.tab?.id });
      case 'RESTORE':
        return await handleRestore(message.payload);
      case 'REFRESH_TOKEN': {
        const token = await refreshAccessToken();
        if (!token) return { error: 'Session expired. Please sign in again.' };
        return { access_token: token };
      }
      default:
        return { error: 'Unknown message type' };
    }
  };

  handle()
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message || 'Unknown error' }));

  return true; // Keep message channel open for async response
});

// ─── Startup ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[MazikDLP] Extension installed/updated.');
  chrome.storage.local.set({ scan_count: 0, block_count: 0 });
});
