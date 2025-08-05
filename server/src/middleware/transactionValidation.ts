import { NextFunction, Request, Response } from "express"

import { Item, CommonTransactionPayload } from "../types/types.js"
import { rejectExtraFields } from "../utils/utils.js"


export function handleTransactionValidation(req: Request<{}, {}, CommonTransactionPayload>, res: Response, next: NextFunction) {
    const payload = req.body
    if (!payload) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    const allowedFields = [
        "clientId",
        "clientName",
        "date",
        "items",
        "total",
        "paid",
        "status",
        "paymentDate",
        "bank"
    ]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    if (payload.clientName && typeof payload.clientName === "string") {
        payload.clientName = payload.clientName.trim()
    }

    if (Array.isArray(payload.items)) {
        payload.items = payload.items.map(item => {
            if (item.productName && typeof item.productName === "string") {
                item.productName = item.productName.trim().toUpperCase()
            }
            return item
        })
    }

    const errors: Record<string, string[]> = {}

    if (!payload.clientName || typeof payload.clientName !== "string" || payload.clientName.length === 0) {
        errors.clientName = ["Nome do cliente é obrigatório"]
    }

    if (!payload.clientId || typeof payload.clientId !== "string" || payload.clientId.trim().length === 0) {
        errors.clientId = ["Campo obrigatório"]
    }

    if (!payload.date || typeof payload.date !== "string" || payload.date.trim().length < 8) {
        errors.date = ["Data inválida"]
    }

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        errors.items = ["Transação deve conter ao menos um item"]
    } else {
        payload.items.forEach((item: Item, index: number) => {
            const itemErrors: string[] = []

            if (!item.productName || typeof item.productName !== "string" || item.productName.length === 0) {
                itemErrors.push("Nome do produto é obrigatório")
            }
            if (!item.productId || typeof item.productId !== "string") itemErrors.push("ID do produto obrigatório")
            if (typeof item.quantity !== "number" || item.quantity <= 0) itemErrors.push("Quantidade inválida")
            if (typeof item.price !== "number" || item.price <= 0) itemErrors.push("Preço inválido")
            if (itemErrors.length > 0) errors[`items[${index}]`] = itemErrors
        })
    }

    if (typeof payload.total !== "number" || !Number.isFinite(payload.total) || payload.total <= 0) {
        errors.total = ["Total inválido"]
    }

    if (Object.keys(errors).length > 0) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
