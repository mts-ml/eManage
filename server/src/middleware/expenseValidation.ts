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

    const requiredStringFields = ["name", "value"]
    if (!validateStringFields(req.body, requiredStringFields, res)) return

    const { name, value, description, dueDate, status, bank } = req.body

    const allowedFields = ["name", "value", "description", "dueDate", "status", "bank"]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    const errors: ExpenseErrors = {}

    if (isMissing(name)) {
        errors.name = "Nome da despesa é obrigatório."
    } else if (name.length < 3) {
        errors.name = "Despesa precisa ter pelo menos 3 letras."
    }

    if (isMissing(value)) {
        errors.value = "Valor é obrigatório."
    } else if (isNaN(value) || value <= 0) {
        errors.value = "Valor inválido. Deve ser um número positivo maior que zero."
    }

    if (description != null && typeof description !== "string") {
        errors.description = "Descrição deve ser uma string."
    } else if (typeof description === "string" && description.trim() !== "" && description.length < 3) {
        errors.description = "Descrição precisa ter pelo menos 3 letras."
    }

    if (dueDate != null) {
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const parsedDate = new Date(dueDate);

        if (!isoDateRegex.test(dueDate) || isNaN(parsedDate.getTime())) {
            errors.dueDate = "Data inválida, informe no formato ISO: 'AAAA-MM-DD'.";
        }
    }

    if (status != null && status !== "Pendente" && status !== "Pago") {
        errors.status = "Status deve ser 'Pendente' ou 'Pago'."
    }

    if (status === "Pago" && (!bank || bank.trim() === "")) {
        errors.bank = "Banco é obrigatório quando o status é 'Pago'."
    }

    if (bank != null && typeof bank !== "string") {
        errors.bank = "Banco deve ser uma string."
    }

    const hasError = Object.values(errors).length > 0
    if (hasError) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
