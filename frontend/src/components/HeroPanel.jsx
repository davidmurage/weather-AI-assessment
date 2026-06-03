import SearchPanel from './SearchPanel'

function HeroPanel({ loading, place, query, weather, onGeoDetect, onQueryChange, onSearch }) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Weather-AI Smart Forecast Dashboard</p>
        <h1>{weather?.locationName || place.name}</h1>
        <p className="hero-summary">
          {weather?.summary ||
            'Search a location to view current conditions, daily forecasts, hourly trends, and AI-generated weather guidance.'}
        </p>
      </div>

      <SearchPanel
        loading={loading}
        query={query}
        onGeoDetect={onGeoDetect}
        onQueryChange={onQueryChange}
        onSearch={onSearch}
      />
    </section>
  )
}

export default HeroPanel
