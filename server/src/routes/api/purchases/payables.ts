import { Router } from "express"
import { handleTransactionUpdateValidation } from "../../../middleware/transactionUpdateValidation.js"
import { updatePayable } from "../../../controller/payableController.js"

const router = Router()

router.patch('/:id', handleTransactionUpdateValidation, updatePayable)

export default router
