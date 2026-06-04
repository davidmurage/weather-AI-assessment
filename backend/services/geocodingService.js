import { env } from '../config/env.js'

export async function searchLocations(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), env.geocodingTimeoutMs)

  let response
  let results

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Weather-AI Smart Forecast Dashboard/1.0',
      },
    })
    results = await response.json()
  } catch (error) {
    const geocodeError = new Error('Location search timed out. Try coordinates or a more specific city name.')
    geocodeError.status = 504
    throw geocodeError
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const error = new Error('Geocoding service is unavailable.')
    error.status = response.status
    throw error
  }

  return results.map((item) => ({
    name: item.display_name,
    lat: Number(item.lat),
    lon: Number(item.lon),
    country: item.address?.country,
    city: item.address?.city || item.address?.town || item.address?.village || item.address?.county,
  }))
}
