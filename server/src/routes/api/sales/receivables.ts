import { Router } from "express"
import { handleTransactionUpdateValidation } from "../../../middleware/transactionUpdateValidation.js"
import { updateReceivable } from "../../../controller/receivableController.js"

const router = Router()

router.patch('/:id', handleTransactionUpdateValidation, updateReceivable)

export default router
