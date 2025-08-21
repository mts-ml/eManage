import { Request, Response } from "express"
import jwt from 'jsonwebtoken'

import { User } from "../model/Users.js"
import { CustomJwtPayload } from "../types/types.js"


export async function handleRefreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies.jwt as string | undefined
    if (!refreshToken) {
        res.status(401).json({ message: "Token ausente ou inválido." })
        return
    }

    try {
        const decodedToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        ) as CustomJwtPayload

        const foundUser = await User.findOne({ email: decodedToken.UserInfo.email })
        if (!foundUser || foundUser.refreshToken !== refreshToken) {
            res.status(403).json({ message: "Usuário não autorizado." })
            return
        }

        const roles = Object.values(foundUser.roles).filter(value => value !== undefined)
        const newAccessToken = jwt.sign(
            {
                UserInfo: {
                    name: foundUser.name,
                    email: foundUser.email,
                    roles
                }
            },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "300s" }
        )

        res.json({ accessToken: newAccessToken })
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(403).json({
                message: "Refresh token expirado."
            })
            return
        }
        console.log(error)
        res.sendStatus(500).json({ message: "Erro interno do servidor." })
    }
}
