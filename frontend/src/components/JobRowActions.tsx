import { useEffect, useRef, useState } from "react";

import "./JobRowActions.css";

interface JobRowActionsProps {
  onUpdate: () => void;
  onDelete: () => void;
}

export function JobRowActions({ onUpdate, onDelete }: JobRowActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="job-row-actions" ref={containerRef}>
      <button
        type="button"
        className="job-row-actions__trigger"
        aria-label="Job actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        ⋯
      </button>
      {isOpen && (
        <div className="job-row-actions__menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="job-row-actions__item"
            onClick={() => {
              setIsOpen(false);
              onUpdate();
            }}
          >
            Update
          </button>
          <button
            type="button"
            role="menuitem"
            className="job-row-actions__item job-row-actions__item--destructive"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
