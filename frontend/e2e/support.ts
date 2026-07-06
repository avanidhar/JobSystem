export const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:8000";

export function uniqueJobName(label: string): string {
  return `E2E ${label} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
