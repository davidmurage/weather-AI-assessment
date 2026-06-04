# Weather-AI Smart Forecast Dashboard

A React + Node.js dashboard that consumes the Weather-AI developer API through a secure Express proxy. Users can search for a city or enter coordinates, then view current conditions, a 7-day forecast, hourly forecast cards, and the AI summary returned by Weather-AI.

## Features

- Search by city or latitude/longitude.
- Backend geocoding proxy using OpenStreetMap Nominatim.
- Weather-AI `/v1/forecast` integration with `ai=true`.
- Weather-AI `/v1/weather-geo` support for network location detection.
- Weather-AI `/v1/usage` support for quota visibility when available.
- Responsive React dashboard with loading and error states.
- API key stays in the backend `.env`, never in the browser bundle.

## Project Structure

```txt
backend/   Express proxy with controllers, routes, services, and config
frontend/  React + Vite dashboard with reusable components and API services
```

## Prerequisites

- Node.js 18 or newer.
- A Weather-AI API key from https://weather-ai.co/.

## Getting Started

Clone the repository:

```bash
git clone https://github.com/davidmurage/weather-AI-assessment.git
```

Navigate into the project root:

```bash
cd weather-ai-assessment
```

Then install and run the backend and frontend from their respective folders.

## Backend Setup

```bash
cd backend
npm install
```

Update `backend/.env`:

```env
WEATHER_AI_API_KEY=wai_your_key_here
WEATHER_AI_BASE_URL=https://api.weather-ai.co
PORT=8080
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,https://weather-ai-assessment.vercel.app
```

Run the backend:

```bash
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

Frontend API calls import `BASE_URL` from `frontend/src/config.jsx`. The deployed backend URL currently configured there is:

```txt
https://weather-ai-assessment.onrender.com
```

For local-only development, you can set `VITE_API_BASE_URL=http://localhost:8080` in the frontend environment or change the fallback in `frontend/src/config.jsx`.

## Production Environment

Backend deployment variables:

```env
WEATHER_AI_API_KEY=wai_your_key_here
WEATHER_AI_BASE_URL=https://api.weather-ai.co
PORT=8080
FRONTEND_ORIGIN=https://weather-ai-assessment.vercel.app
```

Frontend deployment variable:

```env
VITE_API_BASE_URL=https://weather-ai-assessment.onrender.com
```

Deploy the backend to Render, then deploy the frontend to Vercel with the backend URL set as `VITE_API_BASE_URL`.

If you need multiple allowed frontend origins, separate them with commas:

```env
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,https://weather-ai-assessment.vercel.app
```

## API Routes

- `GET /api/weather?lat=-1.2921&lon=36.8219&days=7&ai=true`
- `GET /api/weather-geo?ip=auto&days=7&ai=true`
- `GET /api/geocode?q=Nairobi`
- `GET /api/usage`
- `GET /api/health`

## Notes

Weather-AI requests require an `Authorization: Bearer wai_<key>` header. This app sends that header only from the Express backend so the key is not exposed in React.

