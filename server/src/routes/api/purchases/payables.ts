import express from 'express'

import { handleTransactionUpdateValidation } from '../../../middleware/transactionUpdateValidation.js'
import { payableController, getAllPayables } from '../../../controller/payableController.js'


const router = express.Router()

router.route('/')
    .get(getAllPayables)
router.patch('/:id', handleTransactionUpdateValidation, payableController)

export default router
