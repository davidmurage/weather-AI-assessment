import 'dotenv/config'

export const env = {
  port: process.env.PORT || 8080,
  weatherBaseUrl: process.env.WEATHER_AI_BASE_URL || 'https://api.weather-ai.co',
  weatherApiKey: process.env.WEATHER_AI_API_KEY,
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
}
