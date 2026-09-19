/**
 * Runtime-only MiniMax API key access (BYOK — bring your own key).
 *
 * SECURITY (Domain Lead redaction fix, 2026-09-19): API keys must never be
 * hardcoded in browser-reachable source. The previous code shipped
 * `apiKey: 'demo-key'` inside src/App.tsx and sent it as a Bearer token from
 * the browser (src/ai/minimax.ts callAPI). While this product is dormant the
 * AI path is feature-gated OFF: with no runtime-supplied key, no provider is
 * constructed and ZERO network calls are made to the MiniMax API.
 *
 * The key is read at RUNTIME from user-supplied browser storage. It is
 * deliberately NOT read from `import.meta.env.VITE_*`: Vite bakes those into
 * the shipped browser bundle, which is the same exposure in a different
 * place. A shared key can only ever be safe behind a server-side proxy; this
 * static SPA has none, so the only supported modes are BYOK or AI-off.
 */
const STORAGE_KEY = 'f2s:minimax-api-key';

export { STORAGE_KEY };

export function getMinimaxApiKey(): string | null {
  try {
    const key = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (typeof key !== 'string') return null;
    const trimmed = key.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    // Storage unavailable (private mode, non-browser context): AI stays off.
    return null;
  }
}
