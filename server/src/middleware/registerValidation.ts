import { NextFunction, Request, Response } from "express"

import { RegisterProps } from "../types/types.js"


export function formRegisterValidation(req: Request<{}, {}, RegisterProps>, res: Response, next: NextFunction) {
    const { name, email, password } = req.body || {}

    const validationErrors: Partial<Record<keyof RegisterProps, string[]>> = {}

    if (!name) {
        validationErrors.name = ["Campo obrigatório"]
    } else if (name.trim().split(" ").length < 2) {
        validationErrors.name = ["Inserir nome completo"]
    }

    if (!email) {
        validationErrors.email = [...(validationErrors.email || []), "Campo obrigatório"]
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            validationErrors.email = [...(validationErrors.email || []), "Endereço de email inválido"]
        }
    }

    if (!password) {
        validationErrors.password = [...(validationErrors.password || []), "Campo obrigatório"]
    } else if (password.length < 8) {
        validationErrors.password = [...(validationErrors.password || []), "Mínimo de 8 caracteres"]
    }

    const hasNumber = /\d/.test(password)
    const hasUpperCaseLetter = /[A-Z]/.test(password)
    const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasNumber) {
        validationErrors.password = [...(validationErrors.password || []), "Necessário 1 número"]
    }
    if (!hasUpperCaseLetter) {
        validationErrors.password = [...(validationErrors.password || []), "Letra maiúscula"]
    }
    if (!hasSpecialCharacter) {
        validationErrors.password = [...(validationErrors.password || []), "Caractere especial"]
    }

    if (Object.values(validationErrors).length > 0) {
        res.status(400).json({ message: validationErrors })
        return
    }

    next()
}
