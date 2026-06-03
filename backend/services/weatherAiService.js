import { env } from '../config/env.js'

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

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.weatherApiKey}`,
      Accept: 'application/json',
    },
  })
  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = body.error || body.message || `Weather-AI returned ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.body = body
    throw error
  }

  return {
    data: body,
    rateLimit: getRateLimitHeaders(response.headers),
    geoHeaders: {
      city: response.headers.get('x-city'),
      region: response.headers.get('x-region'),
      country: response.headers.get('x-country'),
    },
  }
}
