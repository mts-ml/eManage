import express, { Request, Response } from 'express'

import { handleExpenseValidation } from '../../middleware/expenseValidation.js'


const router = express.Router()

router.route('/')
    .post(handleExpenseValidation, (req: Request, res: Response) => {
        res.json({ message: "ROTA EXPENSE" })
    })

export default router
