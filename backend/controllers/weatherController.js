import { callWeatherAi } from '../services/weatherAiService.js'
import { getFallbackForecast, getSampleForecast } from '../services/fallbackWeatherService.js'
import { toFloat } from '../utils/number.js'

export async function getForecast(req, res) {
  const lat = toFloat(req.query.lat)
  const lon = toFloat(req.query.lon)

  if (lat === null || lon === null) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' })
  }

  try {
    const params = {
      lat,
      lon,
      days: req.query.days || 7,
      ai: req.query.ai ?? 'true',
      units: req.query.units || 'metric',
      lang: req.query.lang || 'en',
    }
    const result = await callWeatherAiWithAiFallback('/v1/weather', params)

    res.json(result)
  } catch (error) {
    if (shouldUseWeatherFallback(error)) {
      try {
        const fallbackResult = await getFallbackForecast({
          lat,
          lon,
          days: req.query.days || 7,
        })

        res.json({
          ...fallbackResult,
          weatherAiError: {
            error: error.message || 'Weather-AI request failed.',
            details: error.body,
          },
        })
        return
      } catch (fallbackError) {
        res.json({
          ...getSampleForecast({ lat, lon, days: req.query.days || 7 }),
          weatherAiError: {
            error: error.message || 'Weather-AI request failed.',
            details: error.body,
          },
          fallbackProviderError: {
            error: fallbackError.message || 'Fallback weather request failed.',
            details: fallbackError.body,
          },
        })
        return
      }
    }

    res.status(getProxyStatus(error)).json({
      error: error.message || 'Weather-AI request failed.',
      details: error.body,
    })
  }
}

async function callWeatherAiWithAiFallback(path, params) {
  try {
    return await callWeatherAi(path, params)
  } catch (error) {
    if (params.ai === 'true' && Number(error.status) >= 500) {
      const fallbackResult = await callWeatherAi(path, { ...params, ai: 'false' })
      return {
        ...fallbackResult,
        fallback: {
          aiDisabled: true,
          reason: 'Weather-AI returned a server error for the AI-enabled request.',
        },
      }
    }

    throw error
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
    res.status(getProxyStatus(error)).json({
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
    res.status(getProxyStatus(error)).json({
      error: error.message || 'Weather-AI usage request failed.',
      details: error.body,
    })
  }
}

function getProxyStatus(error) {
  const status = Number(error.status)

  if (!Number.isFinite(status)) return 502
  if (status >= 500) return 502

  return status
}

function shouldUseWeatherFallback(error) {
  const status = Number(error.status)

  return !Number.isFinite(status) || status >= 500
}
