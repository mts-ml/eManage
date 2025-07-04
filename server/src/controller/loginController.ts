import { Request, Response } from "express"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { UserProps } from "../types/types.js"
import { User } from "../model/Users.js"


export async function loginController(req: Request<{}, {}, UserProps>, res: Response): Promise<void> {
    const { email, password } = req.body

    try {
        const foundUser = await User.findOne({ email })
        if (!foundUser) {
            res.status(401).json({ message: "Credenciais inválidas"})
            return
        }

        const matchPassword = await bcrypt.compare(password, foundUser.password)
        if (matchPassword) {
            const accessToken = jwt.sign({
                
            })
        }

    } catch (error) {
        if (error instanceof Error) {
            console.error("Erro no login:", error.message)
            console.error("Stack trace:", error.stack)
        } else {
            console.error("Erro desconhecido:", error)
        }

        res.status(500).json({
            message: "Erro interno no servidor"
        })
    }
}
