import type { JobStatusType } from "../types";

import "./StatusBadge.css";

const STATUS_LABELS: Record<JobStatusType, string> = {
  PENDING: "Pending",
  RUNNING: "Running",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
};

export function StatusBadge({ status }: { status: JobStatusType }) {
  return (
    <span className={`status-badge status-badge--${status.toLowerCase()}`}>
      <span className="status-badge__dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
