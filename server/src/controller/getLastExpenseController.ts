import { NextFunction, Request, Response } from "express"

import { Expense } from "../model/Expenses.js"


export async function getExpense(req: Request, res: Response, next: NextFunction) {
    try {
        const lastExpense = await Expense.findOne().sort({ expenseNumber: -1 })
        if (!lastExpense) {
            res.sendStatus(204)
            return
        }

        res.json({ expense: lastExpense })
    } catch (error) {
        console.error(`getExpense error: ${JSON.stringify(error)}`)
        next(error)
    }
}
