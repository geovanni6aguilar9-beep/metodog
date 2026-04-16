export const loadStorage = (key, defaultValue = []) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed && parsed.data !== undefined ? parsed.data : parsed;
  } catch {
    return defaultValue;
  }
};

export const saveStorage = (key, value, version = 1) => {
  try {
    localStorage.setItem(key, JSON.stringify({ version, data: value }));
  } catch (e) {
    console.error('Storage save error', e);
  }
};
