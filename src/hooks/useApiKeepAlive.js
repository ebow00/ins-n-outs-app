import { useEffect } from 'react';

import { pingCaloriesApi } from '../utils/caloriesApi';
import { logInternal } from '../utils/internalLog';

// Generous on purpose: absorbing the slow cold start is the point of the ping
const PING_TIMEOUT_MS = 60000;

// Module-level so remounts (e.g. Fast Refresh) don't ping again within the same launch
let pinged = false;

// Pings the API route once per launch so the user's first real request doesn't hit a cold start.
// The ping doesn't send a chat completion, so it costs none of OpenRouter's free-model daily requests.
export function useApiKeepAlive() {
  useEffect(() => {
    if (pinged) return;
    pinged = true;

    const startedAt = Date.now();
    pingCaloriesApi({ timeoutMs: PING_TIMEOUT_MS }).then((result) => {
      const durationMs = Date.now() - startedAt;
      if (result.kind !== 'ok') {
        logInternal(`keepalive_${result.kind}`, { durationMs, status: result.status, message: result.message });
        return;
      }
      const { isFreeTier, usage, limitRemaining } = result.data;
      logInternal('keepalive_ok', { durationMs, isFreeTier, usage, limitRemaining });
    });
  }, []);
}
