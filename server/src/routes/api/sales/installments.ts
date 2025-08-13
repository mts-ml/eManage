import express from 'express'

import { 
    handlePaymentValidation
} from '../../../middleware/installmentValidation.js'
import { 
    processPayment
} from '../../../controller/installmentController.js'

const router = express.Router()

// Rota para processar pagamentos
router.post('/:saleId/payment', handlePaymentValidation, processPayment)

export default router
