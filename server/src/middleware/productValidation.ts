import { NextFunction, Request, Response } from "express"

import { ProductErrors, ProductProps } from '../types/types.js'
import { addErrorProducts, isMissing, validateStringFields } from "../utils/utils.js"


export function handleProductValidation(req: Request<{}, {}, ProductProps>, res: Response, next: NextFunction) {
    if (!req.body) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    const requiredStringFields = [
        "name",
        "description",
        "price",
        "stock",
    ]
    if (!validateStringFields(req.body, requiredStringFields, res)) {
        return
    }

    req.body.name = req.body.name.toUpperCase()
    const { name, description, price, stock } = req.body


    const errors: ProductErrors = {}

    if (isMissing(name)) addErrorProducts(errors, "name", "Campo obrigatório")
    if (isMissing(description)) addErrorProducts(errors, 'description', "Campo obrigatório")

    if (price === undefined || price === null) {
        addErrorProducts(errors, 'price', "Campo obrigatório")
    } else if (isNaN(price) || price <= 0) {
        addErrorProducts(errors, 'price', "Preço inválido")
    }

    if (stock === undefined || stock === null) {
        addErrorProducts(errors, 'stock', "Campo obrigatório")
    } else if (isNaN(stock) || stock <= 0) {
        addErrorProducts(errors, 'stock', "Estoque inválido")
    }

    const hasError = Object.values(errors).length > 0
    if (hasError) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
