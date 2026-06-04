import { formatPercent, formatSpeed, formatTemp } from '../utils/weather'

function OverviewCards({ currentDate, place, rateRemaining, weather }) {
  const sourceLabel =
    weather?.raw?.source === 'open-meteo-fallback' ? 'Live fallback provider' : 'Weather-AI'

  return (
    <section className="overview-grid" aria-live="polite">
      <article className="current-card">
        <div>
          <p className="eyebrow">{currentDate}</p>
          {weather?.current.icon ? (
            <img className="weather-icon large-icon" src={weather.current.icon} alt="" />
          ) : null}
          <h2>{formatTemp(weather?.current.temperature)}</h2>
          <p>{weather?.current.condition || 'Waiting for forecast'}</p>
        </div>
        <dl>
          <div>
            <dt>Humidity</dt>
            <dd>{formatPercent(weather?.current.humidity)}</dd>
          </div>
          <div>
            <dt>Wind</dt>
            <dd>{formatSpeed(weather?.current.wind)}</dd>
          </div>
          <div>
            <dt>Feels like</dt>
            <dd>{formatTemp(weather?.current.feelsLike)}</dd>
          </div>
          <div>
            <dt>UV index</dt>
            <dd>{weather?.current.uvIndex ?? '--'}</dd>
          </div>
          <div>
            <dt>Wind gust</dt>
            <dd>{formatSpeed(weather?.current.windGust)}</dd>
          </div>
          <div>
            <dt>Rain chance</dt>
            <dd>{formatPercent(weather?.current.precipitationProbability)}</dd>
          </div>
          <div>
            <dt>Coordinates</dt>
            <dd>
              {weather?.coordinates.lat ?? place.lat}, {weather?.coordinates.lon ?? place.lon}
            </dd>
          </div>
          <div>
            <dt>API quota</dt>
            <dd>{rateRemaining ? `${rateRemaining} left` : 'Connected'}</dd>
          </div>
          <div>
            <dt>Data source</dt>
            <dd>{sourceLabel}</dd>
          </div>
        </dl>
      </article>

      <article className="ai-card">
        <p className="eyebrow">AI Summary</p>
        <p>
          {weather?.summary ||
            'Live forecast data is requested from Weather-AI. When an AI summary is not returned, the app generates a readable local summary.'}
        </p>
      </article>
    </section>
  )
}

export default OverviewCards
