import express from 'express'
import { getSales } from '../../../controller/getSalesController'


const router = express.Router()

router.get('/', getSales)

export default router
