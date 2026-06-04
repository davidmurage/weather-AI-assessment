import { env } from '../config/env.js'
import { getJson } from './httpClient.js'

export async function getFallbackForecast({ lat, lon, days = 7 }) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat)
  url.searchParams.set('longitude', lon)
  url.searchParams.set('forecast_days', days)
  url.searchParams.set('timezone', 'auto')
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'weather_code',
    'wind_speed_10m',
    'wind_gusts_10m',
  ].join(','))
  url.searchParams.set('hourly', [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'precipitation_probability',
    'weather_code',
    'wind_speed_10m',
    'wind_gusts_10m',
    'uv_index',
  ].join(','))
  url.searchParams.set('daily', [
    'weather_code',
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'sunrise',
    'sunset',
  ].join(','))

  const response = await getJson(url, {}, { timeoutMs: env.fallbackWeatherTimeoutMs })

  if (!response.ok) {
    const error = new Error(response.body.error || response.body.reason || 'Fallback weather request failed.')
    error.status = response.status
    error.body = response.body
    throw error
  }

  return mapOpenMeteoToWeatherAi(response.body, { lat, lon })
}

function mapOpenMeteoToWeatherAi(data, requestedLocation) {
  const current = data.current || {}
  const hourly = data.hourly || {}
  const daily = data.daily || {}

  return {
    data: {
      source: 'open-meteo-fallback',
      location: {
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone,
        requested_lat: requestedLocation.lat,
        requested_lon: requestedLocation.lon,
      },
      current: {
        time: current.time,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        feels_like: current.apparent_temperature,
        condition_code: current.weather_code,
        wind_speed: current.wind_speed_10m,
        wind_gust: current.wind_gusts_10m,
      },
      hourly: (hourly.time || []).map((time, index) => ({
        time,
        temperature: hourly.temperature_2m?.[index],
        humidity: hourly.relative_humidity_2m?.[index],
        feels_like: hourly.apparent_temperature?.[index],
        precipitation_probability: hourly.precipitation_probability?.[index],
        condition_code: hourly.weather_code?.[index],
        wind_speed: hourly.wind_speed_10m?.[index],
        wind_gust: hourly.wind_gusts_10m?.[index],
        uv_index: hourly.uv_index?.[index],
      })),
      daily: (daily.time || []).map((date, index) => ({
        date,
        temp_min: daily.temperature_2m_min?.[index],
        temp_max: daily.temperature_2m_max?.[index],
        precipitation_sum: daily.precipitation_sum?.[index],
        precipitation_probability: daily.precipitation_probability_max?.[index],
        condition_code: daily.weather_code?.[index],
        wind_max: daily.wind_speed_10m_max?.[index],
        sunrise: daily.sunrise?.[index],
        sunset: daily.sunset?.[index],
      })),
    },
    fallback: {
      source: 'open-meteo',
      reason: 'Weather-AI was unavailable for this request, so compatible fallback weather data was returned.',
    },
  }
}
