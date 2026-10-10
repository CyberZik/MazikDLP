/**
 * MazikDLP Popup Script
 */

const $ = (id) => document.getElementById(id);

function showLoading() {
  $('loading-view').style.display = 'block';
  $('login-view').style.display = 'none';
  $('status-view').style.display = 'none';
}

function showLogin() {
  $('loading-view').style.display = 'none';
  $('login-view').style.display = 'block';
  $('status-view').style.display = 'none';
}

function showStatus(user, scanCount, blockCount) {
  $('loading-view').style.display = 'none';
  $('login-view').style.display = 'none';
  $('status-view').style.display = 'block';

  const email = user?.email || '';
  const name = user?.name || email.split('@')[0] || 'User';
  const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  $('user-avatar').textContent = initials || '?';
  $('user-name').textContent = name;
  $('user-email').textContent = email;
  $('scan-count').textContent = scanCount;
  $('block-count').textContent = blockCount;
}

function setError(msg) {
  const el = $('login-error');
  if (msg) { el.textContent = msg; el.style.display = 'block'; }
  else el.style.display = 'none';
}

async function init() {
  showLoading();
  const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  if (status.isLoggedIn) {
    showStatus(status.user, status.scanCount, status.blockCount);
  } else {
    showLogin();
  }
}

$('login-btn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  const password = $('password').value;
  if (!email || !password) { setError('Please enter your email and password.'); return; }

  setError(null);
  $('login-btn').disabled = true;
  $('login-btn').textContent = 'Signing in…';

  const result = await chrome.runtime.sendMessage({ type: 'LOGIN', payload: { email, password } });

  $('login-btn').disabled = false;
  $('login-btn').textContent = 'Sign In';

  if (result?.error) {
    setError(result.error);
  } else if (result?.success) {
    const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    showStatus(status.user, status.scanCount, status.blockCount);
  }
});

$('password').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('login-btn').click(); });
$('email').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('password').focus(); });

$('signout-btn').addEventListener('click', async () => {
  $('signout-btn').textContent = 'Signing out…';
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  showLogin();
  $('email').value = '';
  $('password').value = '';
});

// ── Image Redaction ──────────────────────────────────────────────────────────

let _redactFile = null;

$('redact-input').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  _redactFile = file;
  $('redact-label-text').textContent = file.name.length > 28 ? file.name.slice(0, 25) + '…' : file.name;
  $('redact-btn').disabled = false;
  $('redact-status').style.display = 'none';
});

async function redactFetch(apiBase, token, file) {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${apiBase}/redact-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
}

$('redact-btn').addEventListener('click', async () => {
  if (!_redactFile) return;

  const storage = await chrome.storage.local.get(['access_token', 'api_base']);
  let token = storage.access_token;
  const apiBase = storage.api_base || 'http://localhost:8000/api/v1';

  if (!token) {
    setRedactStatus('error', 'Not signed in. Please sign in first.');
    return;
  }

  setRedactStatus('loading', 'Redacting image…');
  $('redact-btn').disabled = true;

  try {
    let res = await redactFetch(apiBase, token, _redactFile);

    // Token expired — ask background to refresh, then retry once
    if (res.status === 401) {
      const refreshed = await chrome.runtime.sendMessage({ type: 'REFRESH_TOKEN' });
      if (refreshed?.error) throw new Error('Session expired. Please sign out and sign in again.');
      token = refreshed.access_token;
      res = await redactFetch(apiBase, token, _redactFile);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `HTTP ${res.status}`);
    }

    // Get filename from Content-Disposition header
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `redacted_${_redactFile.name}`;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    setRedactStatus('success', `Done! "${filename}" downloaded.`);
  } catch (err) {
    setRedactStatus('error', err.message || 'Redaction failed.');
  } finally {
    $('redact-btn').disabled = false;
  }
});

function setRedactStatus(type, msg) {
  const el = $('redact-status');
  el.className = `redact-status ${type}`;
  el.textContent = msg;
  el.style.display = 'block';
}

init();
