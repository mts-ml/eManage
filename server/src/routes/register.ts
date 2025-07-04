import express from 'express'

import { formRegisterValidation } from '../middleware/registerValidation.js'
import { registerController } from '../controller/registerController.js'


const router = express.Router()

router.post("/", formRegisterValidation, registerController)

export default router
