import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { isNativeApp } from './runtime';

const PREFIX = 'college-placement_';
const KEYS = {
  token: 'token',
  user: 'user',
};

let prefixReady = false;

const ensurePrefix = async () => {
  if (!isNativeApp() || prefixReady) return;
  await SecureStorage.setKeyPrefix(PREFIX);
  prefixReady = true;
};

const browserKey = (key) => `${PREFIX}${key}`;

const browserStore = {
  async get(key) {
    return localStorage.getItem(browserKey(key));
  },
  async set(key, value) {
    localStorage.setItem(browserKey(key), value);
  },
  async remove(key) {
    localStorage.removeItem(browserKey(key));
  },
  async clear() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(browserKey(key)));
  },
};

const nativeStore = {
  async get(key) {
    await ensurePrefix();
    return SecureStorage.getItem(key);
  },
  async set(key, value) {
    await ensurePrefix();
    await SecureStorage.setItem(key, value);
  },
  async remove(key) {
    await ensurePrefix();
    await SecureStorage.removeItem(key);
  },
  async clear() {
    await ensurePrefix();
    await SecureStorage.clear();
  },
};

const store = () => (isNativeApp() ? nativeStore : browserStore);

const readLegacyValue = (key) => {
  const prefixed = localStorage.getItem(browserKey(key));
  if (prefixed != null) return prefixed;
  return localStorage.getItem(key);
};

const removeLegacyValue = (key) => {
  localStorage.removeItem(key);
  localStorage.removeItem(browserKey(key));
};

const parseUser = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const sessionStore = {
  async hydrate() {
    const legacyToken = readLegacyValue(KEYS.token);
    const legacyUser = readLegacyValue(KEYS.user);

    if (legacyToken && isNativeApp()) {
      await nativeStore.set(KEYS.token, legacyToken);
      removeLegacyValue(KEYS.token);
    }

    if (legacyUser && isNativeApp()) {
      await nativeStore.set(KEYS.user, legacyUser);
      removeLegacyValue(KEYS.user);
    }

    if (!isNativeApp()) {
      if (legacyToken != null && localStorage.getItem(browserKey(KEYS.token)) == null) {
        await browserStore.set(KEYS.token, legacyToken);
      }
      if (legacyUser != null && localStorage.getItem(browserKey(KEYS.user)) == null) {
        await browserStore.set(KEYS.user, legacyUser);
      }
      removeLegacyValue(KEYS.token);
      removeLegacyValue(KEYS.user);
      if (legacyToken != null) await browserStore.set(KEYS.token, legacyToken);
      if (legacyUser != null) await browserStore.set(KEYS.user, legacyUser);
    }
  },

  async getToken() {
    return store().get(KEYS.token);
  },

  async getUser() {
    return parseUser(await store().get(KEYS.user));
  },

  async getSession() {
    const [token, user] = await Promise.all([this.getToken(), this.getUser()]);
    return { token, user };
  },

  async setSession({ token, user }) {
    const writes = [];
    if (token) writes.push(store().set(KEYS.token, token));
    else writes.push(store().remove(KEYS.token));

    if (user) writes.push(store().set(KEYS.user, JSON.stringify(user)));
    else writes.push(store().remove(KEYS.user));

    await Promise.all(writes);
    removeLegacyValue(KEYS.token);
    removeLegacyValue(KEYS.user);
  },

  async setUser(user) {
    if (!user) {
      await store().remove(KEYS.user);
      return;
    }
    await store().set(KEYS.user, JSON.stringify(user));
    removeLegacyValue(KEYS.user);
  },

  async clearSession() {
    await store().clear();
    removeLegacyValue(KEYS.token);
    removeLegacyValue(KEYS.user);
  },
};
