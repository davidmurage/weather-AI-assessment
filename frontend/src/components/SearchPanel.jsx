function SearchPanel({ loading, query, onGeoDetect, onQueryChange, onSearch }) {
  return (
    <form className="search-panel" onSubmit={onSearch}>
      <label htmlFor="location">Location</label>
      <div className="search-row">
        <input
          id="location"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nairobi or -1.2921, 36.8219"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading' : 'Search'}
        </button>
      </div>
      <button className="secondary-button" type="button" onClick={onGeoDetect} disabled={loading}>
        Use my network location
      </button>
    </form>
  )
}

export default SearchPanel
