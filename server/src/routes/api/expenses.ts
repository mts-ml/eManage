import express from 'express'

import { handleExpenseValidation } from '../../middleware/expenseValidation.js'
import { createNewExpense, deleteExpense, getAllExpenses, updateExpense } from '../../controller/expenseController.js'
import lastExpenseRouter from './expenses/lastExpense.js'


const router = express.Router()

router.route('/')
    .get(getAllExpenses)
    .post(handleExpenseValidation, createNewExpense)
router.put('/:id', handleExpenseValidation, updateExpense)
router.delete('/:id', deleteExpense)

router.use('/lastExpense', lastExpenseRouter)

export default router
