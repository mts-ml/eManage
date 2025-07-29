import express from 'express'

import { getSale } from '../../../controller/getLastSaleController.js'


const router = express.Router()

router.get('/', getSale)

export default router
