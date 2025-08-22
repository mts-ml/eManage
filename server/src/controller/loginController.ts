import { Request, Response } from "express"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import { UserProps } from "../types/types.js"
import { User } from "../model/Users.js"
import { logError } from "../utils/logger.js"


export async function loginController(req: Request<{}, {}, UserProps>, res: Response): Promise<void> {
    const { email, password } = req.body

    try {
        const foundUser = await User.findOne({ email })
        if (!foundUser) {
            res.status(401).json({ message: "Credenciais inválidas" })
            return
        }

        const matchPassword = await bcrypt.compare(password, foundUser.password)
        if (!matchPassword) {
            res.status(401).json({ message: "Credenciais inválidas" })
            return
        }

        const roles = Object.values(foundUser.roles).filter(role => role !== undefined)

        const accessToken = jwt.sign(
            {
                UserInfo: {
                    name: foundUser.name,
                    email: foundUser.email,
                    roles
                },
            },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: '300s' }
        )

        const refreshToken = jwt.sign(
            {
                UserInfo: {
                    name: foundUser.name,
                    email: foundUser.email,
                    roles
                }
            },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '1d' }
        )

        foundUser.refreshToken = refreshToken
        await foundUser.save()

        const isProduction = process.env.NODE_ENV === "production"
        res.cookie('jwt',
            refreshToken,
            {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        )

        res.json({ accessToken })
    } catch (error) {
        if (error instanceof Error) {
            logError("LoginController - Login error", error.message)
            logError("LoginController - Stack trace", error.stack)
        } else {
            logError("LoginController", error)
        }
    }
}
