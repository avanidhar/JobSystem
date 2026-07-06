import type { Job } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs (${response.status})`);
  }
  return response.json();
}
