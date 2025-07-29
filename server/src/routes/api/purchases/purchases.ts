import express from 'express'

import { handleTransactionValidation } from '../../../middleware/transactionValidation.js'
import { createNewPurchase, deletePurchase, getAllPurchases, updatePurchase } from '../../../controller/purchaseController.js'


const router = express.Router()

router.route('/')
    .get(getAllPurchases)
    .post(handleTransactionValidation, createNewPurchase)
router.put('/:id', handleTransactionValidation, updatePurchase)
router.delete('/:id', handleTransactionValidation, deletePurchase)

export default router
