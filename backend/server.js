import cors from 'cors'
import express from 'express'
import { corsOptions } from './config/cors.js'
import { env } from './config/env.js'
import apiRoutes from './routes/apiRoutes.js'

const app = express()

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())
app.use('/api', apiRoutes)

app.listen(env.port, () => {
  console.log(`Weather-AI dashboard backend running on port ${env.port}`)
})
