import type { Job, JobStatusType, PaginatedJobs } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchJobs(page: number, pageSize: number): Promise<PaginatedJobs> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const response = await fetch(`${API_BASE_URL}/api/jobs/?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs (${response.status})`);
  }
  return response.json();
}

export async function createJob(name: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create job (${response.status})`);
  }
  return response.json();
}

export async function updateJobStatus(
  id: number,
  statusType: JobStatusType,
): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status_type: statusType }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update job status (${response.status})`);
  }
  return response.json();
}

export async function deleteJob(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete job (${response.status})`);
  }
}
