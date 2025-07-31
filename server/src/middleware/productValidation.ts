import { NextFunction, Request, Response } from "express"

import { ProductErrors, ProductProps } from '../types/types.js'
import { addErrorProducts, isMissing, rejectExtraFields, validateStringFields } from "../utils/utils.js"


export function handleProductValidation(req: Request<{}, {}, ProductProps>, res: Response, next: NextFunction) {
    if (!req.body) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    const requiredStringFields = [
        "name",
        "description",
        "salePrice",
        "purchasePrice",
        "stock",
    ]
    if (!validateStringFields(req.body, requiredStringFields, res)) {
        return
    }

    req.body.name = req.body.name.toUpperCase()
    const { name, description, salePrice, purchasePrice, stock } = req.body


    const allowedFields = ["name", "description", "salePrice", "purchasePrice", "stock"]
    if (rejectExtraFields(req.body, allowedFields, res)) return

    const errors: ProductErrors = {}

    if (isMissing(name)) addErrorProducts(errors, "name", "Campo obrigatório")
    if (isMissing(description)) addErrorProducts(errors, 'description', "Campo obrigatório")

    if (salePrice == null) {
        addErrorProducts(errors, 'salePrice', "Campo obrigatório")
    } else if (isNaN(salePrice) || salePrice <= 0) {
        addErrorProducts(errors, 'salePrice', "Preço inválido")
    }
    if (purchasePrice == null) {
        addErrorProducts(errors, 'purchasePrice', "Campo obrigatório")
    } else if (isNaN(purchasePrice) || purchasePrice <= 0) {
        addErrorProducts(errors, 'purchasePrice', "Preço inválido")
    }

    if (stock == null) {
        addErrorProducts(errors, 'stock', "Campo obrigatório")
    } else if (isNaN(stock) || stock < 0) {
        addErrorProducts(errors, 'stock', "Estoque inválido")
    }

    const hasError = Object.values(errors).length > 0
    if (hasError) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
