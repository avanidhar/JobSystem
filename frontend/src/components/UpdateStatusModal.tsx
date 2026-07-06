import { useState } from "react";
import type { FormEvent } from "react";

import { updateJobStatus } from "../api/jobs";
import type { Job, JobStatusType } from "../types";
import { Modal } from "./Modal";

import "./UpdateStatusModal.css";

const STATUS_OPTIONS: { value: JobStatusType; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "RUNNING", label: "Running" },
  { value: "SUCCEEDED", label: "Succeeded" },
  { value: "FAILED", label: "Failed" },
];

interface UpdateStatusModalProps {
  job: Job;
  onClose: () => void;
  onUpdated: () => void;
}

export function UpdateStatusModal({ job, onClose, onUpdated }: UpdateStatusModalProps) {
  const currentStatus = job.current_status?.status_type ?? null;
  const [selectedStatus, setSelectedStatus] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedStatus) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await updateJobStatus(job.id, selectedStatus as JobStatusType);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to update job status. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Update Job Status" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <span className="update-status-modal__label">Job name</span>
        <p className="update-status-modal__job-name">{job.name}</p>

        <label className="update-status-modal__label" htmlFor="status-select">
          New status
        </label>
        <select
          id="status-select"
          className="update-status-modal__select"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
          disabled={submitting}
        >
          <option value="" disabled>
            Select a new status
          </option>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value} disabled={value === currentStatus}>
              {label}
              {value === currentStatus ? " (current)" : ""}
            </option>
          ))}
        </select>

        {submitError && <p className="update-status-modal__error">{submitError}</p>}

        <div className="update-status-modal__actions">
          <button
            type="button"
            className="update-status-modal__button update-status-modal__button--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="update-status-modal__button update-status-modal__button--primary"
            disabled={submitting || !selectedStatus}
          >
            {submitting ? "Updating…" : "Update Status"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
