import { NextFunction, Request, Response } from "express";
import { UserProps } from "../types/types";


export function loginValidation(req: Request<{}, {}, UserProps>, res: Response, next: NextFunction) {
    const { email, password } = req.body || {}

    const error = {
        email: "",
        password: "",
        geral: ""
    }

    if (!email || !password) {
        error.geral = "Email e senha são campos obrigatórios."
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) {
            error.email = "Formato de email inválido."
        }
        if (password.length < 8) {
            error.password = "A senha deve ter no mínimo 8 caracteres."
        }
    }

    if (Object.values(error).length > 0) {
        res.status(400).json({
            message: error
        })
        return
    } else {
        next()
    }
}
