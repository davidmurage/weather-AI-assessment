import { BASE_URL } from '../config'

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload.error || fallbackMessage)
  }

  return payload
}

export async function getWeather(place) {
  const params = new URLSearchParams({
    lat: place.lat,
    lon: place.lon,
    days: '7',
    ai: 'true',
    units: 'metric',
  })

  const response = await fetch(`${BASE_URL}/api/weather?${params}`)
  return parseResponse(response, 'Weather request failed.')
}

export async function getUsage() {
  const response = await fetch(`${BASE_URL}/api/usage`)
  return parseResponse(response, 'Usage request failed.')
}

export async function geocodeLocation(query) {
  const response = await fetch(`${BASE_URL}/api/geocode?q=${encodeURIComponent(query)}`)
  return parseResponse(response, 'Location search failed.')
}

export async function getWeatherByNetworkLocation() {
  const response = await fetch(`${BASE_URL}/api/weather-geo?ip=auto&days=7&ai=true`)
  return parseResponse(response, 'Auto location failed.')
}
