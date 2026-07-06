import { useCallback, useEffect, useState } from "react";

import { fetchJobs } from "../api/jobs";
import type { Job } from "../types";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { CreateJobModal } from "./CreateJobModal";
import { DeleteJobConfirmModal } from "./DeleteJobConfirmModal";
import { JobSearchInput } from "./JobSearchInput";
import { JobsList } from "./JobsList";
import { Pagination } from "./Pagination";
import { UpdateStatusModal } from "./UpdateStatusModal";

import "./JobsPage.css";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

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

  // The input stays instantaneous (plain local state); the actual fetch
  // only fires once typing settles, so the server isn't hit on every
  // keystroke.
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const loadJobs = useCallback(
    async (targetPage: number, targetPageSize: number, targetSearch: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJobs(targetPage, targetPageSize, targetSearch);
        setJobs(data.results);
        setTotalCount(data.count);
        setPage(targetPage);
        setPageSize(targetPageSize);
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "";
        // A malformed regex is a user-actionable message worth showing
        // as-is; anything else stays a generic friendly failure message.
        setError(
          message.startsWith("Invalid search pattern")
            ? message
            : "Failed to load jobs. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Runs on mount (debouncedSearch starts at "") and whenever the settled
  // search term changes; always resets to page 1 since the result set
  // composition changes with the filter.
  useEffect(() => {
    loadJobs(1, pageSize, debouncedSearch);
    // pageSize is intentionally omitted: its own changes are handled by
    // handlePageSizeChange directly, this effect only reacts to search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleJobCreated = () => {
    // New jobs always sort to the top (created_at desc), so jump to page 1
    // to show it rather than leaving the user wondering if it worked.
    loadJobs(1, pageSize, debouncedSearch);
  };

  const handleJobUpdated = () => {
    // Status changes don't affect ordering or count, so the job stays put.
    loadJobs(page, pageSize, debouncedSearch);
  };

  const handleJobDeleted = () => {
    // Deleting can shrink the total page count out from under the current
    // page (e.g. removing the last item on the last page) — the server
    // would 404 an out-of-range page rather than returning an empty one, so
    // clamp client-side using the count we already know instead of guessing.
    const newTotalCount = Math.max(0, totalCount - 1);
    const newTotalPages = Math.max(1, Math.ceil(newTotalCount / pageSize));
    const adjustedPage = Math.min(page, newTotalPages);
    loadJobs(adjustedPage, pageSize, debouncedSearch);
  };

  const handlePageChange = (nextPage: number) => {
    loadJobs(nextPage, pageSize, debouncedSearch);
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    loadJobs(1, nextPageSize, debouncedSearch);
  };

  return (
    <div className="jobs-page">
      <div className="jobs-page__toolbar">
        <JobSearchInput value={searchInput} onChange={setSearchInput} />
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
        isSearchActive={debouncedSearch.trim().length > 0}
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
