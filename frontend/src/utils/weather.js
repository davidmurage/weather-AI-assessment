import { CONDITION_LABELS } from '../constants/weather.js'

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

function pickArray(source, ...keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((current, part) => current?.[part], source)
    if (Array.isArray(value)) return value
  }
  return []
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatTemp(value) {
  const number = toNumber(value)
  return number === null ? '--' : `${Math.round(number)} C`
}

export function formatSpeed(value) {
  const number = toNumber(value)
  return number === null ? '--' : `${Math.round(number)} km/h`
}

export function formatPercent(value) {
  const number = toNumber(value)
  return number === null ? '--' : `${Math.round(number)}%`
}

function conditionFrom(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return CONDITION_LABELS[value] || `Code ${value}`
  return 'Forecast available'
}

function conditionLabel(value) {
  const numericCode = toNumber(value)

  if (numericCode !== null) {
    return CONDITION_LABELS[numericCode] || `Code ${numericCode}`
  }

  return conditionFrom(value)
}

function generateSummary(current, daily) {
  if (!current?.temperature) return null

  const rainChance = toNumber(daily?.[0]?.precipitationProbability)
  const condition = current.condition || 'forecast conditions'
  const temp = formatTemp(current.temperature)
  const wind = formatSpeed(current.wind)

  if (rainChance !== null) {
    return `Today is ${condition.toLowerCase()} around ${temp}, with a ${Math.round(rainChance)}% chance of precipitation and winds near ${wind}.`
  }

  return `Today is ${condition.toLowerCase()} around ${temp}, with winds near ${wind}.`
}

function normalizeDailyObjects(daily) {
  if (!Array.isArray(daily)) return []

  return daily.slice(0, 7).map((day) => ({
    time: day.date || day.time,
    high: firstValue(day.temp_max, day.temperature_max, day.max_temp, day.high),
    low: firstValue(day.temp_min, day.temperature_min, day.min_temp, day.low),
    condition: conditionLabel(firstValue(day.condition, day.condition_code, day.weathercode, day.weather_code)),
    icon: day.icon,
    precipitationProbability: day.precipitation_probability,
    precipitationSum: day.precipitation_sum,
    windMax: day.wind_max,
    sunrise: day.sunrise,
    sunset: day.sunset,
  }))
}

function normalizeHourlyObjects(hourly, currentTime) {
  if (!Array.isArray(hourly)) return []

  const currentTimestamp = currentTime ? new Date(currentTime).getTime() : Date.now()
  const upcomingHours = hourly.filter((hour) => {
    const hourTimestamp = new Date(hour.time).getTime()
    return Number.isFinite(hourTimestamp) && hourTimestamp >= currentTimestamp
  })
  const visibleHours = upcomingHours.length ? upcomingHours : hourly

  return visibleHours.slice(0, 8).map((hour) => ({
    time: hour.time,
    temp: firstValue(hour.temperature, hour.temperature_2m, hour.temp),
    condition: conditionLabel(firstValue(hour.condition, hour.condition_code, hour.weathercode, hour.weather_code)),
    icon: hour.icon,
    humidity: hour.humidity,
    feelsLike: hour.feels_like,
    precipitationProbability: hour.precipitation_probability,
    wind: hour.wind_speed,
    windGust: hour.wind_gust,
    uvIndex: hour.uv_index,
  }))
}

function findNearestHourly(hourly, currentTime) {
  if (!Array.isArray(hourly) || !hourly.length) return null

  const currentTimestamp = currentTime ? new Date(currentTime).getTime() : Date.now()
  if (!Number.isFinite(currentTimestamp)) return hourly[0]

  return hourly.reduce((nearest, hour) => {
    const hourTimestamp = new Date(hour.time).getTime()
    const nearestTimestamp = new Date(nearest.time).getTime()

    if (!Number.isFinite(hourTimestamp)) return nearest

    return Math.abs(hourTimestamp - currentTimestamp) < Math.abs(nearestTimestamp - currentTimestamp)
      ? hour
      : nearest
  }, hourly[0])
}

