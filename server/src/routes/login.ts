import express from 'express'
import { loginValidation } from '../middleware/loginValidation'
import { loginController } from '../controller/loginController'


const router = express.Router()

router.post('/', loginValidation, loginController)

export default router
