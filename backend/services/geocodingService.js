export async function searchLocations(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Weather-AI Smart Forecast Dashboard/1.0',
    },
  })
  const results = await response.json()

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
