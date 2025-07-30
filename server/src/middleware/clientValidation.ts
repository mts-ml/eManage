import { NextFunction, Request, Response } from "express"

import { ClientProps, ClientErrors } from "../types/types.js"
import { addError, isMissing, isValidCNPJ, isValidCPF, validateStringFields } from "../utils/utils.js"


export function handleClientValidation(req: Request<{}, {}, ClientProps>, res: Response, next: NextFunction) {
    const clientProps = req.body
    if (!clientProps) {
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

    if (!validateStringFields(clientProps, requiredStringFields, res)) {
        return
    }

    const errors: ClientErrors = {}

    if (isMissing(clientProps.name)) {
        addError(errors, 'name', "Campo obrigatório")
    } else if (clientProps.name.trim().length < 3) {
        addError(errors, 'name', "Nome deve ter pelo menos 3 caracteres")
    }

    if (isMissing(clientProps.email)) {
        addError(errors, 'email', "Campo obrigatório")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientProps.email)) {
        addError(errors, 'email', "Email inválido")
    }

    if (isMissing(clientProps.phone)) {
        addError(errors, 'phone', "Campo obrigatório")
    } else {
        const phoneDigits = clientProps.phone.replace(/\D/g, '')
        if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            addError(errors, 'phone', "Telefone inválido")
        }
    }

    if (isMissing(clientProps.cpfCnpj)) {
        addError(errors, 'cpfCnpj', "Campo obrigatório")
    } else {
        const cleaned = clientProps.cpfCnpj.replace(/\D/g, '')
        if (cleaned.length === 11) {
            if (!isValidCPF(cleaned)) addError(errors, 'cpfCnpj', "CPF inválido")
        } else if (cleaned.length === 14) {
            if (!isValidCNPJ(cleaned)) addError(errors, 'cpfCnpj', "CNPJ inválido")
        } else {
            addError(errors, 'cpfCnpj', "Documento inválido")
        }
    }

    if (isMissing(clientProps.address)) {
        addError(errors, 'address', "Campo obrigatório")
    } else if (clientProps.address.trim().length < 5) {
        addError(errors, 'address', "Endereço muito curto")
    }

    if (isMissing(clientProps.district)) addError(errors, 'district', "Campo obrigatório")
    if (isMissing(clientProps.city)) addError(errors, 'city', "Campo obrigatório")

    const hasErrors = Object.values(errors).length > 0
    if (hasErrors) {
        res.status(400).json({ message: errors })
        return
    }

    next()
}
