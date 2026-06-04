import { callWeatherAi } from '../services/weatherAiService.js'
import { getFallbackForecast } from '../services/fallbackWeatherService.js'
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
      ai: req.query.ai ?? 'false',
      units: req.query.units || 'metric',
      lang: req.query.lang || 'en',
    }
    const result = await callWeatherAiWithAiFallback('/v1/forecast', params)

    res.json(result)
  } catch (error) {
    if (shouldUseWeatherFallback(error)) {
      try {
        const weatherAiGranularResult = await callWeatherAiGranularFallback({
          lat,
          lon,
          days: req.query.days || 7,
          units: req.query.units || 'metric',
          lang: req.query.lang || 'en',
        })

        res.json({
          ...weatherAiGranularResult,
          fallback: {
            source: 'weather-ai-granular',
            reason: 'Weather-AI /v1/forecast failed, so /v1/current, /v1/daily, and /v1/hourly were used.',
          },
          weatherAiError: {
            error: error.message || 'Weather-AI /v1/forecast request failed.',
            details: error.body,
          },
        })
        return
      } catch (granularError) {
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
          res.status(502).json({
            error: 'Live weather data is currently unavailable. Please try again shortly.',
            details: {
              weatherAi: error.body || error.message,
              weatherAiGranular: granularError.body || granularError.message,
              fallbackProvider: fallbackError.body || fallbackError.message,
            },
          })
          return
        }
      }
    }

    res.status(getProxyStatus(error)).json({
      error: error.message || 'Weather-AI request failed.',
      details: error.body,
    })
  }
}

async function callWeatherAiGranularFallback(params) {
  const hours = String((Number(params.days) || 7) * 24)
  const [currentResult, dailyResult, hourlyResult] = await Promise.allSettled([
    callWeatherAi('/v1/current', {
      lat: params.lat,
      lon: params.lon,
      units: params.units,
      lang: params.lang,
    }),
    callWeatherAi('/v1/daily', params),
    callWeatherAi('/v1/hourly', { ...params, hours }),
  ])
  const current = unwrapSettledResult(currentResult)
  const daily = unwrapSettledResult(dailyResult)
  const hourly = unwrapSettledResult(hourlyResult)

  if (!current && !daily && !hourly) {
    const error = new Error('Weather-AI granular endpoints failed.')
    error.status = 502
    error.body = {
      current: currentResult.reason?.body || currentResult.reason?.message,
      daily: dailyResult.reason?.body || dailyResult.reason?.message,
      hourly: hourlyResult.reason?.body || hourlyResult.reason?.message,
    }
    throw error
  }

  return {
    data: {
      source: 'weather-ai-granular',
      location: current?.data?.location || daily?.data?.location || hourly?.data?.location,
      current: extractWeatherData(current?.data, 'current'),
      daily: extractWeatherData(daily?.data, 'daily'),
      hourly: extractWeatherData(hourly?.data, 'hourly'),
    },
    rateLimit: current?.rateLimit || daily?.rateLimit || hourly?.rateLimit,
    geoHeaders: current?.geoHeaders || daily?.geoHeaders || hourly?.geoHeaders,
  }
}

function unwrapSettledResult(result) {
  return result.status === 'fulfilled' ? result.value : null
}

function extractWeatherData(data, key) {
  if (!data) return key === 'current' ? {} : []
  if (data[key]) return data[key]
  if (data.weather?.[key]) return data.weather[key]
  if (data.forecast?.[key]) return data.forecast[key]

  return data
}

async function callWeatherAiWithAiFallback(path, params) {
  try {
    return await callWeatherAi(path, params)
  } catch (error) {
    if (params.ai === 'true' && Number(error.status) >= 500 && !error.body?.code) {
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
