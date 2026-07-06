import { useEffect, useState } from "react";

import { fetchJobs } from "../api/jobs";
import type { Job } from "../types";
import { StatusBadge } from "./StatusBadge";

import "./JobsList.css";

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchJobs()
      .then((data) => {
        if (!cancelled) setJobs(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load jobs");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="jobs-list__message">Loading jobs…</p>;
  }

  if (error) {
    return <p className="jobs-list__message jobs-list__message--error">{error}</p>;
  }

  if (jobs.length === 0) {
    return <p className="jobs-list__message">No jobs yet.</p>;
  }

  return (
    <table className="jobs-list">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <tr key={job.id}>
            <td>{job.name}</td>
            <td>
              {job.current_status ? (
                <StatusBadge status={job.current_status.status_type} />
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
