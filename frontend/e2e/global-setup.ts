async function waitForUrl(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
  const apiBaseURL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:8000";

  // docker compose starts frontend/backend without waiting for them to be
  // ready to accept requests, so give both a moment to actually come up
  // before any test navigates to them.
  await waitForUrl(baseURL, 30_000);
  await waitForUrl(`${apiBaseURL}/api/health/`, 30_000);
}
