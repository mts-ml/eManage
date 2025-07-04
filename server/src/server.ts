import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import login from './routes/login.js'
import register from './routes/register.js'
import { errorHandler } from './middleware/errorHandler.js'
import { connectDB } from './config/dbConnection.js'
import mongoose from 'mongoose'


const PORT = process.env.PORT || 3500
const app = express()

connectDB()

app.use(express.json())

// CORS
const allowedOrigins = process.env.NODE_ENV === "production" ?
    process.env.FRONTEND_PROD_URL
    :
    process.env.FRONTEND_DEV_URL
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

app.use("/login", login)
app.use('/register', register)

// Tratamento de erros
app.use(errorHandler)

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))
})
