export type JobStatusType = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface JobStatus {
  id: number;
  status_type: JobStatusType;
  timestamp: string;
}

export interface Job {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  current_status: JobStatus | null;
}

export interface PaginatedJobs {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}
