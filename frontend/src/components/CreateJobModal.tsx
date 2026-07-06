import { useState } from "react";
import type { FormEvent } from "react";

import { createJob } from "../api/jobs";
import { Modal } from "./Modal";

import "./CreateJobModal.css";

interface CreateJobModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateJobModal({ onClose, onCreated }: CreateJobModalProps) {
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError("Job name is required.");
      return;
    }

    setValidationError(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      await createJob(trimmedName);
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to create job. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Create Job" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <label className="create-job-modal__label" htmlFor="job-name">
          Job name
        </label>
        <input
          id="job-name"
          className="create-job-modal__input"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (validationError) setValidationError(null);
          }}
          autoFocus
          disabled={submitting}
        />
        {validationError && (
          <p className="create-job-modal__error">{validationError}</p>
        )}
        {submitError && <p className="create-job-modal__error">{submitError}</p>}

        <div className="create-job-modal__actions">
          <button
            type="button"
            className="create-job-modal__button create-job-modal__button--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="create-job-modal__button create-job-modal__button--primary"
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create Job"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
