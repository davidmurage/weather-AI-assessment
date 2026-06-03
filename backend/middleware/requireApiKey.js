import { env } from '../config/env.js'

export function requireApiKey(_req, res, next) {
  if (!env.weatherApiKey) {
    return res.status(500).json({
      error: 'WEATHER_AI_API_KEY is not configured on the backend.',
    })
  }

  next()
}
