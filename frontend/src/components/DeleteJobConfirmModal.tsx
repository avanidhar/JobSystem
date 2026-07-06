import { useState } from "react";

import { deleteJob } from "../api/jobs";
import type { Job } from "../types";
import { Modal } from "./Modal";

import "./DeleteJobConfirmModal.css";

interface DeleteJobConfirmModalProps {
  job: Job;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteJobConfirmModal({
  job,
  onClose,
  onDeleted,
}: DeleteJobConfirmModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await deleteJob(job.id);
      onDeleted();
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to delete job. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Delete Job" onClose={onClose}>
      <p className="delete-job-modal__message">
        Are you sure you want to delete <strong>{job.name}</strong>? This will
        also delete its full status history. This cannot be undone.
      </p>

      {submitError && <p className="delete-job-modal__error">{submitError}</p>}

      <div className="delete-job-modal__actions">
        <button
          type="button"
          className="delete-job-modal__button delete-job-modal__button--secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="delete-job-modal__button delete-job-modal__button--danger"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Deleting…" : "Delete Job"}
        </button>
      </div>
    </Modal>
  );
}
