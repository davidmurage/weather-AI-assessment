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

  const response = await getJson(url)

  if (!response.ok) {
    const error = new Error(response.body.error || response.body.reason || 'Fallback weather request failed.')
    error.status = response.status
    error.body = response.body
    throw error
  }

  return mapOpenMeteoToWeatherAi(response.body, { lat, lon })
}

export function getSampleForecast({ lat, lon, days = 7 }) {
  const today = new Date()
  const daily = Array.from({ length: Number(days) || 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)

    return {
      date: date.toISOString().slice(0, 10),
      temp_min: 15 + (index % 3),
      temp_max: 24 + (index % 4),
      precipitation_sum: index % 2 ? 1.2 : 3.4,
      precipitation_probability: index % 2 ? 42 : 68,
      condition_code: index % 2 ? 51 : 3,
      wind_max: 10 + index,
    }
  })
  const hourly = Array.from({ length: 24 }).map((_, index) => {
    const time = new Date(today)
    time.setHours(today.getHours() + index, 0, 0, 0)

    return {
      time: time.toISOString(),
      temperature: 16 + (index % 9),
      humidity: 82 - (index % 25),
      feels_like: 17 + (index % 8),
      precipitation_probability: 35 + (index % 45),
      condition_code: index % 3 ? 3 : 51,
      wind_speed: 5 + (index % 8),
      wind_gust: 12 + (index % 16),
      uv_index: index > 6 && index < 18 ? 3 + (index % 5) : 0,
    }
  })

  return {
    data: {
      source: 'sample-fallback',
      location: {
        lat,
        lon,
        requested_lat: lat,
        requested_lon: lon,
        timezone: 'Africa/Nairobi',
      },
      current: {
        time: hourly[0].time,
        temperature: hourly[0].temperature,
        humidity: hourly[0].humidity,
        feels_like: hourly[0].feels_like,
        condition_code: hourly[0].condition_code,
        wind_speed: hourly[0].wind_speed,
        wind_gust: hourly[0].wind_gust,
        precipitation_probability: hourly[0].precipitation_probability,
        uv_index: hourly[0].uv_index,
      },
      hourly,
      daily,
    },
    fallback: {
      source: 'sample',
      reason: 'Weather-AI and the fallback live provider were unavailable, so sample data was returned to keep the dashboard usable.',
    },
  }
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
