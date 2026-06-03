import { searchLocations } from '../services/geocodingService.js'

export async function geocodeLocation(req, res) {
  const query = String(req.query.q || '').trim()

  if (query.length < 2) {
    return res.status(400).json({ error: 'Enter a city or location name.' })
  }

  try {
    const results = await searchLocations(query)
    res.json({ results })
  } catch (error) {
    res.status(error.status || 502).json({
      error: error.message || 'Could not resolve that location right now.',
    })
  }
}
