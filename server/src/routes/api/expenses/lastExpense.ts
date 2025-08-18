import express from 'express'

import { getExpense } from '../../../controller/getLastExpenseController.js'


const router = express.Router()

router.get('/', getExpense)

export default router
