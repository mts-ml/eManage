import { NextFunction, Request, Response } from "express"

import { ProductErrors, ProductProps } from '../types/types.js'
import { addErrorProducts, isMissing } from "../utils/utils.js"


export function handleProductValidation(req: Request<{}, {}, ProductProps>, res: Response, next: NextFunction) {
    const { name, description, price, stock } = req.body

    const errors: ProductErrors = {}

    if (isMissing(name)) addErrorProducts(errors, "name", "Campo obrigatório")
    if (isMissing(description)) addErrorProducts(errors, 'description', "Campo obrigatório")

    if (!price || price === "") {
        addErrorProducts(errors, 'price', "Campo obrigatório")
    } else if (isNaN(Number(price)) || Number(price) <= 0) {
        addErrorProducts(errors, 'price', "Preço inválido")
    }

    if (!stock || stock.trim() === "") {
        addErrorProducts(errors, 'stock', "Campo obrigatório")
    } else if (isNaN(Number(stock)) || Number(stock) < 0) {
        addErrorProducts(errors, 'stock', "Estoque inválido")
    }

    const hasError = Object.values(errors).length > 0
    if (hasError) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
