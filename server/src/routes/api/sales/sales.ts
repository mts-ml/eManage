import express from 'express'

import { handleSaleValidation } from '../../../middleware/transactionValidation.js'
import { createNewSale, deleteSale, getAllSales, getSalesHistory, updateSale } from '../../../controller/saleController.js'

const router = express.Router()


router.route('/')
    .get(getAllSales)
    .post(handleSaleValidation, createNewSale)
router.get('/history', getSalesHistory)
router.put('/:id', handleSaleValidation, updateSale)
router.delete('/:id', deleteSale)

export default router
