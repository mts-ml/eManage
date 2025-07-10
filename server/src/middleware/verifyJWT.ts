import { NextFunction, Request, Response } from "express"
import jwt from 'jsonwebtoken'

import { CustomJwtPayload } from "../types/types.js"

interface CustomRequest extends Request {
    name: string
    email: string
    roles: number[]
}


export function verifyJWT(req: CustomRequest, res: Response, next: NextFunction) {
    const authorizationHeader = req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token inválido ou ausente." })
        return
    }

    console.log(authorizationHeader)

    const token = authorizationHeader.split(" ")[1]
    try {
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!,
        ) as CustomJwtPayload

        if (!decodedToken.UserInfo) {
            res.status(401).json({ message: "Token inválido." })
            return
        }

        req.name = decodedToken.UserInfo.name
        req.email = decodedToken.UserInfo.email
        req.roles = decodedToken.UserInfo.roles
        next()
    } catch (error) {
        console.log(error)       
        res.status(401).json({ message: "Token expirado ou inválido." })
    } 
}
