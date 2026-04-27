import { i18n } from './i18n/i18n.js';
import { storage } from './storage/storage.js';
import { accountUtils } from './accounts/logic.js';

const state = {
  accounts: [],
  settings: { theme: 'light', lang: 'en', hasMasterPassword: false, visibility: 'show', storageType: 'local' },
  masterPassword: null,
  isLocked: true,
  revealedCodes: new Set(),
  searchQuery: '',
  accountToDelete: null,
  addMode: 'manual'
};

async function bootstrap() {
  const settingsData = await storage.getSettings();
  state.settings = { ...state.settings, ...settingsData };
  await i18n.init();
  applyTheme(state.settings.theme);
  updateI18n();

  let sessionKey = null;
  if (chrome.storage.session) {
    const sessionData = await chrome.storage.session.get(['sessionKey']);
    sessionKey = sessionData.sessionKey;
  }

  if (sessionKey) {
    try {
      const decrypted = await storage.decryptData(sessionKey, state.settings.storageType);
      state.accounts = decrypted.accounts || [];
      state.masterPassword = sessionKey;
      state.isLocked = false;
      startApp();
    } catch (e) { lockApp(true); }
  } else if (state.settings.hasMasterPassword) {
    lockApp(true);
  } else {
    state.isLocked = false;
    showUnlockModal(true);
  }

  bindEvents();
}

function lockApp(silent = false) {
  state.isLocked = true;
  showUnlockModal(false, silent);
}

function startApp() {
  render();
  setInterval(updateTimers, 1000);
}

function showUnlockModal(isFirstTime, silent = false) {
  const modal = document.getElementById('unlock-modal');
  modal.classList.add('active');
  const errorEl = document.getElementById('unlock-error');
  errorEl.classList.add('hidden'); // Always hide error initially

  if (isFirstTime) {
    document.getElementById('unlock-title').textContent = 'Setup Security';
  } else {
    document.getElementById('unlock-title').textContent = 'Unlock Vault';
  }
}

async function handleUnlock() {
  const pwd = document.getElementById('master-password').value;
  const errorEl = document.getElementById('unlock-error');

  if (!pwd) {
    errorEl.textContent = 'Please enter a password.';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    if (!state.settings.hasMasterPassword) {
      state.masterPassword = pwd;
      await storage.saveSecure([], pwd, state.settings.storageType);
      state.settings.hasMasterPassword = true;
      await chrome.storage.local.set({ auth_settings: state.settings });
    } else {
      const decrypted = await storage.decryptData(pwd, state.settings.storageType);
      state.accounts = decrypted.accounts || [];
      state.masterPassword = pwd;
    }

    if (chrome.storage.session) {
      await chrome.storage.session.set({ sessionKey: pwd });
    }

    state.isLocked = false;
    document.getElementById('unlock-modal').classList.remove('active');
    document.getElementById('master-password').value = '';
    errorEl.classList.add('hidden');
    startApp();
  } catch (e) {
    errorEl.textContent = 'Incorrect password.';
    errorEl.classList.remove('hidden');
  }
}

