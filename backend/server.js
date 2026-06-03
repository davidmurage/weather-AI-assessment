import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import apiRoutes from './routes/apiRoutes.js'

const app = express()

app.use(cors({ origin: env.frontendOrigins }))
app.use(express.json())
app.use('/api', apiRoutes)

app.listen(env.port, () => {
  console.log(`Weather-AI dashboard backend running on port ${env.port}`)
})
