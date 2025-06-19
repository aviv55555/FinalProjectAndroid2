import React from "react";

export default function AdvancedSearch({
  open,
  onToggle,
  searchByUserName,
  setSearchByUserName,
  searchByPostText,
  setSearchByPostText,
  searchDateFrom,
  setSearchDateFrom,
  searchDateTo,
  setSearchDateTo,
}) {
  if (!open) {
    return (
      <h5
        className="mb-3 fw-semibold"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={onToggle}
      >
        Advanced Search ▼
      </h5>
    );
  }

  return (
    <div className="mb-4 p-3 shadow rounded bg-white">
      <h5
        className="mb-3 fw-semibold"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={onToggle}
      >
        Advanced Search ▲
      </h5>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search by user name (first or last)"
        value={searchByUserName}
        onChange={(e) => setSearchByUserName(e.target.value)}
      />
      <div className="d-flex gap-2 mb-3">
        <input
          type="date"
          className="form-control"
          placeholder="Date from"
          value={searchDateFrom}
          onChange={(e) => setSearchDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          placeholder="Date to"
          value={searchDateTo}
          onChange={(e) => setSearchDateTo(e.target.value)}
        />
      </div>
      <input
        type="text"
        className="form-control"
        placeholder="Keyword in title or content"
        value={searchByPostText}
        onChange={(e) => setSearchByPostText(e.target.value)}
      />
    </div>
  );
}
