import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const configDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(configDir, '../.env') })

function toPositiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const env = {
  port: process.env.PORT || 8080,
  weatherBaseUrl: process.env.WEATHER_AI_BASE_URL || 'https://api.weather-ai.co',
  weatherApiKey: process.env.WEATHER_AI_API_KEY,
  weatherAiTimeoutMs: toPositiveNumber(process.env.WEATHER_AI_TIMEOUT_MS, 12000),
  fallbackWeatherTimeoutMs: toPositiveNumber(process.env.FALLBACK_WEATHER_TIMEOUT_MS, 10000),
  geocodingTimeoutMs: toPositiveNumber(process.env.GEOCODING_TIMEOUT_MS, 8000),
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}
