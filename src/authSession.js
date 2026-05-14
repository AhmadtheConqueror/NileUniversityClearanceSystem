const readStorageValue = (storage, key) => {
  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
};

const writeStorageValue = (storage, key, value) => {
  try {
    storage?.setItem(key, value);
  } catch {
    // Storage can be unavailable in private windows; keep the app usable.
  }
};

const removeStorageValue = (storage, key) => {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage can be unavailable in private windows; keep logout best-effort.
  }
};

const parseUser = (rawValue) => {
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

export const getAuthUser = (key) => {
  const tabUser = parseUser(readStorageValue(window.sessionStorage, key));
  if (tabUser) return tabUser;

  return parseUser(readStorageValue(window.localStorage, key));
};

export const saveAuthUser = (key, user) => {
  const serialized = JSON.stringify(user);
  writeStorageValue(window.sessionStorage, key, serialized);
  writeStorageValue(window.localStorage, key, serialized);
};

export const clearAuthUser = (key) => {
  removeStorageValue(window.sessionStorage, key);
  removeStorageValue(window.localStorage, key);
};