export function normalizeWeather(payload, fallbackPlace) {
  const data = payload?.data || payload || {}
  const current = data.current || data.current_weather || data.weather?.current || data.now || {}
  const daily = data.daily || data.forecast?.daily || data.weather?.daily || {}
  const location = data.location || data.geo || {}

  const dailyTimes = pickArray(data, 'daily.time', 'daily.dates', 'forecast.daily.time', 'forecast.days')
  const maxTemps = pickArray(data, 'daily.temperature_2m_max', 'daily.temp_max', 'daily.max_temp', 'forecast.daily.temperature_2m_max')
  const minTemps = pickArray(data, 'daily.temperature_2m_min', 'daily.temp_min', 'daily.min_temp', 'forecast.daily.temperature_2m_min')
  const dailyCodes = pickArray(data, 'daily.weathercode', 'daily.weather_code', 'daily.conditions', 'forecast.daily.weathercode')

  const hourlyTimes = pickArray(data, 'hourly.time', 'hourly.times', 'forecast.hourly.time')
  const hourlyTemps = pickArray(data, 'hourly.temperature_2m', 'hourly.temperature', 'hourly.temps', 'forecast.hourly.temperature_2m')
  const hourlyCodes = pickArray(data, 'hourly.weathercode', 'hourly.weather_code', 'hourly.conditions', 'forecast.hourly.weathercode')
  const normalizedDaily = Array.isArray(daily)
    ? normalizeDailyObjects(daily)
    : dailyTimes.slice(0, 7).map((time, index) => ({
        time,
        high: maxTemps[index],
        low: minTemps[index],
        condition: conditionLabel(dailyCodes[index] ?? daily.conditions?.[index]),
      }))
  const nearestHourly = findNearestHourly(data.hourly, current.time)
  const normalizedHourly = Array.isArray(data.hourly)
    ? normalizeHourlyObjects(data.hourly, current.time)
    : hourlyTimes.slice(0, 8).map((time, index) => ({
        time,
        temp: hourlyTemps[index],
        condition: conditionLabel(hourlyCodes[index]),
      }))
  const normalizedCurrent = {
    temperature: firstValue(current.temperature, current.temperature_2m, current.temp, data.temperature),
    condition: conditionLabel(firstValue(current.condition, current.condition_code, current.weathercode, current.weather_code)),
    humidity: firstValue(current.humidity, current.relative_humidity_2m, current.relativeHumidity, nearestHourly?.humidity),
    wind: firstValue(current.wind_speed, current.windspeed, current.wind_speed_10m, current.windSpeed),
    feelsLike: firstValue(current.feels_like, current.apparent_temperature, nearestHourly?.feels_like),
    uvIndex: firstValue(current.uv_index, nearestHourly?.uv_index),
    windGust: firstValue(current.wind_gust, nearestHourly?.wind_gust),
    icon: current.icon,
    precipitationProbability: firstValue(current.precipitation_probability, nearestHourly?.precipitation_probability),
  }

  return {
    raw: data,
    locationName: firstValue(
      location.name,
      location.city,
      data.city,
      payload?.geoHeaders?.city,
      fallbackPlace.name,
    ),
    coordinates: {
      lat: firstValue(location.lat, data.lat, data.latitude, fallbackPlace.lat),
      lon: firstValue(location.lon, data.lon, data.longitude, fallbackPlace.lon),
    },
    summary: firstValue(data.ai_summary, data.summary, data.ai?.summary, data.insights?.summary, generateSummary(normalizedCurrent, normalizedDaily)),
    current: normalizedCurrent,
    daily: normalizedDaily,
    hourly: normalizedHourly,
    rateLimit: payload?.rateLimit,
  }
}

export function parseCoordinateQuery(query) {
  const coordinateMatch = query.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)

  if (!coordinateMatch) return null

  return {
    name: `${coordinateMatch[1]}, ${coordinateMatch[2]}`,
    lat: Number(coordinateMatch[1]),
    lon: Number(coordinateMatch[2]),
  }
}
