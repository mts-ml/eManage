import express from 'express'

import { handleTransactionValidation } from '../../../middleware/transactionValidation.js'
import { createNewSale, deleteSale, getAllSales, getSalesHistory, updateSale } from '../../../controller/saleController.js'

const router = express.Router()


router.route('/')
    .get(getAllSales)
    .post(handleTransactionValidation, createNewSale)
router.get('/history', getSalesHistory)
router.put('/:id', handleTransactionValidation, updateSale)
router.delete('/:id', deleteSale)

export default router
