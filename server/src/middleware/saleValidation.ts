import { NextFunction, Request, Response } from "express"

import { SalePayload, SaleItem, SaleErrors } from "../types/types.js"


export function handleSaleValidation(req: Request<{}, {}, SalePayload>, res: Response, next: NextFunction) {
    const sale = req.body
    const errors: SaleErrors = {}

    if (!sale) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    if (!sale.clientName || typeof sale.clientName !== "string" || sale.clientName.trim().length === 0) {
        errors.clientName = ["Nome do cliente é obrigatório"]
    }

    if (!sale.clientId || typeof sale.clientId !== "string" || sale.clientId.trim().length === 0) {
        errors.clientId = ["Campo obrigatório"]
    }

    if (!sale.date || typeof sale.date !== "string" || sale.date.trim().length < 8) {
        errors.date = ["Data inválida"]
    }

    if (!Array.isArray(sale.items) || sale.items.length === 0) {
        errors.items = ["Venda deve conter ao menos um item"]
    } else {
        sale.items.forEach((item: SaleItem, index: number) => {
            const itemErrors: string[] = []

            if (!item.productName || typeof item.productName !== "string" || item.productName.trim().length === 0) {
                itemErrors.push("Nome do produto é obrigatório")
            }
            if (!item.productId || typeof item.productId !== "string") itemErrors.push("ID do produto obrigatório")
            if (typeof item.quantity !== "number" || item.quantity <= 0) itemErrors.push("Quantidade inválida")
            if (typeof item.price !== "number" || item.price <= 0) itemErrors.push("Preço inválido")
            if (itemErrors.length > 0) errors[`items[${index}]`] = itemErrors
        })
    }

    if ("paid" in sale && typeof sale.paid !== "boolean") {
        errors.paid = ["Campo 'pago' deve ser booleano"]
    }

    if (typeof sale.total !== "number" || !Number.isFinite(sale.total) || sale.total <= 0) {
        errors.total = ["Total inválido"]
    }

    if (Object.keys(errors).length > 0) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
