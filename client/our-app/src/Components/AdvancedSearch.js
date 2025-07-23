import React from "react";
import "./AdvancedSearch.css"; 

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
      <h5 className="advanced-search-toggle" onClick={onToggle}>
        Advanced Search ▼
      </h5>
    );
  }

  return (
    <div className="advanced-search-container">
      <h5 className="advanced-search-toggle" onClick={onToggle}>
        Advanced Search ▲
      </h5>

      <input
        type="text"
        className="form-control advanced-search-input"
        placeholder="Search by user name (first or last)"
        value={searchByUserName}
        onChange={(e) => setSearchByUserName(e.target.value)}
      />

      <div className="advanced-search-dates">
        <input
          type="date"
          className="form-control"
          value={searchDateFrom}
          onChange={(e) => setSearchDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="form-control"
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
