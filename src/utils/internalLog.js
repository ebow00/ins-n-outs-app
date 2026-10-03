import AsyncStorage from '@react-native-async-storage/async-storage';

// Developer-only diagnostics: never shown to the user.
// console.log (unlike console.error/warn) doesn't raise the dev overlay toast.
const LOG_KEY = '@gastro_internal_log';
const MAX_ENTRIES = 200;

// Serialize writes so concurrent events don't overwrite each other
let writeChain = Promise.resolve();

export function logInternal(event, details = {}) {
  const entry = { at: new Date().toISOString(), event, ...details };
  if (__DEV__) console.log('[Internal]', JSON.stringify(entry));

  writeChain = writeChain
    .then(async () => {
      const raw = await AsyncStorage.getItem(LOG_KEY);
      const entries = raw ? JSON.parse(raw) : [];
      entries.push(entry);
      await AsyncStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
    })
    .catch(() => {});
}

export async function getInternalLogs() {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearInternalLogs() {
  await AsyncStorage.removeItem(LOG_KEY);
}
