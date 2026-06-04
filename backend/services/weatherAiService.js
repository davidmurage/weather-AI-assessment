import { env } from '../config/env.js'
import { getJson } from './httpClient.js'

function getRateLimitHeaders(headers) {
  return {
    limit: headers.get('x-ratelimit-limit'),
    remaining: headers.get('x-ratelimit-remaining'),
    reset: headers.get('x-ratelimit-reset'),
  }
}

export async function callWeatherAi(path, params = {}) {
  const url = new URL(path, env.weatherBaseUrl)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  try {
    const response = await getJson(
      url,
      {
        Authorization: `Bearer ${env.weatherApiKey}`,
        Accept: 'application/json',
      },
      { timeoutMs: env.weatherAiTimeoutMs },
    )

    if (!response.ok) {
      const message = response.body.error || response.body.message || `Weather-AI returned ${response.status}`
      const error = new Error(message)
      error.status = response.status
      error.body = response.body
      throw error
    }

    return {
      data: response.body,
      rateLimit: getRateLimitHeaders(response.headers),
      geoHeaders: {
        city: response.headers.get('x-city'),
        region: response.headers.get('x-region'),
        country: response.headers.get('x-country'),
      },
    }
  } catch (requestError) {
    const error = new Error(requestError.message || 'Weather-AI network request failed.')
    error.status = requestError.status || 502
    error.body = {
      cause: requestError.cause?.message,
      code: requestError.code || requestError.cause?.code,
      url: url.origin,
    }
    throw error
  }
}
