import { Request, Response } from "express"

import { User } from "../model/Users.js"


export async function handleLogout(req: Request, res: Response) {
    const refreshToken = req.cookies.jwt as string | undefined
    if (!refreshToken) {
        res.status(401).json({ message: "Refresh token ausente ou inválido." })
        return
    }

    try {
        const isProduction = process.env.NODE_ENV === "production"

        const foundUser = await User.findOne({ refreshToken })
        if (!foundUser) {
            res.clearCookie('jwt',
                {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? 'none' : 'lax'
                }
            )
            res.sendStatus(204)
            return
        }

        foundUser.refreshToken = ''
        await foundUser.save()

        res.clearCookie('jwt',
            {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? 'none' : 'lax'
            }
        )

        res.sendStatus(204)
    } catch (error) {
        console.error("Erro no logout:", error)
        res.status(500).json({ message: "Erro interno ao tentar fazer logout." })
        return
    }
}
