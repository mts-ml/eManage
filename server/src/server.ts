import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'

import { errorHandler } from './middleware/errorHandler.js'
import { connectDB } from './config/dbConnection.js'
import { verifyJWT } from './middleware/verifyJWT.js'

import login from './routes/login.js'
import register from './routes/register.js'
import refresh from './routes/refresh.js'
import logout from './routes/logout.js'
import clients from './routes/api/clients.js'
import suppliers from './routes/api/suppliers.js'
import products from './routes/api/products.js'
import sales from './routes/api/sales/sales.js'
import lastSale from './routes/api/sales/lastSale.js'
import receivables from './routes/api/sales/receivables.js'
import installments from './routes/api/sales/installments.js'
import lastPurchase from './routes/api/purchases/lastPurchase.js'
import purchases from './routes/api/purchases/purchases.js'
import payables from './routes/api/purchases/payables.js'
import expenses from './routes/api/expenses.js'


const PORT = process.env.PORT || 3500
const app = express()

connectDB()

app.use(express.json())
app.use(cookieParser())

// CORS
const allowedOrigins = process.env.NODE_ENV === "production" ?
    process.env.FRONTEND_PROD_URL
    :
    process.env.FRONTEND_DEV_URL

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

app.get('/', (req: Request, res: Response) => {
    res.json({ message: "API funcionando" })
})

app.use("/login", login)
app.use('/register', register)
app.use('/refresh', refresh)

app.use(verifyJWT)
app.use('/logout', logout)
app.use('/clients', clients)
app.use('/suppliers', suppliers)
app.use('/products', products)
app.use('/sales/last', lastSale)
app.use('/sales', sales)
app.use('/receivables', receivables)
app.use('/installments', installments)
app.use('/purchases/last', lastPurchase)
app.use('/purchases', purchases)
app.use('/payables', payables)
app.use('/expenses', expenses)

app.get("/healthz", (req: Request, res: Response) => {
    res.sendStatus(200)
    return
})

// Tratamento de erros
app.use(errorHandler)

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))
})
