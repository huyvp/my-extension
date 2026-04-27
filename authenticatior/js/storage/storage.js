import { cryptoUtils } from './crypto.js';

const KEY = 'auth_data_secure';
const SETTINGS_KEY = 'auth_settings';

export const storage = {
  // Determine which storage to use based on settings
  getStorageAPI(type = 'local') {
    return type === 'sync' ? chrome.storage.sync : chrome.storage.local;
  },

  async getRaw(type = 'local') {
    const api = this.getStorageAPI(type);
    const data = await api.get([KEY]);
    return data[KEY] || null;
  },

  async getSettings() {
    const data = await chrome.storage.local.get([SETTINGS_KEY]);
    return data[SETTINGS_KEY] || { theme: 'light', lang: 'en', hasMasterPassword: false, visibility: 'show', storageType: 'local' };
  },

  async saveSecure(accounts, password, type = 'local') {
    const encrypted = await cryptoUtils.encrypt({ accounts }, password);
    const api = this.getStorageAPI(type);
    await api.set({ [KEY]: encrypted });
    
    const settings = await this.getSettings();
    settings.hasMasterPassword = true;
    settings.storageType = type;
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  },

  async decryptData(password, type = 'local') {
    const raw = await this.getRaw(type);
    if (!raw) return { accounts: [] };
    return await cryptoUtils.decrypt(raw, password);
  }
};
