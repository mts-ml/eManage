import express from 'express'

import { handleReceivableValidation } from '../../../middleware/receivableValidation.js'
import { receivableController } from '../../../controller/receivableController.js'


const router = express.Router()

router.patch('/:id', handleReceivableValidation, receivableController)

export default router
