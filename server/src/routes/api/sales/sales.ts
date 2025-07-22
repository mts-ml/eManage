import express from 'express'

import { handleSaleValidation } from '../../../middleware/saleValidation.js'
import { createNewSale, deleteSale, getAllSales, updateSale } from '../../../controller/saleController.js'

const router = express.Router()


router.route('/')
    .get(getAllSales)
    .post(handleSaleValidation, createNewSale)
router.put('/:id', handleSaleValidation, updateSale)
router.delete('/:id', handleSaleValidation, deleteSale)

export default router
