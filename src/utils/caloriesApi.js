// Shared by the calorie form and the launch ping.
// Resolves to { kind, status?, data?, message? } and never throws, where kind is:
//   'ok'      - server answered 2xx; data holds the parsed body
//   'server'  - server answered with an error status or error body (status 429 = AI daily limit, with resetAt)
//   'timeout' - no answer within timeoutMs
//   'network' - the server couldn't be reached
//   'aborted' - cancelled by the caller's signal
export async function requestCalories(foodText, { timeoutMs, signal }) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const response = await fetch('/api/calories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodText }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      return { kind: 'server', status: response.status, message: data.error, resetAt: data.resetAt ?? null };
    }
    return { kind: 'ok', status: response.status, data };
  } catch (err) {
    if (timedOut) return { kind: 'timeout' };
    if (err.name === 'AbortError') return { kind: 'aborted' };
    return { kind: 'network', message: err.message || String(err) };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}

// Launch ping: GET on the same route, which costs no OpenRouter free-model requests.
// Resolves to the same { kind, ... } shapes as requestCalories.
export async function pingCaloriesApi({ timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

  try {
    const response = await fetch('/api/calories', { signal: controller.signal });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      return { kind: 'server', status: response.status, message: data.error };
    }
    return { kind: 'ok', status: response.status, data };
  } catch (err) {
    if (timedOut) return { kind: 'timeout' };
    return { kind: 'network', message: err.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
}
