import { Router } from 'express'
import { geocodeLocation } from '../controllers/geocodeController.js'
import { getHealth } from '../controllers/healthController.js'
import { getForecast, getGeoForecast, getUsage } from '../controllers/weatherController.js'
import { requireApiKey } from '../middleware/requireApiKey.js'

const router = Router()

router.get('/health', getHealth)
router.get('/geocode', geocodeLocation)
router.get('/weather', requireApiKey, getForecast)
router.get('/weather-geo', requireApiKey, getGeoForecast)
router.get('/usage', requireApiKey, getUsage)

export default router
