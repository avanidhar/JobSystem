import type { Job } from "../types";
import { formatDateTime } from "../utils/formatDate";
import { JobRowActions } from "./JobRowActions";
import { StatusBadge } from "./StatusBadge";

import "./JobsList.css";

interface JobsListProps {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  isSearchActive: boolean;
  onRequestUpdate: (job: Job) => void;
  onRequestDelete: (job: Job) => void;
}

export function JobsList({
  jobs,
  loading,
  error,
  isSearchActive,
  onRequestUpdate,
  onRequestDelete,
}: JobsListProps) {
  if (loading) {
    return <p className="jobs-list__message">Loading jobs…</p>;
  }

  if (error) {
    return <p className="jobs-list__message jobs-list__message--error">{error}</p>;
  }

  if (jobs.length === 0) {
    return (
      <p className="jobs-list__message">
        {isSearchActive ? "No jobs match your search." : "No jobs yet."}
      </p>
    );
  }

  return (
    <table className="jobs-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Created At</th>
          <th>Status</th>
          <th className="jobs-list__actions-header" aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <td>{job.name}</td>
            <td className="jobs-list__created-at">{formatDateTime(job.created_at)}</td>
            <td>
              {job.current_status ? (
                <StatusBadge status={job.current_status.status_type} />
              ) : (
                "—"
              )}
            </td>
            <td className="jobs-list__actions-cell">
              <JobRowActions
                onUpdate={() => onRequestUpdate(job)}
                onDelete={() => onRequestDelete(job)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
