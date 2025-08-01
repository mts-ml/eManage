import { NextFunction, Request, Response } from "express"
import mongoose from "mongoose"

import { Expense } from "../model/Expenses.js"
import { ExpenseProps } from "../types/types.js"


export async function getAllExpenses(req: Request, res: Response, next: NextFunction) {
    try {
        const expenses = await Expense.find()
        if (expenses.length === 0) {
            res.sendStatus(204)
            return
        }

        res.json(expenses)
    } catch (error) {
        next(error)
    }
}

export async function createNewExpense(req: Request<{}, {}, ExpenseProps>, res: Response, next: NextFunction) {
    try {
        const { name, value, description, dueDate } = req.body
        const expenseProps = { name, value, description, dueDate }

        console.log("Payload para criar Expense:", expenseProps)
        const newExpense = await Expense.create(expenseProps)

        res.status(201).json(newExpense)
    } catch (error) {
        next(error)
    }
}

export async function updateExpense(req: Request<{ id: string }, {}, ExpenseProps>, res: Response, next: NextFunction) {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const updateExpense = await Expense.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })

        if (!updateExpense) {
            res.status(404).json({ message: "Despesa não encontrada." })
            return
        }

        res.json(updateExpense)
    } catch (error) {
        next(error)
    }
}

export async function deleteExpense(req: Request<{ id: string }, {}, ExpenseProps>, res: Response, next: NextFunction) {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ message: "Id inválido ou ausente." })
        return
    }

    try {
        const deletedExpense = await Expense.findByIdAndDelete(id)
        if (!deleteExpense) {
            res.status(404).json({ message: "Despesa não encontrada." })
            return
        }

        res.json({ message: `Despesa ${deletedExpense} deletada com sucesso.` })
    } catch (error) {
        next(error)
    }
}
