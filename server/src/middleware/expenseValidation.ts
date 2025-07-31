import { NextFunction, Request, Response } from "express"

import { ExpenseErrors, ExpenseProps } from "../types/types.js"
import { isMissing, rejectExtraFields, validateStringFields } from "../utils/utils.js"


export function handleExpenseValidation(
    req: Request<{}, {}, ExpenseProps>,
    res: Response,
    next: NextFunction
) {
    if (!req.body) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    const requiredStringFields = ["name", "value", "description"]
    if (!validateStringFields(req.body, requiredStringFields, res)) return

    const { name, value, description, dueDate } = req.body

    const allowedFields = ["name", "value", "description", "dueDate"]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    const errors: ExpenseErrors = {}

    if (isMissing(name)) {
        errors.name = "Nome da despesa é obrigatório."
    } else if (name.length < 3) {
        errors.name = "Despesa precisa ter pelo menos 3 letras."
    }

    const parsedValue = parseFloat(value)
    if (isMissing(value)) {
        errors.value = "Valor é obrigatório."
    } else if (isNaN(parsedValue) || parsedValue <= 0) {
        errors.value = "Valor inválido. Deve ser um número positivo maior que zero."
    }

    if (isMissing(description)) {
        errors.description = "Descrição é obrigatória."
    } else if (description.length < 3) {
        errors.description = "Descrição muito curta."
    }

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (typeof dueDate === "string" && dueDate.trim() !== "") {
        if (!isoDateRegex.test(dueDate)) {
            errors.dueDate = "Data inválida, informar no formato ISO - 'AAAA-MM-DD'."
        } else {
            const parsedDate = new Date(dueDate)
            if (isNaN(parsedDate.getTime())) {
                errors.dueDate = "Data inválida."
            }
        }
    }


    const hasError = Object.values(errors).length > 0
    if (hasError) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
