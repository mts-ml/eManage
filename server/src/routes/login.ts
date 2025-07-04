import express, { Request, Response } from 'express'
import { loginValidation } from '../middleware/loginValidation'


const router = express.Router()

router.post('/', loginValidation, (req: Request, res: Response) => {
    res.json({ message: "Essa é a rota /login" })
})

export default router
