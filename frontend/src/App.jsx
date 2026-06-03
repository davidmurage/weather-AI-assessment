import { useEffect, useMemo, useState } from 'react'
import DailyForecast from './components/DailyForecast'
import HeroPanel from './components/HeroPanel'
import HourlyForecast from './components/HourlyForecast'
import OverviewCards from './components/OverviewCards'
import { DEFAULT_PLACE } from './constants/weather'
import {
  geocodeLocation,
  getUsage,
  getWeather,
  getWeatherByNetworkLocation,
} from './services/weatherApi'
import { normalizeWeather, parseCoordinateQuery } from './utils/weather'
import './App.css'

function App() {
  const [place, setPlace] = useState(DEFAULT_PLACE)
  const [query, setQuery] = useState(DEFAULT_PLACE.name)
  const [weather, setWeather] = useState(null)
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadWeather(nextPlace = place) {
    setLoading(true)
    setError('')

    try {
      const payload = await getWeather(nextPlace)
      setWeather(normalizeWeather(payload, nextPlace))
    } catch (requestError) {
      setError(requestError.message)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(event) {
    event.preventDefault()
    const trimmed = query.trim()

    if (!trimmed) {
      setError('Enter a city, place name, or coordinates.')
      return
    }

    const coordinatePlace = parseCoordinateQuery(trimmed)
    if (coordinatePlace) {
      setPlace(coordinatePlace)
      loadWeather(coordinatePlace)
      return
    }

    setLoading(true)
    setError('')

    try {
      const payload = await geocodeLocation(trimmed)

      if (!payload.results?.length) throw new Error('No matching location found.')

      const match = payload.results[0]
      const nextPlace = {
        name: match.city || match.name,
        lat: match.lat,
        lon: match.lon,
      }
      setPlace(nextPlace)
      await loadWeather(nextPlace)
    } catch (requestError) {
      setError(requestError.message)
      setWeather(null)
      setLoading(false)
    }
  }

  async function handleGeoDetect() {
    setLoading(true)
    setError('')

    try {
      const payload = await getWeatherByNetworkLocation()
      const data = payload.data || {}
      const geo = data.geo || data.location || {}
      const nextPlace = {
        name: payload.geoHeaders?.city || geo.city || 'Auto-detected location',
        lat: geo.lat || data.lat || data.latitude || place.lat,
        lon: geo.lon || data.lon || data.longitude || place.lon,
      }
      setPlace(nextPlace)
      setQuery(nextPlace.name)
      setWeather(normalizeWeather(payload, nextPlace))
    } catch (requestError) {
      setError(requestError.message)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const [weatherPayload, usagePayload] = await Promise.all([
          getWeather(DEFAULT_PLACE),
          getUsage().catch(() => null),
        ])

        setWeather(normalizeWeather(weatherPayload, DEFAULT_PLACE))
        if (usagePayload) setUsage(usagePayload.data || usagePayload)
      } catch (requestError) {
        setError(requestError.message)
        setWeather(null)
      } finally {
        setLoading(false)
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const currentDate = useMemo(
    () => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()),
    [],
  )

  const rateRemaining = weather?.rateLimit?.remaining || usage?.remaining || usage?.requests?.remaining

  return (
    <main className="app-shell">
      <HeroPanel
        loading={loading}
        place={place}
        query={query}
        weather={weather}
        onGeoDetect={handleGeoDetect}
        onQueryChange={setQuery}
        onSearch={handleSearch}
      />

      {error ? <div className="alert">{error}</div> : null}

      <OverviewCards
        currentDate={currentDate}
        place={place}
        rateRemaining={rateRemaining}
        weather={weather}
      />
      <DailyForecast daily={weather?.daily} />
      <HourlyForecast hourly={weather?.hourly} />
    </main>
  )
}

export default App
