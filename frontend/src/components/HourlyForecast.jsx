import { formatPercent, formatTemp } from '../utils/weather'

function HourlyForecast({ hourly }) {
  const items = hourly?.length ? hourly : Array.from({ length: 8 })

  return (
    <section className="forecast-section">
      <div className="section-heading">
        <p className="eyebrow">Next Hours</p>
        <h2>Hourly Forecast</h2>
      </div>
      <div className="hourly-strip">
        {items.map((hour, index) => (
          <article className="hour-card" key={hour?.time || index}>
            <span>{hour?.time ? new Date(hour.time).toLocaleTimeString('en', { hour: '2-digit' }) : '--'}</span>
            {hour?.icon ? <img className="weather-icon" src={hour.icon} alt="" /> : null}
            <strong>{formatTemp(hour?.temp)}</strong>
            <small>{hour?.condition || 'Forecast'}</small>
            <div className="forecast-meta">
              <small>Rain {formatPercent(hour?.precipitationProbability)}</small>
              <small>Hum {formatPercent(hour?.humidity)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HourlyForecast
