import { env } from '../config/env.js'

export function getHealth(_req, res) {
  res.json({
    ok: true,
    service: 'weather-ai-dashboard-backend',
    config: {
      hasWeatherApiKey: Boolean(env.weatherApiKey),
      weatherBaseUrl: env.weatherBaseUrl,
      frontendOrigins: env.frontendOrigins,
    },
  })
}
