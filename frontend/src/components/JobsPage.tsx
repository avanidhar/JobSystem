import { useCallback, useEffect, useState } from "react";

import { fetchJobs } from "../api/jobs";
import type { Job } from "../types";
import { CreateJobModal } from "./CreateJobModal";
import { DeleteJobConfirmModal } from "./DeleteJobConfirmModal";
import { JobsList } from "./JobsList";
import { Pagination } from "./Pagination";
import { UpdateStatusModal } from "./UpdateStatusModal";

import "./JobsPage.css";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [jobPendingUpdate, setJobPendingUpdate] = useState<Job | null>(null);
  const [jobPendingDelete, setJobPendingDelete] = useState<Job | null>(null);

  const loadJobs = useCallback(async (targetPage: number, targetPageSize: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs(targetPage, targetPageSize);
      setJobs(data.results);
      setTotalCount(data.count);
      setPage(targetPage);
      setPageSize(targetPageSize);
    } catch (err) {
      console.error(err);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs(1, DEFAULT_PAGE_SIZE);
  }, [loadJobs]);

  const handleJobCreated = () => {
    // New jobs always sort to the top (created_at desc), so jump to page 1
    // to show it rather than leaving the user wondering if it worked.
    loadJobs(1, pageSize);
  };

  const handleJobUpdated = () => {
    // Status changes don't affect ordering or count, so the job stays put.
    loadJobs(page, pageSize);
  };

  const handleJobDeleted = () => {
    // Deleting can shrink the total page count out from under the current
    // page (e.g. removing the last item on the last page) — the server
    // would 404 an out-of-range page rather than returning an empty one, so
    // clamp client-side using the count we already know instead of guessing.
    const newTotalCount = Math.max(0, totalCount - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotalCount / pageSize));
    const adjustedPage = Math.min(page, newTotalPages);
    loadJobs(adjustedPage, pageSize);
  };

  const handlePageChange = (nextPage: number) => {
    loadJobs(nextPage, pageSize);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    loadJobs(1, nextPageSize);
  };

  return (
    <div className="jobs-page">
      <div className="jobs-page__toolbar">
        <button
          type="button"
          className="jobs-page__create-button"
          onClick={() => setCreateModalOpen(true)}
        >
          Create Job
        </button>
      </div>

      <JobsList
        jobs={jobs}
        loading={loading}
        error={error}
        onRequestUpdate={setJobPendingUpdate}
        onRequestDelete={setJobPendingDelete}
      />

      {!loading && !error && totalCount > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {isCreateModalOpen && (
        <CreateJobModal
          onClose={() => setCreateModalOpen(false)}
          onCreated={handleJobCreated}
        />
      )}

      {jobPendingUpdate && (
        <UpdateStatusModal
          job={jobPendingUpdate}
          onClose={() => setJobPendingUpdate(null)}
          onUpdated={handleJobUpdated}
        />
      )}

      {jobPendingDelete && (
        <DeleteJobConfirmModal
          job={jobPendingDelete}
          onClose={() => setJobPendingDelete(null)}
          onDeleted={handleJobDeleted}
        />
      )}
    </div>
  );
}
