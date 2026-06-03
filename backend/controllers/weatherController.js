import { callWeatherAi } from '../services/weatherAiService.js'
import { toFloat } from '../utils/number.js'

export async function getForecast(req, res) {
  const lat = toFloat(req.query.lat)
  const lon = toFloat(req.query.lon)

  if (lat === null || lon === null) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' })
  }

  try {
    const result = await callWeatherAi('/v1/forecast', {
      lat,
      lon,
      days: req.query.days || 7,
      ai: req.query.ai ?? 'true',
      units: req.query.units || 'metric',
      lang: req.query.lang || 'en',
    })

    res.json(result)
  } catch (error) {
    res.status(error.status || 502).json({
      error: error.message || 'Weather-AI request failed.',
      details: error.body,
    })
  }
}

export async function getGeoForecast(req, res) {
  try {
    const result = await callWeatherAi('/v1/weather-geo', {
      ip: req.query.ip || 'auto',
      days: req.query.days || 7,
      ai: req.query.ai ?? 'true',
    })

    res.json(result)
  } catch (error) {
    res.status(error.status || 502).json({
      error: error.message || 'Weather-AI geo request failed.',
      details: error.body,
    })
  }
}

export async function getUsage(req, res) {
  try {
    const result = await callWeatherAi('/v1/usage')
    res.json(result)
  } catch (error) {
    res.status(error.status || 502).json({
      error: error.message || 'Weather-AI usage request failed.',
      details: error.body,
    })
  }
}
