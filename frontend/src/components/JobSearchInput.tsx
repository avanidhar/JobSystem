import "./JobSearchInput.css";

interface JobSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobSearchInput({ value, onChange }: JobSearchInputProps) {
  return (
    <input
      type="text"
      className="job-search-input"
      placeholder="Search by name or /regex/…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Search jobs by name or regex"
    />
  );
}
