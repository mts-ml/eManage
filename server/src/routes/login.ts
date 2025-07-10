import express from 'express'

import { loginValidation } from '../middleware/loginValidation.js'
import { loginController } from '../controller/loginController.js'


const router = express.Router()

router.post('/', loginValidation, loginController)

export default router
