import express from 'express'

import { handleTransactionUpdateValidation } from '../../../middleware/transactionUpdateValidation.js'
import { receivableController } from '../../../controller/receivableController.js'


const router = express.Router()

router.patch('/:id', handleTransactionUpdateValidation, receivableController)

export default router
