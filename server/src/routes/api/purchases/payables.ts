import express from 'express'

import { handleTransactionUpdateValidation } from '../../../middleware/transactionUpdateValidation.js'
import { payableController } from '../../../controller/payableController.js'


const router = express.Router()

router.patch('/:id', handleTransactionUpdateValidation, payableController)

export default router
