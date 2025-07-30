import { NextFunction, Request, Response } from "express"

import { ClientProps as SupllierProps, ClientErrors as SupplierErrors } from "../types/types.js"
import { addError, isMissing, isValidCNPJ, isValidCPF, validateStringFields } from "../utils/utils.js"


export function handleSupplierValidation(req: Request<{}, {}, SupllierProps>, res: Response, next: NextFunction) {
    const supplierProps = req.body
    if (!supplierProps) {
        res.status(400).json({ message: "Dados ausentes no corpo da requisição." })
        return
    }

    const requiredStringFields = [
        "name",
        "email",
        "phone",
        "cpfCnpj",
        "address",
        "district",
        "city",
    ]

    if (!validateStringFields(supplierProps, requiredStringFields, res)) return

    const errors: SupplierErrors = {}

    if (isMissing(supplierProps.name)) {
        addError(errors, 'name', "Campo obrigatório")
    } else if (supplierProps.name.trim().length < 3) {
        addError(errors, 'name', "Nome deve ter pelo menos 3 caracteres")
    }

    if (isMissing(supplierProps.email)) {
        addError(errors, 'email', "Campo obrigatório")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierProps.email)) {
        addError(errors, 'email', "Email inválido")
    }

    if (isMissing(supplierProps.phone)) {
        addError(errors, 'phone', "Campo obrigatório")
    } else {
        const phoneDigits = supplierProps.phone.replace(/\D/g, '')
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            addError(errors, 'phone', "Telefone inválido")
        }
    }

    if (isMissing(supplierProps.cpfCnpj)) {
        addError(errors, 'cpfCnpj', "Campo obrigatório")
    } else {
        const cleaned = supplierProps.cpfCnpj.replace(/\D/g, '')
        if (cleaned.length === 11) {
            if (!isValidCPF(cleaned)) addError(errors, 'cpfCnpj', "CPF inválido")
        } else if (cleaned.length === 14) {
            if (!isValidCNPJ(cleaned)) addError(errors, 'cpfCnpj', "CNPJ inválido")
        } else {
            addError(errors, 'cpfCnpj', "Documento inválido")
        }
    }

    if (isMissing(supplierProps.address)) {
        addError(errors, 'address', "Campo obrigatório")
    } else if (supplierProps.address.trim().length < 5) {
        addError(errors, 'address', "Endereço muito curto")
    }

    if (isMissing(supplierProps.district)) addError(errors, 'district', "Campo obrigatório")
    if (isMissing(supplierProps.city)) addError(errors, 'city', "Campo obrigatório")

    const hasErrors = Object.values(errors).length > 0
    if (hasErrors) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
