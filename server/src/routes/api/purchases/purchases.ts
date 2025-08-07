import express from 'express'

import { handlePurchaseValidation } from '../../../middleware/transactionValidation.js'
import { createNewPurchase, deletePurchase, getAllPurchases, getPurchasesHistory, updatePurchase } from '../../../controller/purchaseController.js'


const router = express.Router()

router.route('/')
    .get(getAllPurchases)
    .post(handlePurchaseValidation, createNewPurchase)
router.get('/history', getPurchasesHistory)
router.put('/:id', handlePurchaseValidation, updatePurchase)
router.delete('/:id', deletePurchase)

export default router
