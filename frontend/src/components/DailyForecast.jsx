import { formatPercent, formatSpeed, formatTemp } from '../utils/weather'

function DailyForecast({ daily }) {
  const items = daily?.length ? daily : Array.from({ length: 7 })

  return (
    <section className="forecast-section">
      <div className="section-heading">
        <p className="eyebrow">Next 7 Days</p>
        <h2>Daily Forecast</h2>
      </div>
      <div className="daily-grid">
        {items.map((day, index) => (
          <article className="forecast-card" key={day?.time || index}>
            <span>{day?.time ? new Date(day.time).toLocaleDateString('en', { weekday: 'short' }) : '--'}</span>
            {day?.icon ? <img className="weather-icon" src={day.icon} alt="" /> : null}
            <strong>{formatTemp(day?.high)}</strong>
            <small>{day?.low !== undefined ? `${formatTemp(day.low)} low` : 'Forecast'}</small>
            <p>{day?.condition || 'Awaiting data'}</p>
            <div className="forecast-meta">
              <small>Rain {formatPercent(day?.precipitationProbability)}</small>
              <small>Wind {formatSpeed(day?.windMax)}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DailyForecast
