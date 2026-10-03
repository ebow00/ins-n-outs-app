import { useEffect } from 'react';
import { AppState } from 'react-native';

import { requestCalories } from '../utils/caloriesApi';
import { logInternal } from '../utils/internalLog';

const KEEP_ALIVE_INTERVAL_MS = 60 * 60 * 1000;
// Generous on purpose: absorbing the slow cold start is the point of the probes
const PROBE_TIMEOUT_MS = 60000;

const PROBES = [
  { label: 'en-valid', foodText: '2 eggs and a slice of whole wheat bread', expectInvalid: false },
  { label: 'en-invalid', foodText: 'a plastic chair', expectInvalid: true },
  { label: 'he-valid', foodText: 'שתי ביצים ופרוסת לחם מלא', expectInvalid: false },
  { label: 'he-invalid', foodText: 'כיסא פלסטיק', expectInvalid: true },
];

async function runProbe({ label, foodText, expectInvalid }, signal) {
  const startedAt = Date.now();
  const result = await requestCalories(foodText, { timeoutMs: PROBE_TIMEOUT_MS, signal });
  const durationMs = Date.now() - startedAt;

  if (result.kind === 'aborted') return;
  if (result.kind !== 'ok') {
    logInternal(`keepalive_${result.kind}`, { probe: label, durationMs, status: result.status, message: result.message });
    return;
  }

  const gotInvalid = result.data.invalid === true;
  logInternal(gotInvalid === expectInvalid ? 'keepalive_ok' : 'keepalive_unexpected', {
    probe: label,
    durationMs,
    expectInvalid,
    gotInvalid,
    ingredientCount: result.data.ingredients?.length ?? 0
  });
}

// Warms the API route and model on launch, then hourly, so the user's first real request doesn't time out
export function useApiKeepAlive() {
  useEffect(() => {
    let lastRunAt = 0;
    let controller = null;

    const runIfStale = () => {
      if (Date.now() - lastRunAt < KEEP_ALIVE_INTERVAL_MS) return;
      lastRunAt = Date.now();
      controller?.abort();
      controller = new AbortController();
      PROBES.forEach((probe) => runProbe(probe, controller.signal));
    };

    runIfStale();
    const interval = setInterval(runIfStale, KEEP_ALIVE_INTERVAL_MS);
    // Timers are paused while backgrounded, so catch up on returning to the app
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runIfStale();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
      controller?.abort();
    };
  }, []);
}