function render() {
  if (state.isLocked) return;

  const container = document.getElementById('account-list');
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) exportBtn.disabled = state.accounts.length === 0;

  const filteredAccounts = state.accounts.filter(acc => {
    const q = state.searchQuery.toLowerCase();
    return (acc.name && acc.name.toLowerCase().includes(q)) ||
      (acc.issuer && acc.issuer.toLowerCase().includes(q));
  });

  if (filteredAccounts.length === 0) {
    container.innerHTML = `<div class="empty-state">No accounts found</div>`;
    return;
  }

  container.innerHTML = filteredAccounts.map(acc => {
    let code = '--- ---';
    let remaining = 30;
    try {
      const totp = new OTPAuth.TOTP({ secret: acc.secret });
      code = totp.generate();
      remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    } catch (e) {
      code = 'ERR';
    }

    const isRevealed = state.settings.visibility === 'show' || state.revealedCodes.has(acc.id);

    return `
      <div class="card" data-id="${acc.id}" style="--acc-color: ${acc.color || '#3b82f6'}">
        <img class="avatar" src="${accountUtils.getLogo(acc.issuer)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(acc.issuer || '?')}'">
        <div class="content">
          <div class="card-header-line">
            <span class="issuer">${acc.issuer || 'Authenticator'}</span>
          </div>
          <div class="name">${acc.name}</div>
        </div>
        <div class="otp-area">
          ${isRevealed
        ? `<div class="code-val ${remaining < 5 ? 'urgent' : ''}" style="cursor:pointer;" data-action="copy" data-id="${acc.id}" title="Click to copy">${code.length === 6 ? code.slice(0, 3) + ' ' + code.slice(3) : code}</div>`
        : `<div class="code-hidden" data-action="reveal" data-id="${acc.id}">${i18n.t('reveal')}</div>`
      }
          <div style="display:flex; flex-direction:column; align-items:center;">
             <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
               <svg class="timer-svg" viewBox="0 0 24 24" style="position: absolute; inset: 0; margin: 0; width: 100%; height: 100%;">
                  <circle cx="12" cy="12" r="10" style="stroke-dashoffset: ${63 - (remaining / 30) * 63}" />
               </svg>
               <span class="timer-text" style="font-size:10px; font-weight:700; color:var(--ms-blue); z-index: 1;">${remaining}</span>
             </div>
             <div class="card-actions" style="margin-top:4px;">
               <button class="mini-btn" data-action="delete" data-id="${acc.id}" title="Delete"><span class="material-symbols-outlined">delete</span></button>
             </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateTimers() {
  if (state.isLocked) return;
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    const id = card.dataset.id;
    const acc = state.accounts.find(a => a.id === id);
    if (!acc) return;

    let code = '--- ---';
    let remaining = 30;
    try {
      const totp = new OTPAuth.TOTP({ secret: acc.secret });
      code = totp.generate();
      remaining = 30 - (Math.floor(Date.now() / 1000) % 30);
    } catch (e) {
      code = 'ERR';
    }

    const isRevealed = state.settings.visibility === 'show' || state.revealedCodes.has(acc.id);
    if (isRevealed) {
      const codeEl = card.querySelector('.code-val');
      if (codeEl) {
        codeEl.textContent = code.length === 6 ? code.slice(0, 3) + ' ' + code.slice(3) : code;
        if (remaining < 5) codeEl.classList.add('urgent');
        else codeEl.classList.remove('urgent');
      }
    }

    const circle = card.querySelector('circle');
    if (circle) circle.style.strokeDashoffset = 63 - (remaining / 30) * 63;

    const timeSpan = card.querySelector('.timer-text');
    if (timeSpan) timeSpan.textContent = remaining;
  });
}

function revealCode(id) {
  state.revealedCodes.add(id);
  render();
}

async function copyCode(id) {
  const acc = state.accounts.find(a => a.id === id);
  if (!acc) return;
  const code = new OTPAuth.TOTP({ secret: acc.secret }).generate();
  await navigator.clipboard.writeText(code);
  toast('Code copied to clipboard!');
}

function promptDelete(id) {
  state.accountToDelete = id;
  document.getElementById('delete-modal').classList.add('active');
}

function parseURI(uri) {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth:' || url.hostname !== 'totp') return null;
    const pathParts = decodeURIComponent(url.pathname).replace(/^\//, '').split(':');
    const issuerInfo = url.searchParams.get('issuer') || (pathParts.length > 1 ? pathParts[0] : '');
    const accountName = pathParts.length > 1 ? pathParts[1] : pathParts[0];
    const secret = url.searchParams.get('secret');
    if (!secret) return null;
    return [{ secret: secret.toUpperCase(), issuer: issuerInfo, name: accountName }];
  } catch (e) { return null; }
}

function base32Encode(data) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function parseMigrationURI(uri) {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth-migration:') return null;
    const dataB64 = url.searchParams.get('data');
    if (!dataB64) return null;

    // Decode base64 to bytes
    let b64 = dataB64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length).map((_, i) => bin.charCodeAt(i));

    let pos = 0;
    const accounts = [];

    function readVarint() {
      let result = 0;
      let shift = 0;
      while (pos < bytes.length) {
        const b = bytes[pos++];
        result |= (b & 0x7f) << shift;
        if (!(b & 0x80)) break;
        shift += 7;
      }
      return result;
    }

    while (pos < bytes.length) {
      const tag = readVarint();
      const fieldNum = tag >> 3;
      const wireType = tag & 7;

      if (fieldNum === 1 && wireType === 2) {
        const msgLength = readVarint();
        const endPos = pos + msgLength;
        let secret = null;
        let name = '';
        let issuer = '';

        while (pos < endPos) {
          const innerTag = readVarint();
          const innerField = innerTag >> 3;
          const innerWire = innerTag & 7;
          if (innerWire === 2) {
            const len = readVarint();
            const data = bytes.subarray(pos, pos + len);
            if (innerField === 1) secret = base32Encode(data);
            else if (innerField === 2) name = new TextDecoder().decode(data);
            else if (innerField === 3) issuer = new TextDecoder().decode(data);
            pos += len;
          } else if (innerWire === 0) {
            readVarint();
          } else break;
        }
        if (secret) accounts.push({ secret, name: name || issuer || 'Account', issuer: issuer || name });
        pos = endPos;
      } else if (wireType === 0) readVarint();
      else if (wireType === 2) { const len = readVarint(); pos += len; }
      else if (wireType === 5) pos += 4;
      else if (wireType === 1) pos += 8;
      else break;
    }
    return accounts;
  } catch (e) { return null; }
}

function bindEvents() {
  const $ = id => document.getElementById(id);

  $('unlock-btn').onclick = handleUnlock;
  $('master-password').onkeypress = (e) => { if (e.key === 'Enter') handleUnlock(); };

  $('search-input').oninput = (e) => {
    state.searchQuery = e.target.value;
    render();
  };

  $('account-list').addEventListener('click', (e) => {
    const copyBtn = e.target.closest('[data-action="copy"]');
    if (copyBtn) {
      copyCode(copyBtn.dataset.id);
      return;
    }

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn) {
      promptDelete(delBtn.dataset.id);
      return;
    }

    const revealBtn = e.target.closest('[data-action="reveal"]');
    if (revealBtn) {
      revealCode(revealBtn.dataset.id);
      return;
    }
  });

  $('theme-btn').onclick = () => {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme(state.settings.theme);
  };

  // Language Modal
  $('lang-btn').onclick = () => {
    $('lang-select').value = i18n.current;
    $('lang-modal').classList.add('active');
  };
  $('lang-cancel').onclick = () => $('lang-modal').classList.remove('active');
  $('lang-save').onclick = async () => {
    await i18n.setLang($('lang-select').value);
    window.location.reload();
  };

  // Settings modal
  $('settings-btn').onclick = () => {
    $('st-visibility').value = state.settings.visibility || 'show';
    $('st-storage-type').value = state.settings.storageType || 'local';
    $('settings-modal').classList.add('active');
  };
  $('st-close').onclick = async () => {
    const oldType = state.settings.storageType;
    state.settings.visibility = $('st-visibility').value;
    state.settings.storageType = $('st-storage-type').value;
    await chrome.storage.local.set({ auth_settings: state.settings });

    if (oldType !== state.settings.storageType && state.masterPassword) {
      await storage.saveSecure(state.accounts, state.masterPassword, state.settings.storageType);
      toast(`Storage migrated to ${state.settings.storageType}`);
    }
    $('settings-modal').classList.remove('active');
    render();
  };

  // Add modal
  $('add-fab').onclick = () => {
    $('add-modal').classList.add('active');
    $('in-secret').value = ''; $('in-name').value = ''; $('in-issuer').value = ''; $('in-uri').value = '';
    $('secret-error').classList.add('hidden');
    $('add-save').disabled = false;
  };
  $('add-cancel').onclick = () => $('add-modal').classList.remove('active');

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      t.classList.add('active');
      state.addMode = t.dataset.tab;
      $(`tab-${state.addMode}`).classList.remove('hidden');
    };
  });

  // QR Image Upload
  const qrInput = $('qr-input');
  if (qrInput) {
    qrInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            $('in-uri').value = code.data;
            toast('QR Code scanned successfully');
          } else {
            toast('No QR code found in image');
          }
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
  }

  // Base32 Validator removed from oninput, moved to Save button

  $('add-save').onclick = async () => {
    const category = $('in-category').value;
    const color = $('in-color').value;
    let newAccounts = [];

    if (state.addMode === 'manual') {
      const secret = $('in-secret').value.trim().replace(/\s/g, '').toUpperCase();
      const name = $('in-name').value.trim();
      const issuer = $('in-issuer').value.trim();

      if (!secret || !name) {
        $('secret-error').textContent = 'Please enter Name and Secret Key.';
        $('secret-error').classList.remove('hidden');
        return;
      }

      const isValid = /^[A-Z2-7=]+$/.test(secret);
      if (!isValid) {
        $('secret-error').textContent = 'Invalid Base32 character found.';
        $('secret-error').classList.remove('hidden');
        return;
      }
      $('secret-error').classList.add('hidden');
      newAccounts.push({ secret, name, issuer });
    } else {
      const uri = $('in-uri').value.trim();
      if (uri.startsWith('otpauth-migration://')) {
        const parsedAccounts = parseMigrationURI(uri);
        if (!parsedAccounts || parsedAccounts.length === 0) return toast('Invalid or empty migration URI');
        newAccounts = parsedAccounts;
      } else {
        const parsed = parseURI(uri);
        if (!parsed || parsed.length === 0) return toast('Invalid OTPAuth URI');
        newAccounts = parsed;
      }
    }

    if (newAccounts.length > 0) {
      newAccounts.forEach(acc => {
        state.accounts.push({
          id: crypto.randomUUID(),
          secret: acc.secret,
          name: acc.name,
          issuer: acc.issuer,
          category,
          color
        });
      });
      await storage.saveSecure(state.accounts, state.masterPassword, state.settings.storageType);
      $('add-modal').classList.remove('active');
      toast(`Added ${newAccounts.length} account(s)`);
      render();
    }
  };

  // Delete confirm modal
  $('delete-cancel').onclick = () => {
    state.accountToDelete = null;
    $('delete-modal').classList.remove('active');
  };
  $('delete-confirm').onclick = async () => {
    if (state.accountToDelete) {
      state.accounts = state.accounts.filter(a => a.id !== state.accountToDelete);
      await storage.saveSecure(state.accounts, state.masterPassword, state.settings.storageType);
      state.accountToDelete = null;
      $('delete-modal').classList.remove('active');
      render();
      toast('Account deleted');
    }
  };

  // Export/Import in settings
  const exportBtn = $('export-btn');
  if (exportBtn) {
    exportBtn.onclick = async () => {
      const blob = new Blob([JSON.stringify({ accounts: state.accounts }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'auth_backup.json';
      a.click();
    };
  }

  // Change Password
  $('change-pwd-btn').onclick = () => {
    $('change-pwd-modal').classList.add('active');
    $('cp-error').classList.add('hidden');
    $('cp-old').value = '';
    $('cp-new').value = '';
  };
  $('cp-cancel').onclick = () => $('change-pwd-modal').classList.remove('active');
  $('cp-save').onclick = async () => {
    const oldPwd = $('cp-old').value;
    const newPwd = $('cp-new').value;
    const errorEl = $('cp-error');

    if (!oldPwd || !newPwd) {
      errorEl.textContent = 'Please fill both fields.';
      errorEl.classList.remove('hidden');
      return;
    }

    if (oldPwd !== state.masterPassword) {
      errorEl.textContent = 'Incorrect old password.';
      errorEl.classList.remove('hidden');
      return;
    }

    try {
      state.masterPassword = newPwd;
      await storage.saveSecure(state.accounts, newPwd, state.settings.storageType);
      if (chrome.storage.session) {
        await chrome.storage.session.set({ sessionKey: newPwd });
      }
      $('change-pwd-modal').classList.remove('active');
      toast('Master Password changed successfully.');
    } catch (e) {
      errorEl.textContent = 'Error saving new password.';
      errorEl.classList.remove('hidden');
    }
  };

  const importInput = $('import-input');
  if (importInput) {
    importInput.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const imported = JSON.parse(ev.target.result);
          if (imported.accounts) {
            state.accounts = [...state.accounts, ...imported.accounts];
            await storage.saveSecure(state.accounts, state.masterPassword, state.settings.storageType);
            toast('Import successful');
            render();
          }
        };
        reader.readAsText(file);
      } catch (err) { toast('Import failed'); }
    };
  }
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  chrome.storage.local.set({ auth_settings: state.settings });
}

function updateI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = i18n.t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = i18n.t(el.getAttribute('data-i18n-ph'));
  });
}

let toastTimeout;
function toast(m) {
  const container = document.getElementById('toast-container');
  container.textContent = m;
  container.classList.remove('hidden');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    container.classList.add('hidden');
  }, 2500);
}

bootstrap();
