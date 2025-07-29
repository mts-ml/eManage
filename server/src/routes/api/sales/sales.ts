import express from 'express'

import { handleTransactionValidation } from '../../../middleware/transactionValidation.js'
import { createNewSale, deleteSale, getAllSales, updateSale } from '../../../controller/saleController.js'

const router = express.Router()


router.route('/')
    .get(getAllSales)
    .post(handleTransactionValidation, createNewSale)
router.put('/:id', handleTransactionValidation, updateSale)
router.delete('/:id', handleTransactionValidation, deleteSale)

export default router
